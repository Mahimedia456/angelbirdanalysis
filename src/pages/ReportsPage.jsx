import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  SmilePlus,
} from "lucide-react";

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
} from "../utils/storage";

import {
  getSelectedReportingPeriod,
  saveSelectedReportingPeriod,
} from "../utils/reportingPeriod";

import {
  fetchReportsData,
} from "../services/reportsApi";

import {
  buildProductAnalytics,
} from "../utils/analytics";

import {
  filterProducts,
} from "../utils/productMapper";

import {
  filterTickets,
} from "../utils/ticketMapper";

import {
  buildTicketAnalytics,
} from "../utils/ticketAnalytics";

import {
  filterSatisfaction,
} from "../utils/satisfactionMapper";

import {
  buildSatisfactionAnalytics,
} from "../utils/satisfactionAnalytics";

function ReportModeButton({
  active,
  icon: Icon,
  children,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition",
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
      ].join(" ")}
    >
      <Icon size={16} />

      {children}
    </button>
  );
}

function ReportsLoading() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-slate-200 bg-white">
      <div className="text-center">
        <Loader2
          size={34}
          className="mx-auto animate-spin text-slate-700"
        />

        <p className="mt-4 text-sm font-black text-slate-600">
          Loading monthly reports...
        </p>
      </div>
    </div>
  );
}

function EmptyPeriodState() {
  return (
    <section className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-slate-200 bg-white p-8 text-center">
      <div>
        <CalendarDays
          size={38}
          className="mx-auto text-slate-300"
        />

        <h2 className="mt-5 text-2xl font-extrabold text-slate-950">
          No reporting month available
        </h2>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          Create a reporting period and
          import monthly records before
          generating reports.
        </p>
      </div>
    </section>
  );
}

export default function ReportsPage() {
  const [
    mode,
    setMode,
  ] = useState("tickets");

  const [
    ticketRows,
    setTicketRows,
  ] = useState([]);

  const [
    productRows,
    setProductRows,
  ] = useState([]);

  const [
    satisfactionRows,
    setSatisfactionRows,
  ] = useState([]);

  const [
    periods,
    setPeriods,
  ] = useState([]);

  const [
    selectedPeriod,
    setSelectedPeriod,
  ] = useState(null);

  const [
    selectedPeriodKey,
    setSelectedPeriodKey,
  ] = useState(
    getSelectedReportingPeriod()
  );

  const [
    chartSettings,
    setChartSettings,
  ] = useState(
    getChartSettings()
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    ticketFilters,
    setTicketFilters,
  ] = useState({
    search: "",
    region: "",
    supportCategory: "",
    productCategory: "",
    procedure: "",
    dateFrom: "",
    dateTo: "",
  });

  const [
    productFilters,
    setProductFilters,
  ] = useState({
    search: "",
    category: "",
  });

  const [
    satisfactionFilters,
    setSatisfactionFilters,
  ] = useState({
    search: "",
    rating: "",
    reason: "",
    solvedStatus: "",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    const controller =
      new AbortController();

    loadReports({
      period:
        getSelectedReportingPeriod(),

      signal:
        controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, []);

  async function loadReports({
    period =
      selectedPeriodKey,

    signal,
  } = {}) {
    setLoading(true);
    setError("");

    try {
      const data =
        await fetchReportsData({
          period,
          signal,
        });

      const returnedPeriod =
        data?.selectedPeriod ||
        null;

      const returnedPeriodKey =
        returnedPeriod
          ?.period_key || "";

      setPeriods(
        data?.periods || []
      );

      setSelectedPeriod(
        returnedPeriod
      );

      setSelectedPeriodKey(
        returnedPeriodKey
      );

      saveSelectedReportingPeriod(
        returnedPeriodKey
      );

      setTicketRows(
        data?.tickets || []
      );

      setProductRows(
        data?.products || []
      );

      setSatisfactionRows(
        data?.satisfaction ||
          []
      );

      setChartSettings(
        getChartSettings()
      );

      resetFilters();
    } catch (loadError) {
      if (
        loadError.name ===
        "AbortError"
      ) {
        return;
      }

      setError(
        loadError.message ||
          "Unable to load report data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handlePeriodChange(
    event
  ) {
    const periodKey =
      event.target.value;

    setSelectedPeriodKey(
      periodKey
    );

    saveSelectedReportingPeriod(
      periodKey
    );

    await loadReports({
      period: periodKey,
    });
  }

  function resetFilters() {
    setTicketFilters({
      search: "",
      region: "",
      supportCategory: "",
      productCategory: "",
      procedure: "",
      dateFrom: "",
      dateTo: "",
    });

    setProductFilters({
      search: "",
      category: "",
    });

    setSatisfactionFilters({
      search: "",
      rating: "",
      reason: "",
      solvedStatus: "",
      dateFrom: "",
      dateTo: "",
    });
  }

  const filteredTickets =
    useMemo(
      () =>
        filterTickets(
          ticketRows,
          ticketFilters
        ),
      [
        ticketRows,
        ticketFilters,
      ]
    );

  const ticketAnalytics =
    useMemo(
      () =>
        buildTicketAnalytics(
          filteredTickets
        ),
      [
        filteredTickets,
      ]
    );

  const filteredProducts =
    useMemo(
      () =>
        filterProducts(
          productRows,
          productFilters
        ),
      [
        productRows,
        productFilters,
      ]
    );

  const productAnalytics =
    useMemo(
      () =>
        buildProductAnalytics(
          filteredProducts
        ),
      [
        filteredProducts,
      ]
    );

  const filteredSatisfaction =
    useMemo(
      () =>
        filterSatisfaction(
          satisfactionRows,
          satisfactionFilters
        ),
      [
        satisfactionRows,
        satisfactionFilters,
      ]
    );

  const satisfactionAnalytics =
    useMemo(
      () =>
        buildSatisfactionAnalytics(
          filteredSatisfaction
        ),
      [
        filteredSatisfaction,
      ]
    );

  const currentModeLabel =
    mode === "tickets"
      ? "Ticket Report"
      : mode === "products"
      ? "Product Report"
      : "Satisfaction Report";

  const exportTitle =
    `Angelbird ${
      selectedPeriod
        ?.period_name ||
      "Monthly"
    } ${currentModeLabel}`;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[38px] border border-slate-200 bg-slate-900 p-8 text-white shadow-soft md:p-10">
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-20 angel-grid-bg" />

        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full border-[55px] border-white/[0.035]" />

        <div className="relative grid gap-8 xl:grid-cols-[1fr_0.9fr] xl:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/45">
                Angelbird Report Center
              </p>

              {selectedPeriod ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-black text-white/80">
                  <CalendarDays
                    size={14}
                  />

                  {
                    selectedPeriod
                      .period_name
                  }
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-none tracking-[-0.06em] md:text-6xl">
              Printable monthly
              analytics reports.
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/65">
              Generate charts, KPI
              summaries, pivot tables
              and detailed data tables
              from the selected monthly
              reporting period.
            </p>
          </div>

          <div
            className="rounded-[30px] p-6 text-slate-900"
            style={{
              background:
                "var(--accent-color)",
            }}
          >
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-700">
              Current Report
            </p>

            <h2 className="mt-3 text-4xl font-black leading-none tracking-[-0.07em] md:text-5xl">
              {mode === "tickets"
                ? "Tickets"
                : mode ===
                  "products"
                ? "Products"
                : "Satisfaction"}
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-700">
              Tickets:{" "}
              {ticketRows.length} ·
              Products:{" "}
              {productRows.length} ·
              Satisfaction:{" "}
              {
                satisfactionRows.length
              }
            </p>

            <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-slate-600">
              {selectedPeriod
                ?.period_name ||
                "No reporting month"}
            </p>
          </div>
        </div>
      </section>

      <section className="no-print no-export rounded-[28px] border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-wrap gap-2">
            <ReportModeButton
              active={
                mode ===
                "tickets"
              }
              icon={
                FileSpreadsheet
              }
              onClick={() =>
                setMode(
                  "tickets"
                )
              }
            >
              Ticket Report
            </ReportModeButton>

            <ReportModeButton
              active={
                mode ===
                "products"
              }
              icon={Database}
              onClick={() =>
                setMode(
                  "products"
                )
              }
            >
              Product Master Report
            </ReportModeButton>

            <ReportModeButton
              active={
                mode ===
                "satisfaction"
              }
              icon={SmilePlus}
              onClick={() =>
                setMode(
                  "satisfaction"
                )
              }
            >
              Satisfaction Report
            </ReportModeButton>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end xl:w-auto">
            <div className="min-w-0 sm:w-[240px]">
              <label
                htmlFor="reports-reporting-period"
                className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500"
              >
                Reporting Month
              </label>

              <select
                id="reports-reporting-period"
                value={
                  selectedPeriodKey
                }
                onChange={
                  handlePeriodChange
                }
                disabled={
                  loading ||
                  !periods.length
                }
                className="angel-input h-12"
              >
                {!periods.length ? (
                  <option value="">
                    No reporting periods
                  </option>
                ) : null}

                {periods.map(
                  (period) => (
                    <option
                      key={
                        period.id
                      }
                      value={
                        period.period_key
                      }
                    >
                      {
                        period.period_name
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={() =>
                loadReports({
                  period:
                    selectedPeriodKey,
                })
              }
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <RefreshCw
                  size={17}
                />
              )}

              Refresh
            </button>

            <ExportActions
              targetId="reports-export-area"
              title={
                exportTitle
              }
              mode="report"
            />
          </div>
        </div>
      </section>

      {error ? (
        <section className="flex items-start gap-3 rounded-[22px] border border-red-200 bg-red-50 p-5 text-red-700">
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-black">
              Report data could not
              be loaded
            </p>

            <p className="mt-1 text-sm leading-6">
              {error}
            </p>
          </div>
        </section>
      ) : null}

      {loading ? (
        <ReportsLoading />
      ) : !selectedPeriod ? (
        <EmptyPeriodState />
      ) : (
        <div
          id="reports-export-area"
          className="space-y-8 rounded-[28px] bg-white p-1"
        >
          <section className="pdf-export-section rounded-[24px] border border-slate-200 bg-white p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="angel-mini-label">
                  Monthly Report
                </p>

                <h2 className="mt-2 angel-page-title">
                  {
                    selectedPeriod
                      .period_name
                  }
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  All charts, summaries,
                  tables and exported data
                  belong to this reporting
                  month.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-lime-100 px-4 py-2 text-xs font-black text-lime-800">
                <CheckCircle2
                  size={15}
                />

                Database Report
              </div>
            </div>
          </section>

          {mode ===
          "tickets" ? (
            <>
              <div className="no-print no-export">
                <TicketFilters
                  tickets={
                    ticketRows
                  }
                  filters={
                    ticketFilters
                  }
                  onChange={
                    setTicketFilters
                  }
                />
              </div>

              <section className="angel-section p-6 pdf-export-section">
                <p className="angel-mini-label">
                  Report Summary
                </p>

                <h2 className="mt-2 angel-page-title">
                  Ticket Analytics Summary
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Filtered tickets:{" "}
                  {
                    filteredTickets.length
                  }{" "}
                  from{" "}
                  {
                    ticketRows.length
                  }{" "}
                  total records for{" "}
                  {
                    selectedPeriod
                      .period_name
                  }.
                </p>
              </section>

              <TicketKpiCards
                analytics={
                  ticketAnalytics
                }
              />

              <TicketAnalyticsPanel
                analytics={
                  ticketAnalytics
                }
                chartSettings={
                  chartSettings
                }
                prefix="report"
                showTables
              />

              <TicketReportTable
                title={`Ticket Report Data — ${selectedPeriod.period_name}`}
                tickets={
                  filteredTickets
                }
              />

              <PivotTable
                rows={
                  filteredTickets
                }
                title={`Ticket Report Pivot — ${selectedPeriod.period_name}`}
              />
            </>
          ) : mode ===
            "products" ? (
            <>
              <div className="no-print no-export">
                <ProductFilters
                  products={
                    productRows
                  }
                  filters={
                    productFilters
                  }
                  onChange={
                    setProductFilters
                  }
                />
              </div>

              <section className="angel-section p-6 pdf-export-section">
                <p className="angel-mini-label">
                  Report Summary
                </p>

                <h2 className="mt-2 angel-page-title">
                  Product Master Summary
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Filtered products:{" "}
                  {
                    filteredProducts.length
                  }{" "}
                  from{" "}
                  {
                    productRows.length
                  }{" "}
                  total records for{" "}
                  {
                    selectedPeriod
                      .period_name
                  }.
                </p>
              </section>

              <ProductCategoryCards
                categorySummary={
                  productAnalytics
                    .categorySummary
                }
              />

              <div className="grid gap-6 xl:grid-cols-2">
                <ChartPanel
                  chartId="report_product_category_count"
                  title="Product Category Count"
                  data={
                    productAnalytics
                      .categorySummary
                  }
                  type={
                    chartSettings
                      .categoryChart ||
                    "bar"
                  }
                />

                <ChartPanel
                  className="xl:col-span-2"
                  chartId="report_sku_records"
                  title="SKU Records"
                  data={
                    productAnalytics
                      .skuSummary
                  }
                  type={
                    chartSettings
                      .productChart ||
                    "bar"
                  }
                />

                <SummaryTable
                  title="Product Category Summary"
                  data={
                    productAnalytics
                      .categorySummary
                  }
                />

                <SummaryTable
                  title="Duplicate SKU Summary"
                  data={
                    productAnalytics
                      .duplicateSkus
                  }
                />
              </div>

              <ProductReportTable
                title={`Product Master Report Data — ${selectedPeriod.period_name}`}
                products={
                  filteredProducts
                }
              />

              <PivotTable
                rows={
                  filteredProducts
                }
                title={`Product Master Pivot — ${selectedPeriod.period_name}`}
              />
            </>
          ) : (
            <>
              <div className="no-print no-export">
                <SatisfactionFilters
                  rows={
                    satisfactionRows
                  }
                  filters={
                    satisfactionFilters
                  }
                  onChange={
                    setSatisfactionFilters
                  }
                />
              </div>

              <section className="angel-section p-6 pdf-export-section">
                <p className="angel-mini-label">
                  Report Summary
                </p>

                <h2 className="mt-2 angel-page-title">
                  Customer Satisfaction Summary
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Filtered responses:{" "}
                  {
                    filteredSatisfaction.length
                  }{" "}
                  from{" "}
                  {
                    satisfactionRows.length
                  }{" "}
                  total records for{" "}
                  {
                    selectedPeriod
                      .period_name
                  }.
                </p>
              </section>

              <SatisfactionKpiCards
                analytics={
                  satisfactionAnalytics
                }
              />

              <SatisfactionAnalyticsPanel
                analytics={
                  satisfactionAnalytics
                }
                chartSettings={
                  chartSettings
                }
                prefix="report"
                showTables
              />

              <SatisfactionReportTable
                title={`Customer Satisfaction Report Data — ${selectedPeriod.period_name}`}
                rows={
                  filteredSatisfaction
                }
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}