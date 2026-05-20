import { Download, Loader2, Printer } from "lucide-react";
import { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function getFileName(title = "angelbird-report") {
  const clean = String(title)
    .toLowerCase()
    .replace(/[^\w]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${clean || "angelbird-report"}.pdf`;
}

function wait(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForFonts() {
  if (!document.fonts?.ready) return;

  try {
    await document.fonts.ready;
  } catch {
    // Font loading failure should not block export.
  }
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

export default function ExportActions({
  targetId = "export-area",
  title = "Angelbird Report",
}) {
  const [isExporting, setIsExporting] = useState(false);

  async function printPage() {
    const target = document.getElementById(targetId);

    if (!target) {
      alert("Export area not found.");
      return;
    }

    target.classList.add("pdf-exporting");

    await waitForFonts();
    await waitForImages(target);
    window.dispatchEvent(new Event("resize"));
    await wait(300);

    window.print();

    setTimeout(() => {
      target.classList.remove("pdf-exporting");
    }, 500);
  }

  async function downloadPdf() {
    const target = document.getElementById(targetId);

    if (!target) {
      alert("Export area not found.");
      return;
    }

    if (isExporting) return;

    const previousBodyBg = document.body.style.background;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    setIsExporting(true);

    try {
      document.body.style.background = "#ffffff";
      document.body.style.overflow = "visible";
      document.documentElement.style.overflow = "visible";

      target.classList.add("pdf-exporting");

      await waitForFonts();
      await waitForImages(target);

      // Important for Recharts / responsive chart containers.
      window.dispatchEvent(new Event("resize"));
      await wait(650);

      const exportWidth = Math.max(
        target.scrollWidth,
        target.offsetWidth,
        target.clientWidth,
        1200
      );

      const exportHeight = Math.max(
        target.scrollHeight,
        target.offsetHeight,
        target.clientHeight
      );

      if (!exportHeight || exportHeight < 20) {
        alert("PDF export area is empty.");
        return;
      }

      const canvas = await html2canvas(target, {
        scale: 1.35,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 15000,
        width: exportWidth,
        height: exportHeight,
        windowWidth: exportWidth,
        windowHeight: exportHeight,
        scrollX: 0,
        scrollY: -window.scrollY,
        onclone: (clonedDoc) => {
          const clonedTarget = clonedDoc.getElementById(targetId);

          clonedDoc.body.style.background = "#ffffff";
          clonedDoc.documentElement.style.background = "#ffffff";

          if (clonedTarget) {
            clonedTarget.style.display = "block";
            clonedTarget.style.visibility = "visible";
            clonedTarget.style.opacity = "1";
            clonedTarget.style.width = `${exportWidth}px`;
            clonedTarget.style.minWidth = `${exportWidth}px`;
            clonedTarget.style.maxWidth = "none";
            clonedTarget.style.height = "auto";
            clonedTarget.style.maxHeight = "none";
            clonedTarget.style.overflow = "visible";
            clonedTarget.style.background = "#ffffff";
            clonedTarget.classList.add("pdf-exporting");
          }

          clonedDoc
            .querySelectorAll(".no-print, .no-export, .pdf-hide")
            .forEach((el) => {
              el.style.display = "none";
            });

          clonedDoc
            .querySelectorAll(
              ".recharts-wrapper, .recharts-responsive-container, .recharts-surface"
            )
            .forEach((el) => {
              el.style.overflow = "visible";
              el.style.maxWidth = "none";
              el.style.maxHeight = "none";
            });

          clonedDoc.querySelectorAll("svg").forEach((el) => {
            el.style.overflow = "visible";
          });

          clonedDoc.querySelectorAll("table").forEach((el) => {
            el.style.pageBreakInside = "auto";
            el.style.breakInside = "auto";
          });
        },
      });

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        alert("PDF export failed because captured content was empty.");
        return;
      }

      const imgData = canvas.toDataURL("image/jpeg", 0.84);

      const pdf = new jsPDF("p", "mm", "a4", true);

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(
        imgData,
        "JPEG",
        0,
        position,
        imgWidth,
        imgHeight,
        undefined,
        "FAST"
      );

      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(
          imgData,
          "JPEG",
          0,
          position,
          imgWidth,
          imgHeight,
          undefined,
          "FAST"
        );
        heightLeft -= pageHeight;
      }

      pdf.save(getFileName(title));
    } catch (error) {
      console.error("[Angelbird PDF Export Error]", error);
      alert("PDF export failed. Please try again.");
    } finally {
      target.classList.remove("pdf-exporting");
      document.body.style.background = previousBodyBg;
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      setIsExporting(false);
    }
  }

  return (
    <div className="no-print no-export flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={printPage}
        disabled={isExporting}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Printer size={18} />
        Print
      </button>

      <button
        type="button"
        onClick={downloadPdf}
        disabled={isExporting}
        className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black text-slate-900 transition disabled:cursor-not-allowed disabled:opacity-60"
        style={{ background: "var(--accent-color)" }}
      >
        {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
        {isExporting ? "Preparing PDF..." : "Download PDF"}
      </button>
    </div>
  );
}