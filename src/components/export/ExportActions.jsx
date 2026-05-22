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
    // ignore
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

function isVisible(element) {
  if (!element) return false;

  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  if (style.display === "none") return false;
  if (style.visibility === "hidden") return false;
  if (rect.width <= 0 || rect.height <= 0) return false;

  return true;
}

function isHiddenForPdf(element) {
  if (!element) return true;

  return (
    element.classList.contains("no-print") ||
    element.classList.contains("no-export") ||
    element.classList.contains("pdf-hide")
  );
}

function applyPdfCloneStyles(clonedDoc, targetId, mode) {
  clonedDoc.body.style.background = "#ffffff";
  clonedDoc.body.style.overflow = "visible";
  clonedDoc.documentElement.style.background = "#ffffff";
  clonedDoc.documentElement.style.overflow = "visible";

  const target = clonedDoc.getElementById(targetId);

  if (target) {
    target.style.display = "block";
    target.style.visibility = "visible";
    target.style.opacity = "1";
    target.style.background = "#ffffff";
    target.style.overflow = "visible";
    target.style.height = "auto";
    target.style.maxHeight = "none";
    target.style.width = "1280px";
    target.style.maxWidth = "1280px";
    target.style.padding = "0";
    target.style.margin = "0";
  }

  clonedDoc
    .querySelectorAll(".no-print, .no-export, .pdf-hide")
    .forEach((el) => {
      el.style.display = "none";
    });

  clonedDoc.querySelectorAll(".angel-card").forEach((el) => {
    el.style.padding = mode === "dashboard" ? "12px" : "12px";
    el.style.borderRadius = "16px";
    el.style.margin = "0";
    el.style.boxShadow = "none";
    el.style.breakInside = "avoid";
    el.style.pageBreakInside = "avoid";
  });

  clonedDoc.querySelectorAll(".angel-section").forEach((el) => {
    el.style.padding = mode === "dashboard" ? "12px" : "12px";
    el.style.borderRadius = "16px";
    el.style.margin = "0";
    el.style.boxShadow = "none";
    el.style.breakInside = "avoid";
    el.style.pageBreakInside = "avoid";
  });

  clonedDoc.querySelectorAll(".angel-mini-label").forEach((el) => {
    el.style.fontSize = "8px";
    el.style.letterSpacing = "0.14em";
  });

  clonedDoc.querySelectorAll(".angel-page-title").forEach((el) => {
    el.style.fontSize = mode === "dashboard" ? "20px" : "18px";
    el.style.lineHeight = "1.05";
    el.style.marginTop = "4px";
  });

  clonedDoc.querySelectorAll("h1").forEach((el) => {
    el.style.fontSize = mode === "dashboard" ? "24px" : "20px";
    el.style.lineHeight = "1";
    el.style.margin = "0";
  });

  clonedDoc.querySelectorAll("h2").forEach((el) => {
    el.style.fontSize = mode === "dashboard" ? "19px" : "17px";
    el.style.lineHeight = "1.05";
  });

  clonedDoc.querySelectorAll("h3").forEach((el) => {
    el.style.fontSize = "14px";
    el.style.lineHeight = "1.1";
  });

  clonedDoc.querySelectorAll("p").forEach((el) => {
    el.style.marginTop = "3px";
  });

  clonedDoc.querySelectorAll(".space-y-8").forEach((el) => {
    el.style.gap = "10px";
    el.style.rowGap = "10px";
  });

  clonedDoc.querySelectorAll(".space-y-6").forEach((el) => {
    el.style.gap = "8px";
    el.style.rowGap = "8px";
  });

  clonedDoc.querySelectorAll(".grid").forEach((el) => {
    el.style.gap = "8px";
  });

  clonedDoc
    .querySelectorAll(".recharts-wrapper, .recharts-responsive-container")
    .forEach((el) => {
      el.style.overflow = "visible";
      el.style.maxHeight = "none";
    });

  clonedDoc.querySelectorAll(".recharts-responsive-container").forEach((el) => {
    const parent = el.parentElement;

    if (parent) {
      parent.style.height = mode === "dashboard" ? "235px" : "260px";
      parent.style.minHeight = mode === "dashboard" ? "235px" : "260px";
      parent.style.maxHeight = mode === "dashboard" ? "235px" : "260px";
    }
  });

  clonedDoc.querySelectorAll("svg").forEach((el) => {
    el.style.overflow = "visible";
  });

  clonedDoc.querySelectorAll(".overflow-x-auto").forEach((el) => {
    el.style.overflow = "visible";
  });

  clonedDoc.querySelectorAll("table").forEach((el) => {
    el.style.width = "100%";
    el.style.borderCollapse = "collapse";
    el.style.fontSize = "8px";
  });

  clonedDoc.querySelectorAll("th, td").forEach((el) => {
    el.style.padding = "4px 5px";
    el.style.lineHeight = "1.15";
  });
}

async function renderElement(element, targetId, mode) {
  const width = Math.max(
    element.scrollWidth,
    element.offsetWidth,
    element.clientWidth,
    560
  );

  const height = Math.max(
    element.scrollHeight,
    element.offsetHeight,
    element.clientHeight,
    60
  );

  return html2canvas(element, {
    scale: 1.7,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    imageTimeout: 15000,
    width,
    height,
    windowWidth: 1280,
    windowHeight: Math.max(900, height),
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDoc) => {
      applyPdfCloneStyles(clonedDoc, targetId, mode);
    },
  });
}

function getPdfItems(target, mode) {
  const items = [];
  const seen = new Set();

  function pushUnique(type, element) {
    if (!element || seen.has(element)) return;
    if (!isVisible(element) || isHiddenForPdf(element)) return;

    seen.add(element);
    items.push({ type, element });
  }

  const summarySections = Array.from(target.querySelectorAll(".angel-section"));
  summarySections.forEach((el) => pushUnique("summary", el));

  const directChildren = Array.from(target.children || []);

  directChildren.forEach((el) => {
    if (!isVisible(el) || isHiddenForPdf(el)) return;

    const hasChart = !!el.querySelector(".recharts-responsive-container");
    const hasTable = !!el.querySelector("table");
    const hasCards = el.querySelectorAll(".angel-card").length >= 2;
    const isGrid = String(el.className || "").includes("grid");

    if (isGrid && hasCards && !hasChart && !hasTable) {
      pushUnique("kpi", el);
    }
  });

  const chartCards = Array.from(target.querySelectorAll(".angel-card")).filter(
    (el) => !!el.querySelector(".recharts-responsive-container")
  );

  chartCards.forEach((el) => pushUnique("chart", el));

  if (mode === "report") {
    const tableCards = Array.from(target.querySelectorAll(".angel-card")).filter(
      (el) => {
        const hasTable = !!el.querySelector("table");
        const hasChart = !!el.querySelector(".recharts-responsive-container");
        return hasTable && !hasChart;
      }
    );

    tableCards.forEach((el) => pushUnique("table", el));
  }

  return items;
}

function addCanvasAt(pdf, canvas, x, y, widthMm, maxHeightMm) {
  if (!canvas || canvas.width === 0 || canvas.height === 0) return 0;

  const ratio = canvas.height / canvas.width;

  let renderWidth = widthMm;
  let renderHeight = renderWidth * ratio;

  if (renderHeight > maxHeightMm) {
    renderHeight = maxHeightMm;
    renderWidth = renderHeight / ratio;
  }

  const imgData = canvas.toDataURL("image/jpeg", 0.88);

  pdf.addImage(
    imgData,
    "JPEG",
    x,
    y,
    renderWidth,
    renderHeight,
    undefined,
    "FAST"
  );

  return renderHeight;
}

function addNewPage(pdf, pageIndex) {
  if (pageIndex > 0) {
    pdf.addPage();
  }
}

async function buildDashboardPdf({ pdf, items, targetId, mode, maxPages }) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 8;
  const gap = 6;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  let pageIndex = 0;
  let y = margin;

  addNewPage(pdf, pageIndex);

  const summaryItems = items.filter((item) => item.type === "summary");
  const kpiItems = items.filter((item) => item.type === "kpi");
  const chartItems = items.filter((item) => item.type === "chart");

  for (const item of summaryItems.slice(0, 1)) {
    const canvas = await renderElement(item.element, targetId, mode);
    const h = addCanvasAt(pdf, canvas, margin, y, usableWidth, 34);
    y += h + gap;
  }

  for (const item of kpiItems.slice(0, 1)) {
    const canvas = await renderElement(item.element, targetId, mode);
    const h = addCanvasAt(pdf, canvas, margin, y, usableWidth, 36);
    y += h + gap;
  }

  for (const item of chartItems) {
    if (pageIndex >= maxPages) break;

    const slotHeight = (usableHeight - gap) / 2;

    if (y + slotHeight > pageHeight - margin) {
      pageIndex += 1;

      if (pageIndex >= maxPages) break;

      addNewPage(pdf, pageIndex);
      y = margin;
    }

    const canvas = await renderElement(item.element, targetId, mode);
    addCanvasAt(pdf, canvas, margin, y, usableWidth, slotHeight);
    y += slotHeight + gap;
  }
}

async function buildReportPdf({ pdf, items, targetId, mode }) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 8;
  const gap = 6;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  let pageIndex = 0;
  let y = margin;

  addNewPage(pdf, pageIndex);

  for (const item of items) {
    const isChart = item.type === "chart";
    const isTable = item.type === "table";
    const isSummary = item.type === "summary";
    const isKpi = item.type === "kpi";

    let preferredHeight = 80;

    if (isSummary) preferredHeight = 30;
    if (isKpi) preferredHeight = 35;
    if (isChart) preferredHeight = 118;
    if (isTable) preferredHeight = 130;

    if (y + preferredHeight > pageHeight - margin) {
      pageIndex += 1;
      addNewPage(pdf, pageIndex);
      y = margin;
    }

    const canvas = await renderElement(item.element, targetId, mode);

    const remainingHeight = pageHeight - margin - y;
    const h = addCanvasAt(
      pdf,
      canvas,
      margin,
      y,
      usableWidth,
      Math.min(preferredHeight, remainingHeight)
    );

    y += h + gap;
  }
}

export default function ExportActions({
  targetId = "export-area",
  title = "Angelbird Report",
  maxPages = null,
  mode = "report",
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
    await wait(500);

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

      window.dispatchEvent(new Event("resize"));
      await wait(900);

      const items = getPdfItems(target, mode);
      const pdf = new jsPDF("p", "mm", "a4", true);

      if (mode === "dashboard") {
        await buildDashboardPdf({
          pdf,
          items,
          targetId,
          mode,
          maxPages: maxPages || 2,
        });
      } else {
        await buildReportPdf({
          pdf,
          items,
          targetId,
          mode,
        });
      }

      pdf.save(getFileName(title));
    } catch (error) {
      console.error("[Angelbird PDF Export Error]", error);
      alert("PDF export failed. Please check the console and try again.");
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