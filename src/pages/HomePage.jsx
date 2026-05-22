import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Database,
  FileSpreadsheet,
  SmilePlus,
  Trash2,
} from "lucide-react";
import CsvUploader from "../components/upload/CsvUploader";
import DataPreview from "../components/upload/DataPreview";
import ProductTemplateDownload from "../components/products/ProductTemplateDownload";
import ProductColumnMapper from "../components/products/ProductColumnMapper";
import ProductReportTable from "../components/products/ProductReportTable";
import TicketColumnMapper from "../components/tickets/TicketColumnMapper";
import TicketReportTable from "../components/tickets/TicketReportTable";
import SatisfactionReportTable from "../components/satisfaction/SatisfactionReportTable";
import {
  clearAllData,
  getProductsData,
  getRawProductsData,
  getRawSatisfactionData,
  getRawTicketsData,
  getSatisfactionData,
  getTicketsData,
  saveProductMapping,
  saveProductsData,
  saveRawProductsData,
  saveRawSatisfactionData,
  saveRawTicketsData,
  saveSatisfactionData,
  saveSatisfactionMapping,
  saveTicketMapping,
  saveTicketsData,
} from "../utils/storage";
import {
  applyTicketMapping,
  detectTicketMapping,
} from "../utils/ticketMapper";
import {
  applyProductMapping,
  detectProductMapping,
} from "../utils/productMapper";
import {
  applySatisfactionMapping,
  detectSatisfactionMapping,
} from "../utils/satisfactionMapper";
import { Link } from "react-router-dom";

const featureCards = [
  {
    title: "Ticket Analytics",
    description:
      "Upload support CSV and report by date, support category and procedure.",
    icon: FileSpreadsheet,
  },
  {
    title: "Product Master",
    description: "Import product name, category, SKU, EAN and UPC reporting.",
    icon: Database,
  },
  {
    title: "Satisfaction Analytics",
    description:
      "Analyze good/bad ratings, solved status, comments, reasons and date trends.",
    icon: SmilePlus,
  },
  {
    title: "Configurable Charts",
    description: "Separate chart reporting for products, tickets and satisfaction.",
    icon: BarChart3,
  },
];

export default function HomePage() {
  const [rawTicketRows, setRawTicketRows] = useState([]);
  const [ticketRows, setTicketRows] = useState([]);

  const [rawProductRows, setRawProductRows] = useState([]);
  const [productRows, setProductRows] = useState([]);

  const [rawSatisfactionRows, setRawSatisfactionRows] = useState([]);
  const [satisfactionRows, setSatisfactionRows] = useState([]);

  useEffect(() => {
    setRawTicketRows(getRawTicketsData());
    setTicketRows(getTicketsData());

    setRawProductRows(getRawProductsData());
    setProductRows(getProductsData());

    setRawSatisfactionRows(getRawSatisfactionData());
    setSatisfactionRows(getSatisfactionData());
  }, []);

  function handleTicketUpload({ rows }) {
    saveRawTicketsData(rows);
    setRawTicketRows(rows);

    const columns = rows.length ? Object.keys(rows[0]) : [];
    const mapping = detectTicketMapping(columns);
    const mapped = applyTicketMapping(rows, mapping);

    saveTicketMapping(mapping);
    saveTicketsData(mapped);
    setTicketRows(mapped);
  }

  function handleProductUpload({ rows }) {
    saveRawProductsData(rows);
    setRawProductRows(rows);

    const columns = rows.length ? Object.keys(rows[0]) : [];
    const mapping = detectProductMapping(columns);
    const mapped = applyProductMapping(rows, mapping);

    saveProductMapping(mapping);
    saveProductsData(mapped);
    setProductRows(mapped);
  }

  function handleSatisfactionUpload({ rows }) {
    saveRawSatisfactionData(rows);
    setRawSatisfactionRows(rows);

    const columns = rows.length ? Object.keys(rows[0]) : [];
    const mapping = detectSatisfactionMapping(columns);
    const mapped = applySatisfactionMapping(rows, mapping);

    saveSatisfactionMapping(mapping);
    saveSatisfactionData(mapped);
    setSatisfactionRows(mapped);
  }

  function handleTicketsMapped(mappedTickets) {
    setTicketRows(mappedTickets);
  }

  function handleProductsMapped(mappedProducts) {
    setProductRows(mappedProducts);
  }

  function handleClearAllData() {
    const ok = window.confirm(
      "This will remove uploaded ticket CSV, product CSV, satisfaction CSV and mapped data from this browser. Continue?"
    );

    if (!ok) return;

    clearAllData();

    setRawTicketRows([]);
    setTicketRows([]);

    setRawProductRows([]);
    setProductRows([]);

    setRawSatisfactionRows([]);
    setSatisfactionRows([]);
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[42px] border border-slate-200 bg-white shadow-soft">
        <div className="absolute inset-0 angel-grid-bg opacity-70" />

        <div className="relative grid min-h-[560px] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-14">
            <p className="angel-mini-label">Angelbird Analytics Tool</p>

            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.065em] text-slate-900 md:text-7xl">
              Ticket, product and satisfaction reporting.
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-7 text-slate-600">
              Upload ticket CSV, product master CSV and customer satisfaction CSV.
              Columns auto-map after upload. Manual mapping remains available for
              ticket and product correction.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/dashboard" className="angel-btn angel-btn-dark gap-2">
                Open Dashboard
                <ArrowRight size={17} />
              </Link>

              <Link to="/reports" className="angel-btn angel-btn-lime">
                View Reports
              </Link>

              <button
                onClick={handleClearAllData}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100"
              >
                <Trash2 size={17} />
                Clear Uploaded Data
              </button>
            </div>

            <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <p className="text-2xl font-black text-slate-900">
                  {ticketRows.length}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Tickets
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <p className="text-2xl font-black text-slate-900">
                  {productRows.length}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Products
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <p className="text-2xl font-black text-slate-900">
                  {satisfactionRows.length}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Satisfaction
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <p className="text-2xl font-black text-slate-900">
                  {rawTicketRows.length +
                    rawProductRows.length +
                    rawSatisfactionRows.length}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Raw Rows
                </p>
              </div>
            </div>
          </div>

          <div
            className="relative flex items-center justify-center p-8 lg:p-12"
            style={{ background: "var(--accent-color)" }}
          >
            <div className="relative w-full max-w-md rounded-[34px] bg-white/80 p-6 shadow-soft backdrop-blur">
              <div className="rounded-[28px] bg-slate-900 p-6 text-white">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-white/50">
                  Auto Mapping Active
                </p>

                <h2 className="mt-5 text-5xl font-black tracking-[-0.07em]">
                  Upload → Report
                </h2>

                <p className="mt-4 text-sm leading-6 text-white/65">
                  Fake empty columns are removed. Dates, ratings and solved
                  status are normalized for reporting.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xl font-black text-slate-900">Good</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Rating
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xl font-black text-slate-900">Bad</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Rating
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xl font-black text-slate-900">Solved</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Status
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProductTemplateDownload />

      <div className="grid gap-6 xl:grid-cols-3">
        <CsvUploader
          title="Upload Ticket Analytics CSV"
          description="Upload support ticket CSV. It will auto-map after upload."
          buttonLabel="Upload Ticket CSV"
          onUpload={handleTicketUpload}
        />

        <CsvUploader
          title="Upload Product Master CSV"
          description="Upload product master CSV. It will auto-map after upload."
          buttonLabel="Upload Products CSV"
          onUpload={handleProductUpload}
        />

        <CsvUploader
          title="Upload Satisfaction CSV"
          description="Upload customer satisfaction CSV with rating, comment, reason, updated date and solved status."
          buttonLabel="Upload Satisfaction CSV"
          onUpload={handleSatisfactionUpload}
        />
      </div>

      <TicketColumnMapper
        rawRows={rawTicketRows}
        onMapped={handleTicketsMapped}
      />

      <ProductColumnMapper
        rawRows={rawProductRows}
        onMapped={handleProductsMapped}
      />

      <div className="grid gap-6">
        <DataPreview title="Raw Ticket CSV Preview" rows={rawTicketRows} />

        <TicketReportTable
          title="Mapped Ticket Preview"
          tickets={ticketRows.slice(0, 20)}
        />

        <DataPreview title="Raw Products CSV Preview" rows={rawProductRows} />

        <ProductReportTable
          title="Mapped Products Preview"
          products={productRows.slice(0, 20)}
        />

        <DataPreview
          title="Raw Satisfaction CSV Preview"
          rows={rawSatisfactionRows}
        />

        <SatisfactionReportTable
          title="Mapped Satisfaction Preview"
          rows={satisfactionRows.slice(0, 20)}
        />
      </div>
    </div>
  );
}