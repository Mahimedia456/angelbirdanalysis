import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  ShieldCheck,
  SmilePlus,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { Link } from "react-router-dom";

import CsvUploader from "../components/upload/CsvUploader";
import TicketColumnMapper from "../components/tickets/TicketColumnMapper";

import { useAuth } from "../context/AuthContext";

import {
  canUploadData,
} from "../utils/permissions";

import {
  fetchApiHealth,
  fetchHomeOverview,
} from "../services/homeApi";

import { importMonthlyDataset } from "../services/importsApi";

import { deleteSelectedPeriodData } from "../services/dataManagementApi";

import {
  clearAllData,
  getRawSatisfactionData,
  getRawTicketsData,
  getSatisfactionData,
  getTicketsData,
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
      "Upload the full ticket CSV once and view entries month-wise using the reporting period selector.",
    icon: FileSpreadsheet,
  },
  {
    title: "Customer Satisfaction",
    description:
      "Upload the full satisfaction CSV once and review responses by selected month.",
    icon: SmilePlus,
  },
  {
    title: "Monthly Reports",
    description:
      "Select any year and month to view only that period’s tickets and satisfaction records.",
    icon: BarChart3,
  },
];

const INITIAL_IMPORT_STATE = {
  tickets: false,
  satisfaction: false,
};

function CompactStat({
  label,
  value,
  description,
}) {
  return (
    <article className="min-w-0 rounded-[22px] border border-slate-200 bg-white/95 px-5 py-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="break-words text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
            {label}
          </p>

          <p className="mt-2 break-words text-xs leading-5 text-slate-400">
            {description}
          </p>
        </div>

        <p className="shrink-0 text-4xl font-extrabold tracking-[-0.06em] text-slate-950">
          {Number(value || 0).toLocaleString()}
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
    Object.entries(importState).find(([, loading]) => loading)?.[0] || "";

  if (importingDataset) {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-800">
        <Loader2 size={19} className="mt-0.5 shrink-0 animate-spin" />

        <div>
          <p className="font-black">Uploading and saving data</p>

          <p className="mt-1 text-sm leading-6">
            {importingDataset.charAt(0).toUpperCase() +
              importingDataset.slice(1)}{" "}
            CSV is being saved and split month-wise using the record date.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
        <AlertCircle size={19} className="mt-0.5 shrink-0" />

        <div>
          <p className="font-black">Operation failed</p>
          <p className="mt-1 text-sm leading-6">{error}</p>
        </div>
      </div>
    );
  }

  if (message) {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-lime-200 bg-lime-50 p-4 text-lime-800">
        <CheckCircle2 size={19} className="mt-0.5 shrink-0" />

        <div>
          <p className="font-black">Operation completed</p>
          <p className="mt-1 text-sm leading-6">{message}</p>
        </div>
      </div>
    );
  }

  return null;
}

export default function HomePage() {
  const { user } = useAuth();

  const uploadAllowed = canUploadData(user?.role);

  const [rawTicketRows, setRawTicketRows] = useState([]);
  const [ticketRows, setTicketRows] = useState([]);

  const [rawSatisfactionRows, setRawSatisfactionRows] = useState([]);
  const [satisfactionRows, setSatisfactionRows] = useState([]);

  const [overview, setOverview] = useState(null);
  const [health, setHealth] = useState(null);

  const [selectedPeriodKey, setSelectedPeriodKey] = useState(
    getSelectedReportingPeriod()
  );

  const [selectedYear, setSelectedYear] = useState("");

  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState("");

  const [operationMessage, setOperationMessage] = useState("");
  const [operationError, setOperationError] = useState("");

  const [importState, setImportState] = useState(INITIAL_IMPORT_STATE);
  const [deletingPeriod, setDeletingPeriod] = useState(false);

  const importBusy = Object.values(importState).some(Boolean);
  const actionBusy = overviewLoading || importBusy || deletingPeriod;

  const resetLocalPreview = useCallback(() => {
    clearAllData();

    setRawTicketRows([]);
    setTicketRows([]);

    setRawSatisfactionRows([]);
    setSatisfactionRows([]);
  }, []);

  useEffect(() => {
    if (!uploadAllowed) {
      resetLocalPreview();
      return;
    }

    setRawTicketRows(getRawTicketsData());
    setTicketRows(getTicketsData());

    setRawSatisfactionRows(getRawSatisfactionData());
    setSatisfactionRows(getSatisfactionData());
  }, [uploadAllowed, resetLocalPreview]);

  const loadOverview = useCallback(
    async ({ period, signal } = {}) => {
      const requestedPeriod = period ?? selectedPeriodKey;

      setOverviewLoading(true);
      setOverviewError("");

      try {
        const [healthResponse, overviewResponse] = await Promise.all([
          fetchApiHealth({ signal }),
          fetchHomeOverview({
            period: requestedPeriod,
            signal,
          }),
        ]);

        setHealth(healthResponse);
        setOverview(overviewResponse);

        const returnedPeriod = overviewResponse?.selectedPeriod || null;
        const returnedPeriodKey = returnedPeriod?.period_key || "";

        setSelectedPeriodKey(returnedPeriodKey);

        setSelectedYear(
          returnedPeriod?.report_year ? String(returnedPeriod.report_year) : ""
        );

        saveSelectedReportingPeriod(returnedPeriodKey);
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        setOverviewError(
          error.message || "Unable to load the reporting overview."
        );
      } finally {
        setOverviewLoading(false);
      }
    },
    [selectedPeriodKey]
  );

  useEffect(() => {
    const controller = new AbortController();

    loadOverview({
      period: getSelectedReportingPeriod(),
      signal: controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, []);

  const periods = overview?.periods || [];

  const availableYears = useMemo(
    () => getAvailableYears(periods),
    [periods]
  );

  const selectedYearPeriods = useMemo(
    () => getPeriodsForYear(periods, selectedYear),
    [periods, selectedYear]
  );

  const selectedPeriod =
    overview?.selectedPeriod || findPeriodByKey(periods, selectedPeriodKey);

  const databaseSummary = overview?.periodSummary || {
    ticketCount: 0,
    productCount: 0,
    satisfactionCount: 0,
    importBatchCount: 0,
  };

  const localSummary = useMemo(
    () => ({
      tickets: ticketRows.length,
      satisfaction: satisfactionRows.length,
      rawRows: rawTicketRows.length + rawSatisfactionRows.length,
    }),
    [ticketRows, satisfactionRows, rawTicketRows, rawSatisfactionRows]
  );

  async function handleYearChange(event) {
    const year = event.target.value;

    setSelectedYear(year);
    setOperationMessage("");
    setOperationError("");

    const periodsForYear = getPeriodsForYear(periods, year);
    const firstPeriod = periodsForYear[0];

    if (!firstPeriod) {
      setSelectedPeriodKey("");
      saveSelectedReportingPeriod("");
      return;
    }

    setSelectedPeriodKey(firstPeriod.period_key);
    saveSelectedReportingPeriod(firstPeriod.period_key);

    await loadOverview({
      period: firstPeriod.period_key,
    });
  }

  async function handlePeriodChange(event) {
    const periodKey = event.target.value;

    setSelectedPeriodKey(periodKey);
    setOperationMessage("");
    setOperationError("");

    saveSelectedReportingPeriod(periodKey);

    await loadOverview({
      period: periodKey,
    });
  }

  async function saveDatasetAutomatically({
    datasetType,
    file,
    rawRows,
    mappedRows,
    columnMapping,
  }) {
    if (!uploadAllowed || !Array.isArray(rawRows) || !rawRows.length) {
      return;
    }

    setOperationMessage("");
    setOperationError("");

    setImportState((current) => ({
      ...current,
      [datasetType]: true,
    }));

    try {
      const result = await importMonthlyDataset({
        datasetType,
        file,
        rows: rawRows,
        columnMapping: columnMapping || {},
      });

      const insertedRows = result?.summary?.insertedRows || 0;
      const invalidRows = result?.summary?.invalidRows || 0;
      const duplicateRows = result?.summary?.duplicateRows || 0;
      const periodCount = result?.summary?.periodCount || 0;

      if (datasetType === "tickets") {
        setTicketRows(mappedRows);
      }

      if (datasetType === "satisfaction") {
        setSatisfactionRows(mappedRows);
      }

      setOperationMessage(
        `${insertedRows} ${datasetType} records saved successfully${
          periodCount ? ` across ${periodCount} month(s).` : "."
        }${invalidRows ? ` ${invalidRows} invalid rows skipped.` : ""}${
          duplicateRows ? ` ${duplicateRows} duplicate rows skipped.` : ""
        }`
      );

      await loadOverview({
        period: selectedPeriodKey,
      });
    } catch (error) {
      setOperationError(error.message || `Unable to import ${datasetType} data.`);
    } finally {
      setImportState((current) => ({
        ...current,
        [datasetType]: false,
      }));
    }
  }

  async function handleTicketUpload({ file, rows }) {
    if (!uploadAllowed) {
      return;
    }

    const rawRows = Array.isArray(rows) ? rows : [];

    saveRawTicketsData(rawRows);
    setRawTicketRows(rawRows);

    const columns = rawRows.length ? Object.keys(rawRows[0]) : [];
    const mapping = detectTicketMapping(columns);
    const mappedRows = applyTicketMapping(rawRows, mapping);

    saveTicketMapping(mapping);
    saveTicketsData(mappedRows);
    setTicketRows(mappedRows);

    await saveDatasetAutomatically({
      datasetType: "tickets",
      file,
      rawRows,
      mappedRows,
      columnMapping: mapping,
    });
  }

  async function handleSatisfactionUpload({ file, rows }) {
    if (!uploadAllowed) {
      return;
    }

    const rawRows = Array.isArray(rows) ? rows : [];

    saveRawSatisfactionData(rawRows);
    setRawSatisfactionRows(rawRows);

    const columns = rawRows.length ? Object.keys(rawRows[0]) : [];
    const mapping = detectSatisfactionMapping(columns);
    const mappedRows = applySatisfactionMapping(rawRows, mapping);

    saveSatisfactionMapping(mapping);
    saveSatisfactionData(mappedRows);
    setSatisfactionRows(mappedRows);

    await saveDatasetAutomatically({
      datasetType: "satisfaction",
      file,
      rawRows,
      mappedRows,
      columnMapping: mapping,
    });
  }

  function handleTicketsMapped(mappedTickets) {
    if (!uploadAllowed) {
      return;
    }

    saveTicketsData(mappedTickets);
    setTicketRows(mappedTickets);
  }

  async function handleDeleteSelectedPeriod() {
    if (!uploadAllowed || !selectedPeriodKey || deletingPeriod) {
      return;
    }

    const periodName = selectedPeriod?.period_name || selectedPeriodKey;

    const confirmed = window.confirm(
      `Delete all ${periodName} data?\n\nThis will permanently delete ticket records, satisfaction records, import history, Storage CSV files and local browser previews.\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingPeriod(true);
    setOperationMessage("");
    setOperationError("");

    try {
      const result = await deleteSelectedPeriodData(selectedPeriodKey);

      resetLocalPreview();

      setOperationMessage(
        `${result?.period?.period_name || periodName} data deleted successfully.`
      );

      await loadOverview({
        period: selectedPeriodKey,
      });
    } catch (error) {
      setOperationError(
        error.message || "Unable to delete the selected period data."
      );
    } finally {
      setDeletingPeriod(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[38px] border border-slate-200 bg-white shadow-soft">
        <div className="pointer-events-none absolute inset-0 angel-grid-bg opacity-50" />

        <div
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full opacity-90"
          style={{
            background: "var(--accent-color)",
          }}
        />

        <div className="relative px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="grid gap-8 xl:grid-cols-[1fr_410px] xl:items-center">
            <div className="min-w-0">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 shadow-sm">
                <ShieldCheck size={15} className="shrink-0 text-slate-700" />

                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Angelbird Analytics Workspace
                </span>
              </div>

              <h1 className="mt-5 max-w-[850px] text-[clamp(2.4rem,4.2vw,4.7rem)] font-extrabold leading-[0.96] tracking-[-0.06em] text-slate-950">
                Angelbird Reports &amp; Analytics.
              </h1>
              <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
  Select a reporting month to view ticket and satisfaction analytics. Reports
  are filtered automatically by the selected period.
</p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link to="/reports" className="angel-btn angel-btn-lime">
                  View Reports
                </Link>

                {uploadAllowed ? (
                  <>
                    <a
                      href="#data-import"
                      className="angel-btn angel-btn-dark gap-2"
                    >
                      <UploadCloud size={17} />
                      Upload Data
                    </a>

                    <button
                      type="button"
                      onClick={handleDeleteSelectedPeriod}
                      disabled={actionBusy || !selectedPeriodKey}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingPeriod ? (
                        <Loader2 size={17} className="animate-spin" />
                      ) : (
                        <Trash2 size={17} />
                      )}

                      {deletingPeriod ? "Deleting Month..." : "Delete Month Data"}
                    </button>
                  </>
                ) : null}
              </div>

              <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
                <CompactStat
                  label="Tickets"
                  value={databaseSummary.ticketCount}
                  description={selectedPeriod?.period_name || "Selected period"}
                />

                <CompactStat
                  label="Satisfaction"
                  value={databaseSummary.satisfactionCount}
                  description={selectedPeriod?.period_name || "Selected period"}
                />
              </div>
            </div>

            <div className="w-full min-w-0 self-center rounded-[26px] border border-slate-200 bg-white/95 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="angel-mini-label">Reporting Period</p>

                  <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-slate-950">
                    {selectedPeriod?.period_name || "No period selected"}
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Select a month to view only that month’s saved records.
                  </p>
                </div>

                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-slate-950"
                  style={{
                    background: "var(--accent-color)",
                  }}
                >
                  <CalendarDays size={20} />
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="reporting-year" className="angel-label">
                    Year
                  </label>

                  <select
                    id="reporting-year"
                    className="angel-input"
                    value={selectedYear}
                    onChange={handleYearChange}
                    disabled={actionBusy || !availableYears.length}
                  >
                    {!availableYears.length ? (
                      <option value="">No years</option>
                    ) : null}

                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="reporting-month" className="angel-label">
                    Month
                  </label>

                  <select
                    id="reporting-month"
                    className="angel-input"
                    value={selectedPeriodKey}
                    onChange={handlePeriodChange}
                    disabled={actionBusy || !selectedYearPeriods.length}
                  >
                    {!selectedYearPeriods.length ? (
                      <option value="">No months</option>
                    ) : null}

                    {selectedYearPeriods.map((period) => (
                      <option key={period.id} value={period.period_key}>
                        {period.period_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  loadOverview({
                    period: selectedPeriodKey,
                  })
                }
                disabled={actionBusy || !selectedPeriodKey}
                className="angel-btn angel-btn-dark mt-4 w-full gap-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {overviewLoading ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <RefreshCw size={17} />
                )}

                Refresh Period
              </button>
            </div>
          </div>

          {overviewError ? (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertCircle size={19} className="mt-0.5 shrink-0" />

              <div>
                <p className="font-black">Backend connection problem</p>
                <p className="mt-1 text-sm leading-6">{overviewError}</p>
              </div>
            </div>
          ) : null}

          <ImportStatusNotice
            importState={importState}
            message={operationMessage}
            error={operationError}
          />
        </div>
      </section>

      {uploadAllowed ? (
        <section className="grid gap-4 md:grid-cols-3">
          {featureCards.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="angel-card flex min-w-0 flex-col p-5 transition duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-slate-950"
                  style={{
                    background: "var(--accent-color)",
                  }}
                >
                  <Icon size={22} />
                </div>

                <h2 className="mt-5 text-xl font-extrabold tracking-[-0.035em] text-slate-950">
                  {feature.title}
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </section>
      ) : null}

      {uploadAllowed ? (
        <>
          <section id="data-import" className="scroll-mt-28">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="angel-mini-label">Data Import</p>

                <h2 className="mt-2 angel-page-title">
                  Upload full CSV data.
                </h2>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                  Upload the complete ticket CSV and complete satisfaction CSV.
                  The backend will automatically create month-wise records from
                  the date columns.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Selected View
                </p>

                <p className="mt-1 font-extrabold text-slate-900">
                  {selectedPeriod?.period_name || "Select year and month"}
                </p>
              </div>
            </div>

            <div className="grid items-stretch gap-6 xl:grid-cols-2">
              <CsvUploader
                eyebrow="Ticket Data"
                title="Upload Full Ticket CSV"
                description="The system reads ticket dates and places each row into its matching month."
                buttonLabel={
                  importState.tickets
                    ? "Saving Ticket CSV..."
                    : "Upload Ticket CSV"
                }
                disabled={actionBusy}
                onUpload={handleTicketUpload}
              />

              <CsvUploader
                eyebrow="Satisfaction Data"
                title="Upload Full Satisfaction CSV"
                description="The system reads updated dates and places each response into its matching month."
                buttonLabel={
                  importState.satisfaction
                    ? "Saving Satisfaction CSV..."
                    : "Upload Satisfaction CSV"
                }
                disabled={actionBusy}
                onUpload={handleSatisfactionUpload}
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <CompactStat
                label="Preview Tickets"
                value={localSummary.tickets}
                description="Current browser preview"
              />

              <CompactStat
                label="Preview Satisfaction"
                value={localSummary.satisfaction}
                description="Current browser preview"
              />

              <CompactStat
                label="Raw Rows"
                value={localSummary.rawRows}
                description="Current browser preview"
              />
            </div>
          </section>

          <TicketColumnMapper
            rawRows={rawTicketRows}
            onMapped={handleTicketsMapped}
          />
        </>
      ) : null}
    </div>
  );
}