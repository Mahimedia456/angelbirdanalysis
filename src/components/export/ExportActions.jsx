import { Download, Loader2, Printer } from "lucide-react";
import { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function wait(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeFileName(name = "angelbird-report") {
  return String(name || "angelbird-report")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

async function waitForFonts() {
  try {
    await document.fonts?.ready;
  } catch {
    // ignore
  }
}

async function waitForImages(root) {
  const images = Array.from(root.querySelectorAll("img"));

  await Promise.all(
    images.map((img) => {
      if (img.complete) {
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );
}

function cloneNodeForPdf(target, title) {
  const wrapper = document.createElement("div");

  wrapper.id = "angelbird-pdf-temp-wrapper";
  wrapper.style.position = "fixed";
  wrapper.style.left = "-100000px";
  wrapper.style.top = "0";
  wrapper.style.width = "1600px";
  wrapper.style.background = "#ffffff";
  wrapper.style.padding = "0";
  wrapper.style.margin = "0";
  wrapper.style.zIndex = "-1";

  const header = document.getElementById("reports-export-header");
  const headerClone = header ? header.cloneNode(true) : null;
  const targetClone = target.cloneNode(true);

  if (headerClone) {
    headerClone.style.marginBottom = "28px";
    headerClone.style.width = "100%";
    headerClone.style.maxWidth = "100%";
  }

  targetClone.style.width = "100%";
  targetClone.style.maxWidth = "100%";
  targetClone.style.background = "#ffffff";
  targetClone.style.overflow = "visible";

  wrapper.appendChild(headerClone || createFallbackHeader(title));
  wrapper.appendChild(targetClone);

  wrapper.querySelectorAll(".no-print, .no-export, .pdf-hide").forEach((el) => {
    el.remove();
  });

  wrapper
    .querySelectorAll(".overflow-auto, .overflow-x-auto, .overflow-y-auto")
    .forEach((el) => {
      el.style.maxHeight = "none";
      el.style.height = "auto";
      el.style.overflow = "visible";
      el.style.overflowX = "visible";
      el.style.overflowY = "visible";
    });

  wrapper.querySelectorAll(".recharts-responsive-container").forEach((el) => {
    const parent = el.parentElement;

    if (parent) {
      parent.style.height = "430px";
      parent.style.minHeight = "430px";
      parent.style.maxHeight = "430px";
    }
  });

  wrapper.querySelectorAll("svg").forEach((el) => {
    el.style.overflow = "visible";
  });

  wrapper.querySelectorAll(".grid").forEach((el) => {
    el.style.gap = "22px";
  });

  wrapper.querySelectorAll(".angel-card, .angel-section").forEach((el) => {
    el.style.breakInside = "avoid";
    el.style.pageBreakInside = "avoid";
  });

  return wrapper;
}

function createFallbackHeader(title) {
  const section = document.createElement("section");

  section.style.background = "#050816";
  section.style.color = "#ffffff";
  section.style.borderRadius = "34px";
  section.style.padding = "44px";
  section.style.marginBottom = "28px";

  section.innerHTML = `
    <p style="font-size:13px;font-weight:900;letter-spacing:0.28em;text-transform:uppercase;color:rgba(255,255,255,0.45);margin:0 0 20px 0;">
      All Data From Zendesk
    </p>
    <h1 style="font-size:64px;line-height:0.95;margin:0;font-weight:900;letter-spacing:-0.06em;">
      ${title || "Analytics"}
    </h1>
  `;

  return section;
}

async function exportElementAsPdf(element, fileName) {
  await waitForFonts();
  await waitForImages(element);

  window.dispatchEvent(new Event("resize"));
  await wait(1000);

  const width = Math.max(element.scrollWidth, element.offsetWidth, 1400);
  const height = Math.max(element.scrollHeight, element.offsetHeight, 500);

  const canvas = await html2canvas(element, {
    scale: 1.35,
    backgroundColor: "#ffffff",
    useCORS: true,
    allowTaint: true,
    logging: false,
    scrollX: 0,
    scrollY: 0,
    width,
    height,
    windowWidth: width,
    windowHeight: height,
  });

  if (!canvas || !canvas.width || !canvas.height) {
    throw new Error("Canvas could not be generated.");
  }

  const pdf = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidthMm = 210;
  const pageHeightMm = 297;
  const marginMm = 5;
  const usableWidthMm = pageWidthMm - marginMm * 2;
  const usableHeightMm = pageHeightMm - marginMm * 2;

  const pageHeightPx = Math.floor(
    (canvas.width * usableHeightMm) / usableWidthMm
  );

  let sourceY = 0;
  let pageIndex = 0;

  while (sourceY < canvas.height) {
    const sliceHeight = Math.min(pageHeightPx, canvas.height - sourceY);

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeight;

    const ctx = pageCanvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

    ctx.drawImage(
      canvas,
      0,
      sourceY,
      canvas.width,
      sliceHeight,
      0,
      0,
      canvas.width,
      sliceHeight
    );

    const imgData = pageCanvas.toDataURL("image/jpeg", 0.94);
    const imgHeightMm = (sliceHeight * usableWidthMm) / canvas.width;

    if (pageIndex > 0) {
      pdf.addPage();
    }

    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidthMm, pageHeightMm, "F");

    pdf.addImage(
      imgData,
      "JPEG",
      marginMm,
      marginMm,
      usableWidthMm,
      imgHeightMm,
      undefined,
      "FAST"
    );

    sourceY += sliceHeight;
    pageIndex += 1;
  }

  pdf.save(`${safeFileName(fileName)}.pdf`);
}

export default function ExportActions({
  targetId = "export-area",
  title = "Angelbird Report",
}) {
  const [isExporting, setIsExporting] = useState(false);

  function printPage() {
    window.print();
  }

  async function downloadPdf() {
    const target = document.getElementById(targetId);

    if (!target) {
      alert(`Export area not found: ${targetId}`);
      return;
    }

    if (isExporting) {
      return;
    }

    setIsExporting(true);

    let pdfNode = null;

    try {
      pdfNode = cloneNodeForPdf(target, title);
      document.body.appendChild(pdfNode);

      await exportElementAsPdf(pdfNode, title);
    } catch (error) {
      console.error("[Angelbird PDF Export Error]", error);
      alert(error.message || "PDF export failed. Open console for details.");
    } finally {
      if (pdfNode?.parentNode) {
        pdfNode.parentNode.removeChild(pdfNode);
      }

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
        style={{
          background: "var(--accent-color)",
        }}
      >
        {isExporting ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Download size={18} />
        )}

        {isExporting ? "Preparing PDF..." : "Download PDF"}
      </button>
    </div>
  );
}