import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function wait(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForImages(root) {
  const images = Array.from(root.querySelectorAll("img"));

  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();

      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );
}

async function waitForFonts() {
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore font loading error
    }
  }
}

export async function exportReportPdf({
  elementId = "angelbird-report-export",
  filename = "angelbird-report.pdf",
} = {}) {
  const target = document.getElementById(elementId);

  if (!target) {
    alert("PDF export area not found.");
    return;
  }

  const originalBodyOverflow = document.body.style.overflow;
  const originalHtmlOverflow = document.documentElement.style.overflow;

  try {
    document.body.style.overflow = "visible";
    document.documentElement.style.overflow = "visible";

    target.classList.add("pdf-exporting");

    await waitForFonts();
    await waitForImages(target);

    // Important for Recharts / responsive charts / tab content
    window.dispatchEvent(new Event("resize"));
    await wait(500);

    const canvas = await html2canvas(target, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: target.scrollWidth,
      windowHeight: target.scrollHeight,
      width: target.scrollWidth,
      height: target.scrollHeight,
      scrollX: 0,
      scrollY: -window.scrollY,
      onclone: (clonedDocument) => {
        const clonedTarget = clonedDocument.getElementById(elementId);

        if (clonedTarget) {
          clonedTarget.style.display = "block";
          clonedTarget.style.visibility = "visible";
          clonedTarget.style.opacity = "1";
          clonedTarget.style.height = "auto";
          clonedTarget.style.maxHeight = "none";
          clonedTarget.style.overflow = "visible";
        }

        clonedDocument
          .querySelectorAll(".no-print, .pdf-hide")
          .forEach((el) => {
            el.style.display = "none";
          });

        clonedDocument
          .querySelectorAll(".recharts-wrapper, .recharts-responsive-container")
          .forEach((el) => {
            el.style.overflow = "visible";
          });
      },
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      alert("PDF export failed because the report content was empty.");
      return;
    }

    const imgData = canvas.toDataURL("image/jpeg", 0.82);

    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");

    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error("[PDF Export Error]", error);
    alert("PDF export failed. Check console for details.");
  } finally {
    target.classList.remove("pdf-exporting");
    document.body.style.overflow = originalBodyOverflow;
    document.documentElement.style.overflow = originalHtmlOverflow;
  }
}