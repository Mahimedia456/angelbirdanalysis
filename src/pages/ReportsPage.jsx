import { useEffect, useMemo, useState } from "react";
import ProductFilters from "../components/products/ProductFilters";
import ProductReportTable from "../components/products/ProductReportTable";
import ProductCategoryCards from "../components/products/ProductCategoryCards";
import TicketFilters from "../components/tickets/TicketFilters";
import TicketKpiCards from "../components/tickets/TicketKpiCards";
import TicketAnalyticsPanel from "../components/tickets/TicketAnalyticsPanel";
import TicketReportTable from "../components/tickets/TicketReportTable";
import SummaryTable from "../components/dashboard/SummaryTable";
import ChartPanel from "../components/dashboard/ChartPanel";
import PivotTable from "../components/dashboard/PivotTable";
import ExportActions from "../components/export/ExportActions";
import SatisfactionFilters from "../components/satisfaction/SatisfactionFilters";
import SatisfactionKpiCards from "../components/satisfaction/SatisfactionKpiCards";
import SatisfactionAnalyticsPanel from "../components/satisfaction/SatisfactionAnalyticsPanel";
import SatisfactionReportTable from "../components/satisfaction/SatisfactionReportTable";
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

export default function ReportsPage() {
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
      <section className="overflow-hidden rounded-[38px] border border-slate-200 bg-white shadow-soft">
        <div
          className="p-8 md:p-10"
          style={{ background: "var(--accent-color)" }}
        >
          <div>
            <p className="angel-mini-label text-slate-700">
              Angelbird Report Center
            </p>

            <h1 className="mt-3 max-w-3xl text-4xl font-black leading-none tracking-[-0.06em] text-slate-950 md:text-6xl">
              Printable analytics report.
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-700">
              Reports include charts, KPI summaries, pivot tables and detailed
              data tables for export.
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
            Ticket Report
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
            Product Master Report
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
            Satisfaction Report
          </button>
        </div>

<ExportActions
  targetId="reports-export-area"
  title={`Angelbird Report ${mode}`}
  mode="report"
/>
      </div>

      <div
        id="reports-export-area"
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
              <p className="angel-mini-label">Report Summary</p>
              <h2 className="mt-2 angel-page-title">
                Ticket Analytics Summary
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
              prefix="report"
              showTables={true}
            />

            <TicketReportTable
              title="Ticket Report Data"
              tickets={filteredTickets}
            />

            <PivotTable rows={filteredTickets} title="Ticket Report Pivot" />
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
              <p className="angel-mini-label">Report Summary</p>
              <h2 className="mt-2 angel-page-title">
                Product Master Summary
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Filtered products: {filteredProducts.length} from{" "}
                {productRows.length} total records.
              </p>
            </section>

            <ProductCategoryCards
              categorySummary={productAnalytics.categorySummary}
            />

            <div className="grid gap-6 xl:grid-cols-2">
              <ChartPanel
                chartId="report_product_category_count"
                title="Product Category Count"
                data={productAnalytics.categorySummary}
                type={chartSettings.categoryChart || "bar"}
              />

              <ChartPanel
                className="xl:col-span-2"
                chartId="report_sku_records"
                title="SKU Records"
                data={productAnalytics.skuSummary}
                type={chartSettings.productChart || "bar"}
              />

              <SummaryTable
                title="Product Category Summary"
                data={productAnalytics.categorySummary}
              />

              <SummaryTable
                title="Duplicate SKU Summary"
                data={productAnalytics.duplicateSkus}
              />
            </div>

            <ProductReportTable
              title="Product Master Report Data"
              products={filteredProducts}
            />

            <PivotTable rows={filteredProducts} title="Product Master Pivot" />
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
              <p className="angel-mini-label">Report Summary</p>
              <h2 className="mt-2 angel-page-title">
                Customer Satisfaction Summary
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
              prefix="report"
              showTables={true}
            />

            <SatisfactionReportTable
              title="Customer Satisfaction Report Data"
              rows={filteredSatisfaction}
            />
          </>
        )}
      </div>
    </div>
  );
}