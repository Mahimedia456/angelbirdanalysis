import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Database,
  Eye,
  FileSpreadsheet,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  SmilePlus,
  Trash2,
  UploadCloud,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import CsvUploader from "../components/upload/CsvUploader";
import DataPreview from "../components/upload/DataPreview";

import ProductTemplateDownload from "../components/products/ProductTemplateDownload";
import ProductColumnMapper from "../components/products/ProductColumnMapper";
import ProductReportTable from "../components/products/ProductReportTable";

import TicketColumnMapper from "../components/tickets/TicketColumnMapper";
import TicketReportTable from "../components/tickets/TicketReportTable";

import SatisfactionReportTable from "../components/satisfaction/SatisfactionReportTable";

import {
  useAuth,
} from "../context/AuthContext";

import {
  canUploadData,
  formatRoleName,
} from "../utils/permissions";

import {
  fetchApiHealth,
  fetchHomeOverview,
} from "../services/homeApi";

import {
  importMonthlyDataset,
} from "../services/importsApi";

import {
  deleteSelectedPeriodData,
} from "../services/dataManagementApi";

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

import {
  findPeriodByKey,
  getAvailableYears,
  getPeriodsForYear,
  getSelectedReportingPeriod,
  saveSelectedReportingPeriod,
} from "../utils/reportingPeriod";

const featureCards = [
  {
    title: "Ticket Analytics",
    description:
      "Analyze monthly support volume, products, categories, procedures and regional performance.",
    icon: FileSpreadsheet,
  },
  {
    title: "Product Master",
    description:
      "Review monthly product snapshots with product, category, SKU, EAN and UPC information.",
    icon: Database,
  },
  {
    title:
      "Customer Satisfaction",
    description:
      "Review ratings, comments, reasons, solved status and date-wise response trends.",
    icon: SmilePlus,
  },
  {
    title: "Yearly Reporting",
    description:
      "Move between reporting years and every available monthly reporting period.",
    icon: BarChart3,
  },
];

const INITIAL_IMPORT_STATE = {
  tickets: false,
  products: false,
  satisfaction: false,
};

function CompactStat({
  label,
  value,
  description,
}) {
  return (
    <article className="min-w-0 rounded-[20px] border border-slate-200 bg-white/95 px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="break-words text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
            {label}
          </p>

          <p className="mt-2 break-words text-xs leading-5 text-slate-400">
            {description}
          </p>
        </div>

        <p className="shrink-0 text-3xl font-extrabold tracking-[-0.05em] text-slate-950">
          {Number(
            value || 0
          ).toLocaleString()}
        </p>
      </div>
    </article>
  );
}




function ImportStatusNotice({
  importState,
  message,
  error,
}) {
  const importingDataset =
    Object.entries(
      importState
    ).find(
      ([, loading]) =>
        loading
    )?.[0] || "";

  if (importingDataset) {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-800">
        <Loader2
          size={19}
          className="mt-0.5 shrink-0 animate-spin"
        />

        <div>
          <p className="font-black">
            Uploading and saving data
          </p>

          <p className="mt-1 text-sm leading-6">
            {importingDataset
              .charAt(0)
              .toUpperCase() +
              importingDataset.slice(
                1
              )}{" "}
            CSV is being uploaded to
            Storage and saved to the
            database.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
        <AlertCircle
          size={19}
          className="mt-0.5 shrink-0"
        />

        <div>
          <p className="font-black">
            Operation failed
          </p>

          <p className="mt-1 text-sm leading-6">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (message) {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-lime-200 bg-lime-50 p-4 text-lime-800">
        <CheckCircle2
          size={19}
          className="mt-0.5 shrink-0"
        />

        <div>
          <p className="font-black">
            Operation completed
          </p>

          <p className="mt-1 text-sm leading-6">
            {message}
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export default function HomePage() {
  const {
    user,
  } = useAuth();

  const uploadAllowed =
    canUploadData(
      user?.role
    );

  const [
    rawTicketRows,
    setRawTicketRows,
  ] = useState([]);

  const [
    ticketRows,
    setTicketRows,
  ] = useState([]);

  const [
    rawProductRows,
    setRawProductRows,
  ] = useState([]);

  const [
    productRows,
    setProductRows,
  ] = useState([]);

  const [
    rawSatisfactionRows,
    setRawSatisfactionRows,
  ] = useState([]);

  const [
    satisfactionRows,
    setSatisfactionRows,
  ] = useState([]);

  const [
    overview,
    setOverview,
  ] = useState(null);

  const [
    health,
    setHealth,
  ] = useState(null);

  const [
    selectedPeriodKey,
    setSelectedPeriodKey,
  ] = useState(
    getSelectedReportingPeriod()
  );

  const [
    selectedYear,
    setSelectedYear,
  ] = useState("");

  const [
    overviewLoading,
    setOverviewLoading,
  ] = useState(true);

  const [
    overviewError,
    setOverviewError,
  ] = useState("");

  const [
    operationMessage,
    setOperationMessage,
  ] = useState("");

  const [
    operationError,
    setOperationError,
  ] = useState("");

  const [
    importState,
    setImportState,
  ] = useState(
    INITIAL_IMPORT_STATE
  );

  const [
    deletingPeriod,
    setDeletingPeriod,
  ] = useState(false);

  const importBusy =
    Object.values(
      importState
    ).some(Boolean);

  const actionBusy =
    overviewLoading ||
    importBusy ||
    deletingPeriod;

  const resetLocalPreview =
    useCallback(() => {
      clearAllData();

      setRawTicketRows([]);
      setTicketRows([]);

      setRawProductRows([]);
      setProductRows([]);

      setRawSatisfactionRows([]);
      setSatisfactionRows([]);
    }, []);

  useEffect(() => {
    if (!uploadAllowed) {
      resetLocalPreview();
      return;
    }

    setRawTicketRows(
      getRawTicketsData()
    );

    setTicketRows(
      getTicketsData()
    );

    setRawProductRows(
      getRawProductsData()
    );

    setProductRows(
      getProductsData()
    );

    setRawSatisfactionRows(
      getRawSatisfactionData()
    );

    setSatisfactionRows(
      getSatisfactionData()
    );
  }, [
    uploadAllowed,
    resetLocalPreview,
  ]);

  const loadOverview =
    useCallback(
      async ({
        period,
        signal,
      } = {}) => {
        const requestedPeriod =
          period ??
          selectedPeriodKey;

        setOverviewLoading(true);
        setOverviewError("");

        try {
          const [
            healthResponse,
            overviewResponse,
          ] = await Promise.all([
            fetchApiHealth({
              signal,
            }),

            fetchHomeOverview({
              period:
                requestedPeriod,
              signal,
            }),
          ]);

          setHealth(
            healthResponse
          );

          setOverview(
            overviewResponse
          );

          const returnedPeriod =
            overviewResponse
              ?.selectedPeriod ||
            null;

          const returnedPeriodKey =
            returnedPeriod
              ?.period_key || "";

          setSelectedPeriodKey(
            returnedPeriodKey
          );

          setSelectedYear(
            returnedPeriod
              ?.report_year
              ? String(
                  returnedPeriod
                    .report_year
                )
              : ""
          );

          saveSelectedReportingPeriod(
            returnedPeriodKey
          );
        } catch (error) {
          if (
            error.name ===
            "AbortError"
          ) {
            return;
          }

          setOverviewError(
            error.message ||
              "Unable to load the reporting overview."
          );
        } finally {
          setOverviewLoading(false);
        }
      },
      [selectedPeriodKey]
    );

  useEffect(() => {
    const controller =
      new AbortController();

    loadOverview({
      period:
        getSelectedReportingPeriod(),

      signal:
        controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, []);

  const periods =
    overview?.periods || [];

  const availableYears =
    useMemo(
      () =>
        getAvailableYears(
          periods
        ),
      [periods]
    );

  const selectedYearPeriods =
    useMemo(
      () =>
        getPeriodsForYear(
          periods,
          selectedYear
        ),
      [
        periods,
        selectedYear,
      ]
    );

  const selectedPeriod =
    overview?.selectedPeriod ||
    findPeriodByKey(
      periods,
      selectedPeriodKey
    );

  const databaseSummary =
    overview?.periodSummary || {
      ticketCount: 0,
      productCount: 0,
      satisfactionCount: 0,
      importBatchCount: 0,
    };

  const apiConnected =
    Boolean(
      health?.success &&
        health?.supabase
          ?.connected
    );

  const localSummary =
    useMemo(
      () => ({
        tickets:
          ticketRows.length,

        products:
          productRows.length,

        satisfaction:
          satisfactionRows.length,

        rawRows:
          rawTicketRows.length +
          rawProductRows.length +
          rawSatisfactionRows.length,
      }),
      [
        ticketRows,
        productRows,
        satisfactionRows,
        rawTicketRows,
        rawProductRows,
        rawSatisfactionRows,
      ]
    );

  async function handleYearChange(
    event
  ) {
    const year =
      event.target.value;

    setSelectedYear(
      year
    );

    setOperationMessage("");
    setOperationError("");

    const periodsForYear =
      getPeriodsForYear(
        periods,
        year
      );

    const firstPeriod =
      periodsForYear[0];

    if (!firstPeriod) {
      setSelectedPeriodKey("");

      saveSelectedReportingPeriod(
        ""
      );

      return;
    }

    setSelectedPeriodKey(
      firstPeriod.period_key
    );

    saveSelectedReportingPeriod(
      firstPeriod.period_key
    );

    await loadOverview({
      period:
        firstPeriod.period_key,
    });
  }

  async function handlePeriodChange(
    event
  ) {
    const periodKey =
      event.target.value;

    setSelectedPeriodKey(
      periodKey
    );

    setOperationMessage("");
    setOperationError("");

    saveSelectedReportingPeriod(
      periodKey
    );

    await loadOverview({
      period:
        periodKey,
    });
  }

  async function saveDatasetAutomatically({
    datasetType,
    file,
    rawRows,
    mappedRows,
    columnMapping,
  }) {
    if (
      !uploadAllowed ||
      !selectedPeriodKey ||
      !Array.isArray(
        rawRows
      ) ||
      !rawRows.length
    ) {
      return;
    }

    setOperationMessage("");
    setOperationError("");

    setImportState(
      (current) => ({
        ...current,
        [datasetType]: true,
      })
    );

    try {
      /*
       * Backend receives original CSV rows.
       * Frontend mapped rows remain preview-only.
       */
      const result =
        await importMonthlyDataset({
          datasetType,

          periodKey:
            selectedPeriodKey,

          file,

          rows:
            rawRows,

          columnMapping:
            columnMapping || {},
        });

      const insertedRows =
        result?.summary
          ?.insertedRows || 0;

      const invalidRows =
        result?.summary
          ?.invalidRows || 0;

      const duplicateRows =
        result?.summary
          ?.duplicateRows || 0;

      const periodName =
        result?.period
          ?.period_name ||
        selectedPeriod
          ?.period_name ||
        "selected period";

      if (
        datasetType ===
        "tickets"
      ) {
        setTicketRows(
          mappedRows
        );
      }

      if (
        datasetType ===
        "products"
      ) {
        setProductRows(
          mappedRows
        );
      }

      if (
        datasetType ===
        "satisfaction"
      ) {
        setSatisfactionRows(
          mappedRows
        );
      }

      setOperationMessage(
        `${insertedRows} ${datasetType} records saved to ${periodName}.${
          invalidRows
            ? ` ${invalidRows} invalid rows skipped.`
            : ""
        }${
          duplicateRows
            ? ` ${duplicateRows} duplicate rows skipped.`
            : ""
        }`
      );

      await loadOverview({
        period:
          selectedPeriodKey,
      });
    } catch (error) {
      setOperationError(
        error.message ||
          `Unable to import ${datasetType} data.`
      );
    } finally {
      setImportState(
        (current) => ({
          ...current,
          [datasetType]: false,
        })
      );
    }
  }

  async function handleTicketUpload({
    file,
    rows,
  }) {
    if (
      !uploadAllowed ||
      !selectedPeriodKey
    ) {
      return;
    }

    const rawRows =
      Array.isArray(rows)
        ? rows
        : [];

    saveRawTicketsData(
      rawRows
    );

    setRawTicketRows(
      rawRows
    );

    const columns =
      rawRows.length
        ? Object.keys(
            rawRows[0]
          )
        : [];

    const mapping =
      detectTicketMapping(
        columns
      );

    const mappedRows =
      applyTicketMapping(
        rawRows,
        mapping
      );

    saveTicketMapping(
      mapping
    );

    saveTicketsData(
      mappedRows
    );

    setTicketRows(
      mappedRows
    );

    await saveDatasetAutomatically({
      datasetType:
        "tickets",

      file,
      rawRows,
      mappedRows,

      columnMapping:
        mapping,
    });
  }

  async function handleProductUpload({
    file,
    rows,
  }) {
    if (
      !uploadAllowed ||
      !selectedPeriodKey
    ) {
      return;
    }

    const rawRows =
      Array.isArray(rows)
        ? rows
        : [];

    saveRawProductsData(
      rawRows
    );

    setRawProductRows(
      rawRows
    );

    const columns =
      rawRows.length
        ? Object.keys(
            rawRows[0]
          )
        : [];

    const mapping =
      detectProductMapping(
        columns
      );

    const mappedRows =
      applyProductMapping(
        rawRows,
        mapping
      );

    saveProductMapping(
      mapping
    );

    saveProductsData(
      mappedRows
    );

    setProductRows(
      mappedRows
    );

    await saveDatasetAutomatically({
      datasetType:
        "products",

      file,
      rawRows,
      mappedRows,

      columnMapping:
        mapping,
    });
  }

  async function handleSatisfactionUpload({
    file,
    rows,
  }) {
    if (
      !uploadAllowed ||
      !selectedPeriodKey
    ) {
      return;
    }

    const rawRows =
      Array.isArray(rows)
        ? rows
        : [];

    saveRawSatisfactionData(
      rawRows
    );

    setRawSatisfactionRows(
      rawRows
    );

    const columns =
      rawRows.length
        ? Object.keys(
            rawRows[0]
          )
        : [];

    const mapping =
      detectSatisfactionMapping(
        columns
      );

    const mappedRows =
      applySatisfactionMapping(
        rawRows,
        mapping
      );

    saveSatisfactionMapping(
      mapping
    );

    saveSatisfactionData(
      mappedRows
    );

    setSatisfactionRows(
      mappedRows
    );

    await saveDatasetAutomatically({
      datasetType:
        "satisfaction",

      file,
      rawRows,
      mappedRows,

      columnMapping:
        mapping,
    });
  }

  function handleTicketsMapped(
    mappedTickets
  ) {
    if (!uploadAllowed) {
      return;
    }

    saveTicketsData(
      mappedTickets
    );

    setTicketRows(
      mappedTickets
    );
  }

  function handleProductsMapped(
    mappedProducts
  ) {
    if (!uploadAllowed) {
      return;
    }

    saveProductsData(
      mappedProducts
    );

    setProductRows(
      mappedProducts
    );
  }

  async function handleDeleteSelectedPeriod() {
    if (
      !uploadAllowed ||
      !selectedPeriodKey ||
      deletingPeriod
    ) {
      return;
    }

    const periodName =
      selectedPeriod
        ?.period_name ||
      selectedPeriodKey;

    const confirmed =
      window.confirm(
        `Delete all ${periodName} data?\n\nThis will permanently delete ticket records, product records, satisfaction records, import history, Storage CSV files and local browser previews.\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    setDeletingPeriod(true);
    setOperationMessage("");
    setOperationError("");

    try {
      const result =
        await deleteSelectedPeriodData(
          selectedPeriodKey
        );

      resetLocalPreview();

      setOperationMessage(
        `${
          result?.period
            ?.period_name ||
          periodName
        } data deleted successfully.`
      );

      await loadOverview({
        period:
          selectedPeriodKey,
      });
    } catch (error) {
      setOperationError(
        error.message ||
          "Unable to delete the selected period data."
      );
    } finally {
      setDeletingPeriod(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-soft">
        <div className="pointer-events-none absolute inset-0 angel-grid-bg opacity-55" />

        <div
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full opacity-90"
          style={{
            background:
              "var(--accent-color)",
          }}
        />

        <div className="relative px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 shadow-sm">
                  <ShieldCheck
                    size={15}
                    className="shrink-0 text-slate-700"
                  />

                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Angelbird Analytics Workspace
                  </span>
                </div>

              
              </div>

              <h1 className="mt-5 max-w-[900px] text-[clamp(2.4rem,4.2vw,4.6rem)] font-extrabold leading-[0.98] tracking-[-0.05em] text-slate-950">
                Year and month based
                operational reporting.
              </h1>

              <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                Select the reporting year
                and month. A selected CSV
                is mapped for preview,
                uploaded to Storage and
                saved automatically in the
                selected reporting period.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  to="/dashboard"
                  className="angel-btn angel-btn-dark gap-2"
                >
                  Open Dashboard

                  <ArrowRight
                    size={17}
                  />
                </Link>

                <Link
                  to="/reports"
                  className="angel-btn angel-btn-lime"
                >
                  View Reports
                </Link>

                {uploadAllowed ? (
                  <>
                    <a
                      href="#data-import"
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                    >
                      <UploadCloud
                        size={17}
                      />

                      Upload Data
                    </a>

                    <button
                      type="button"
                      onClick={
                        handleDeleteSelectedPeriod
                      }
                      disabled={
                        actionBusy ||
                        !selectedPeriodKey
                      }
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingPeriod ? (
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2
                          size={17}
                        />
                      )}

                      {deletingPeriod
                        ? "Deleting Month..."
                        : "Delete Month Data"}
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            <div className="w-full min-w-0 rounded-[24px] border border-slate-200 bg-white/95 p-5 shadow-sm xl:max-w-[390px]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="angel-mini-label">
                    Reporting Period
                  </p>

                  <h2 className="mt-2 text-xl font-extrabold text-slate-950">
                    {selectedPeriod
                      ?.period_name ||
                      "No period selected"}
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    This period is shared
                    with Home, Dashboard
                    and Reports.
                  </p>
                </div>

                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-slate-950"
                  style={{
                    background:
                      "var(--accent-color)",
                  }}
                >
                  <CalendarDays
                    size={19}
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="reporting-year"
                    className="angel-label"
                  >
                    Year
                  </label>

                  <select
                    id="reporting-year"
                    className="angel-input"
                    value={
                      selectedYear
                    }
                    onChange={
                      handleYearChange
                    }
                    disabled={
                      actionBusy ||
                      !availableYears.length
                    }
                  >
                    {!availableYears.length ? (
                      <option value="">
                        No years
                      </option>
                    ) : null}

                    {availableYears.map(
                      (year) => (
                        <option
                          key={year}
                          value={year}
                        >
                          {year}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="reporting-month"
                    className="angel-label"
                  >
                    Month
                  </label>

                  <select
                    id="reporting-month"
                    className="angel-input"
                    value={
                      selectedPeriodKey
                    }
                    onChange={
                      handlePeriodChange
                    }
                    disabled={
                      actionBusy ||
                      !selectedYearPeriods.length
                    }
                  >
                    {!selectedYearPeriods.length ? (
                      <option value="">
                        No months
                      </option>
                    ) : null}

                    {selectedYearPeriods.map(
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
              </div>

              <button
                type="button"
                onClick={() =>
                  loadOverview({
                    period:
                      selectedPeriodKey,
                  })
                }
                disabled={
                  actionBusy ||
                  !selectedPeriodKey
                }
                className="angel-btn angel-btn-dark mt-4 w-full gap-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {overviewLoading ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <RefreshCw
                    size={17}
                  />
                )}

                Refresh Period
              </button>
            </div>
          </div>

          {overviewError ? (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0"
              />

              <div>
                <p className="font-black">
                  Backend connection problem
                </p>

                <p className="mt-1 text-sm leading-6">
                  {overviewError}
                </p>
              </div>
            </div>
          ) : null}

          <ImportStatusNotice
            importState={
              importState
            }
            message={
              operationMessage
            }
            error={
              operationError
            }
          />

          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <CompactStat
              label="Tickets"
              value={
                databaseSummary
                  .ticketCount
              }
              description={
                selectedPeriod
                  ?.period_name ||
                "Selected period"
              }
            />

            <CompactStat
              label="Products"
              value={
                databaseSummary
                  .productCount
              }
              description={
                selectedPeriod
                  ?.period_name ||
                "Selected period"
              }
            />

            <CompactStat
              label="Satisfaction"
              value={
                databaseSummary
                  .satisfactionCount
              }
              description={
                selectedPeriod
                  ?.period_name ||
                "Selected period"
              }
            />

            <CompactStat
              label="Import Batches"
              value={
                databaseSummary
                  .importBatchCount
              }
              description={
                selectedPeriod
                  ?.period_name ||
                "Selected period"
              }
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-200 pt-4">
            {[
              "Automatic CSV import",
              "Database-backed records",
              "Storage file archive",
              "Shared reporting period",
            ].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-500"
              >
                <CheckCircle2
                  size={14}
                  className="text-lime-600"
                />

                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {!uploadAllowed ? (
        <section className="flex items-start gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
            <LockKeyhole
              size={19}
            />
          </div>

          <div>
            <p className="font-extrabold text-slate-950">
              View-only access
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Your{" "}
              {formatRoleName(
                user?.role
              )}{" "}
              account can change the
              reporting year and month,
              view dashboards and generate
              reports. Upload and delete
              operations are restricted to
              Owner and Admin.
            </p>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {featureCards.map(
          (feature) => {
            const Icon =
              feature.icon;

            return (
              <article
                key={
                  feature.title
                }
                className="angel-card flex min-w-0 flex-col p-5 transition duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-slate-950"
                  style={{
                    background:
                      "var(--accent-color)",
                  }}
                >
                  <Icon
                    size={22}
                  />
                </div>

                <h2 className="mt-5 text-xl font-extrabold tracking-[-0.035em] text-slate-950">
                  {feature.title}
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {feature.description}
                </p>
              </article>
            );
          }
        )}
      </section>

      {uploadAllowed ? (
        <>
          <ProductTemplateDownload />

          <section
            id="data-import"
            className="scroll-mt-28"
          >
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="angel-mini-label">
                  Monthly Data Import
                </p>

                <h2 className="mt-2 angel-page-title">
                  Upload and save data
                  automatically.
                </h2>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                  Selecting a CSV maps it
                  for preview, uploads the
                  source file to Storage
                  and replaces the selected
                  month’s corresponding
                  database dataset.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Importing Into
                </p>

                <p className="mt-1 font-extrabold text-slate-900">
                  {selectedPeriod
                    ?.period_name ||
                    "Select year and month"}
                </p>
              </div>
            </div>

            <div className="grid items-stretch gap-6 xl:grid-cols-3">
              <CsvUploader
                eyebrow="Ticket Data"
                title="Upload Ticket Analytics CSV"
                description={`Automatically save ticket records to ${
                  selectedPeriod
                    ?.period_name ||
                  "the selected period"
                }.`}
                buttonLabel={
                  importState.tickets
                    ? "Saving Ticket CSV..."
                    : "Upload Ticket CSV"
                }
                disabled={
                  actionBusy ||
                  !selectedPeriod
                }
                onUpload={
                  handleTicketUpload
                }
              />

              <CsvUploader
                eyebrow="Product Data"
                title="Upload Product Master CSV"
                description={`Automatically save products to ${
                  selectedPeriod
                    ?.period_name ||
                  "the selected period"
                }.`}
                buttonLabel={
                  importState.products
                    ? "Saving Product CSV..."
                    : "Upload Product CSV"
                }
                disabled={
                  actionBusy ||
                  !selectedPeriod
                }
                onUpload={
                  handleProductUpload
                }
              />

              <CsvUploader
                eyebrow="Satisfaction Data"
                title="Upload Satisfaction CSV"
                description={`Automatically save satisfaction responses to ${
                  selectedPeriod
                    ?.period_name ||
                  "the selected period"
                }.`}
                buttonLabel={
                  importState.satisfaction
                    ? "Saving Satisfaction CSV..."
                    : "Upload Satisfaction CSV"
                }
                disabled={
                  actionBusy ||
                  !selectedPeriod
                }
                onUpload={
                  handleSatisfactionUpload
                }
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <CompactStat
                label="Preview Tickets"
                value={
                  localSummary
                    .tickets
                }
                description={
                  selectedPeriod
                    ?.period_name ||
                  "Selected period"
                }
              />

              <CompactStat
                label="Preview Products"
                value={
                  localSummary
                    .products
                }
                description={
                  selectedPeriod
                    ?.period_name ||
                  "Selected period"
                }
              />

              <CompactStat
                label="Preview Satisfaction"
                value={
                  localSummary
                    .satisfaction
                }
                description={
                  selectedPeriod
                    ?.period_name ||
                  "Selected period"
                }
              />

              <CompactStat
                label="Raw Rows"
                value={
                  localSummary
                    .rawRows
                }
                description="Current browser preview"
              />
            </div>
          </section>

          <TicketColumnMapper
            rawRows={
              rawTicketRows
            }
            onMapped={
              handleTicketsMapped
            }
          />

          <ProductColumnMapper
            rawRows={
              rawProductRows
            }
            onMapped={
              handleProductsMapped
            }
          />

          <section className="space-y-6">
            <div>
              <p className="angel-mini-label">
                Imported Data Preview
              </p>

              <h2 className="mt-2 angel-page-title">
                Review mapped records.
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                The database import uses
                the original CSV rows.
                These mapped rows are
                retained only for browser
                validation and preview.
              </p>
            </div>

            <DataPreview
              title="Raw Ticket CSV Preview"
              rows={
                rawTicketRows
              }
            />

            <TicketReportTable
              title="Mapped Ticket Preview"
              tickets={
                ticketRows.slice(
                  0,
                  20
                )
              }
              preview
            />

            <DataPreview
              title="Raw Product CSV Preview"
              rows={
                rawProductRows
              }
            />

            <ProductReportTable
              title="Mapped Product Preview"
              products={
                productRows.slice(
                  0,
                  20
                )
              }
              preview
            />

            <DataPreview
              title="Raw Satisfaction CSV Preview"
              rows={
                rawSatisfactionRows
              }
            />

            <SatisfactionReportTable
              title="Mapped Satisfaction Preview"
              rows={
                satisfactionRows.slice(
                  0,
                  20
                )
              }
              preview
            />
          </section>
        </>
      ) : null}
    </div>
  );
}