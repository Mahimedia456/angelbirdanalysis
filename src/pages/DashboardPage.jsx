import { useEffect, useMemo, useState } from "react";
import ProductFilters from "../components/products/ProductFilters";
import ProductReportTable from "../components/products/ProductReportTable";
import ProductCategoryCards from "../components/products/ProductCategoryCards";
import TicketFilters from "../components/tickets/TicketFilters";
import TicketKpiCards from "../components/tickets/TicketKpiCards";
import TicketAnalyticsPanel from "../components/tickets/TicketAnalyticsPanel";
import TicketReportTable from "../components/tickets/TicketReportTable";
import PivotTable from "../components/dashboard/PivotTable";
import ChartPanel from "../components/dashboard/ChartPanel";
import SummaryTable from "../components/dashboard/SummaryTable";
import {
  getChartSettings,
  getProductsData,
  getTicketsData,
} from "../utils/storage";
import { buildProductAnalytics } from "../utils/analytics";
import { filterProducts } from "../utils/productMapper";
import { filterTickets } from "../utils/ticketMapper";
import { buildTicketAnalytics } from "../utils/ticketAnalytics";

export default function DashboardPage() {
  const [mode, setMode] = useState("tickets");

  const [ticketRows, setTicketRows] = useState([]);
  const [productRows, setProductRows] = useState([]);
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

  useEffect(() => {
    setTicketRows(getTicketsData());
    setProductRows(getProductsData());
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
              Ticket analytics and product reporting.
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/65">
              Separate reporting for support tickets and product master data.
              Analyze date trends, support category, product category,
              procedure, product names and SKU records.
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
              {mode}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-700">
              Tickets: {ticketRows.length} · Products: {productRows.length}
            </p>
          </div>
        </div>
      </section>

      <div className="angel-card p-2">
        <div className="flex flex-wrap gap-2">
          <button
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
        </div>
      </div>

      {mode === "tickets" ? (
        <>
          <TicketFilters
            tickets={ticketRows}
            filters={ticketFilters}
            onChange={setTicketFilters}
          />

          <TicketKpiCards analytics={ticketAnalytics} />

          <TicketAnalyticsPanel
            analytics={ticketAnalytics}
            chartSettings={chartSettings}
          />

          <TicketReportTable
            title="Filtered Ticket Analytics Table"
            tickets={filteredTickets}
          />

          <PivotTable
            rows={filteredTickets}
            title="Ticket Analytics Pivot Table"
          />
        </>
      ) : (
        <>
          <ProductFilters
            products={productRows}
            filters={productFilters}
            onChange={setProductFilters}
          />

          <ProductCategoryCards
            categorySummary={productAnalytics.categorySummary}
          />

          <section className="grid gap-6 xl:grid-cols-2">
            <ChartPanel
              title="Product Category Count"
              data={productAnalytics.categorySummary}
              type={chartSettings.categoryChart}
            />

            <ChartPanel
              title="SKU Records"
              data={productAnalytics.skuSummary}
              type={chartSettings.productChart}
            />

            <SummaryTable
              title="Category Count Summary"
              data={productAnalytics.categorySummary}
            />

            <SummaryTable
              title="Duplicate SKU Summary"
              data={productAnalytics.duplicateSkus}
            />
          </section>

          <ProductReportTable
            title="Filtered Product Master Table"
            products={filteredProducts}
          />

          <PivotTable
            rows={filteredProducts}
            title="Product Master Pivot Table"
          />
        </>
      )}
    </div>
  );
}