import { useEffect, useMemo, useState } from "react";
import ProductFilters from "../components/products/ProductFilters";
import ProductCategoryCards from "../components/products/ProductCategoryCards";
import TicketFilters from "../components/tickets/TicketFilters";
import TicketKpiCards from "../components/tickets/TicketKpiCards";
import TicketAnalyticsPanel from "../components/tickets/TicketAnalyticsPanel";
import ChartPanel from "../components/dashboard/ChartPanel";
import ExportActions from "../components/export/ExportActions";
import SatisfactionFilters from "../components/satisfaction/SatisfactionFilters";
import SatisfactionKpiCards from "../components/satisfaction/SatisfactionKpiCards";
import SatisfactionAnalyticsPanel from "../components/satisfaction/SatisfactionAnalyticsPanel";
import {
  getChartSettings,
  getProductsData,
  getSatisfactionData,
  getTicketsData,
} from "../utils/storage";
import { buildProductAnalytics } from "../utils/analytics";
import { filterProducts } from "../utils/productMapper";
import { filterTickets } from "../utils/ticketMapper";
import { buildTicketAnalytics } from "../utils/ticketAnalytics";
import { filterSatisfaction } from "../utils/satisfactionMapper";
import { buildSatisfactionAnalytics } from "../utils/satisfactionAnalytics";

export default function DashboardPage() {
  const [mode, setMode] = useState("tickets");

  const [ticketRows, setTicketRows] = useState([]);
  const [productRows, setProductRows] = useState([]);
  const [satisfactionRows, setSatisfactionRows] = useState([]);
  const [chartSettings, setChartSettings] = useState(getChartSettings());

  const [ticketFilters, setTicketFilters] = useState({
    search: "",
    region: "",
    supportCategory: "",
    productCategory: "",
    procedure: "",
    dateFrom: "",
    dateTo: "",
  });

  const [productFilters, setProductFilters] = useState({
    search: "",
    category: "",
  });

  const [satisfactionFilters, setSatisfactionFilters] = useState({
    search: "",
    rating: "",
    reason: "",
    solvedStatus: "",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    setTicketRows(getTicketsData());
    setProductRows(getProductsData());
    setSatisfactionRows(getSatisfactionData());
    setChartSettings(getChartSettings());
  }, []);

  const filteredTickets = useMemo(
    () => filterTickets(ticketRows, ticketFilters),
    [ticketRows, ticketFilters]
  );

  const ticketAnalytics = useMemo(
    () => buildTicketAnalytics(filteredTickets),
    [filteredTickets]
  );

  const filteredProducts = useMemo(
    () => filterProducts(productRows, productFilters),
    [productRows, productFilters]
  );

  const productAnalytics = useMemo(
    () => buildProductAnalytics(filteredProducts),
    [filteredProducts]
  );

  const filteredSatisfaction = useMemo(
    () => filterSatisfaction(satisfactionRows, satisfactionFilters),
    [satisfactionRows, satisfactionFilters]
  );

  const satisfactionAnalytics = useMemo(
    () => buildSatisfactionAnalytics(filteredSatisfaction),
    [filteredSatisfaction]
  );

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[38px] border border-slate-200 bg-slate-900 p-8 text-white shadow-soft md:p-10">
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-20 angel-grid-bg" />

        <div className="relative grid gap-8 xl:grid-cols-[1fr_0.9fr] xl:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/45">
              Angelbird Dashboard
            </p>

            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-none tracking-[-0.06em] md:text-6xl">
              Ticket, product and satisfaction reporting.
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/65">
              Dashboard view focuses on KPIs and visual analytics. Detailed
              tables are available on the Reports page.
            </p>
          </div>

          <div
            className="rounded-[30px] p-6 text-slate-900"
            style={{ background: "var(--accent-color)" }}
          >
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-700">
              Current View
            </p>

            <h2 className="mt-3 text-5xl font-black tracking-[-0.07em] capitalize">
              {mode === "satisfaction" ? "Satisfaction" : mode}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-700">
              Tickets: {ticketRows.length} · Products: {productRows.length} ·
              Satisfaction: {satisfactionRows.length}
            </p>
          </div>
        </div>
      </section>

      <div className="no-print no-export flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-soft xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("tickets")}
            className={[
              "rounded-2xl px-5 py-3 text-sm font-black transition",
              mode === "tickets"
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
            ].join(" ")}
          >
            Ticket Analytics
          </button>

          <button
            type="button"
            onClick={() => setMode("products")}
            className={[
              "rounded-2xl px-5 py-3 text-sm font-black transition",
              mode === "products"
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
            ].join(" ")}
          >
            Product Master Analytics
          </button>

          <button
            type="button"
            onClick={() => setMode("satisfaction")}
            className={[
              "rounded-2xl px-5 py-3 text-sm font-black transition",
              mode === "satisfaction"
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
            ].join(" ")}
          >
            Satisfaction Analytics
          </button>
        </div>

<ExportActions
  targetId="dashboard-export-area"
  title={`Angelbird Dashboard ${mode}`}
  maxPages={2}
  mode="dashboard"
/>
      </div>

      <div
        id="dashboard-export-area"
        className="space-y-8 rounded-[28px] bg-white p-1"
      >
        {mode === "tickets" ? (
          <>
            <div className="no-print no-export">
              <TicketFilters
                tickets={ticketRows}
                filters={ticketFilters}
                onChange={setTicketFilters}
              />
            </div>

            <section className="angel-section p-6 pdf-export-section">
              <p className="angel-mini-label">Dashboard Summary</p>
              <h2 className="mt-2 angel-page-title">
                Ticket Analytics Dashboard
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Filtered tickets: {filteredTickets.length} from{" "}
                {ticketRows.length} total records.
              </p>
            </section>

            <TicketKpiCards analytics={ticketAnalytics} />

            <TicketAnalyticsPanel
              analytics={ticketAnalytics}
              chartSettings={chartSettings}
              prefix="dashboard"
              showTables={false}
            />
          </>
        ) : mode === "products" ? (
          <>
            <div className="no-print no-export">
              <ProductFilters
                products={productRows}
                filters={productFilters}
                onChange={setProductFilters}
              />
            </div>

            <section className="angel-section p-6 pdf-export-section">
              <p className="angel-mini-label">Dashboard Summary</p>
              <h2 className="mt-2 angel-page-title">
                Product Master Dashboard
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Filtered products: {filteredProducts.length} from{" "}
                {productRows.length} total records.
              </p>
            </section>

            <ProductCategoryCards
              categorySummary={productAnalytics.categorySummary}
            />

            <section className="grid gap-6 xl:grid-cols-2">
              <ChartPanel
                chartId="dashboard_product_category_count"
                title="Product Category Count"
                data={productAnalytics.categorySummary}
                type={chartSettings.categoryChart || "bar"}
              />

              <ChartPanel
                className="xl:col-span-2"
                chartId="dashboard_sku_records"
                title="SKU Records"
                data={productAnalytics.skuSummary}
                type={chartSettings.productChart || "bar"}
              />
            </section>
          </>
        ) : (
          <>
            <div className="no-print no-export">
              <SatisfactionFilters
                rows={satisfactionRows}
                filters={satisfactionFilters}
                onChange={setSatisfactionFilters}
              />
            </div>

            <section className="angel-section p-6 pdf-export-section">
              <p className="angel-mini-label">Dashboard Summary</p>
              <h2 className="mt-2 angel-page-title">
                Customer Satisfaction Dashboard
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Filtered responses: {filteredSatisfaction.length} from{" "}
                {satisfactionRows.length} total records.
              </p>
            </section>

            <SatisfactionKpiCards analytics={satisfactionAnalytics} />

            <SatisfactionAnalyticsPanel
              analytics={satisfactionAnalytics}
              chartSettings={chartSettings}
              prefix="dashboard"
              showTables={false}
            />
          </>
        )}
      </div>
    </div>
  );
}