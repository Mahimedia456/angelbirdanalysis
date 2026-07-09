import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  FileSpreadsheet,
  Loader2,
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

import {
  deleteSelectedPeriodData,
} from "../services/dataManagementApi";

import {
  fetchUploadedRmaReports,
} from "../services/rmaReportsApi";

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

const featureCards = [
  {
    title: "Ticket Analytics",
    description:
      "Upload ticket CSV data and analyze all saved records using report filters.",
    icon: FileSpreadsheet,
  },
  {
    title: "Customer Satisfaction",
    description:
      "Upload satisfaction CSV data and filter responses by month, rating, status, or date range.",
    icon: SmilePlus,
  },
  {
    title: "RMA Analytics",
    description:
      "Analyze RMA, Data Recovery RMA, Broken Plastic, region-wise and date-wise records from uploaded tickets.",
    icon: ClipboardList,
  },
  {
    title: "Reports",
    description:
      "Open Reports to filter tickets, satisfaction, and RMA records directly inside each report.",
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
            CSV is being saved. Reports will use all uploaded records.
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
  const [rmaOverview, setRmaOverview] = useState(null);

  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState("");

  const [operationMessage, setOperationMessage] = useState("");
  const [operationError, setOperationError] = useState("");

  const [importState, setImportState] = useState(INITIAL_IMPORT_STATE);
  const [deletingData, setDeletingData] = useState(false);

  const importBusy = Object.values(importState).some(Boolean);
  const actionBusy = overviewLoading || importBusy || deletingData;

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

  const loadOverview = useCallback(async ({ signal } = {}) => {
    setOverviewLoading(true);
    setOverviewError("");

    try {
      const [healthResponse, overviewResponse, rmaResponse] =
        await Promise.all([
          fetchApiHealth({ signal }),
          fetchHomeOverview({ signal }),
          fetchUploadedRmaReports({ signal }).catch(() => null),
        ]);

      setHealth(healthResponse);
      setOverview(overviewResponse);
      setRmaOverview(rmaResponse);
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }

      setOverviewError(
        error.message || "Unable to load the dashboard overview."
      );
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    loadOverview({
      signal: controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [loadOverview]);

  const databaseSummary = overview?.periodSummary || {
    ticketCount: 0,
    productCount: 0,
    satisfactionCount: 0,
    importBatchCount: 0,
  };

  const rmaSummary = rmaOverview?.summary || {
    totalRows: 0,
    duplicateRows: 0,
  };

  const localSummary = useMemo(
    () => ({
      tickets: ticketRows.length,
      satisfaction: satisfactionRows.length,
      rawRows: rawTicketRows.length + rawSatisfactionRows.length,
    }),
    [ticketRows, satisfactionRows, rawTicketRows, rawSatisfactionRows]
  );

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

      await loadOverview();
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

  async function handleDeleteAllData() {
    if (!uploadAllowed || deletingData) {
      return;
    }

    const confirmed = window.confirm(
      "Delete all uploaded ticket and satisfaction data?\n\nThis will permanently delete all saved records, import history, Storage CSV files, and local browser previews.\n\nThis action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setDeletingData(true);
    setOperationMessage("");
    setOperationError("");

    try {
      await deleteSelectedPeriodData("all");

      resetLocalPreview();

      setOperationMessage("All uploaded data deleted successfully.");

      await loadOverview();
    } catch (error) {
      setOperationError(error.message || "Unable to delete uploaded data.");
    } finally {
      setDeletingData(false);
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
          <div className="grid gap-8 xl:grid-cols-[1fr_390px] xl:items-center">
            <div className="min-w-0">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 shadow-sm">
                <ShieldCheck size={15} className="shrink-0 text-slate-700" />

                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Data From Zendesk
                </span>
              </div>

              <h1 className="mt-5 max-w-[850px] text-[clamp(2.4rem,4.2vw,4.7rem)] font-extrabold leading-[0.96] tracking-[-0.06em] text-slate-950">
                Angelbird Reports &amp; Analytics.
              </h1>

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
                      onClick={handleDeleteAllData}
                      disabled={actionBusy}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingData ? (
                        <Loader2 size={17} className="animate-spin" />
                      ) : (
                        <Trash2 size={17} />
                      )}

                      {deletingData ? "Deleting Data..." : "Delete All Data"}
                    </button>
                  </>
                ) : null}
              </div>

              <div className="mt-8 grid max-w-4xl gap-3 sm:grid-cols-3">
                <CompactStat
                  label="Tickets"
                  value={databaseSummary.ticketCount}
                  description="All uploaded ticket records"
                />

                <CompactStat
                  label="Satisfaction"
                  value={databaseSummary.satisfactionCount}
                  description="All uploaded satisfaction records"
                />

                <CompactStat
                  label="RMA"
                  value={rmaSummary.totalRows}
                  description="Unique RMA records from tickets"
                />
              </div>
            </div>

            <div className="w-full min-w-0 self-center rounded-[26px] border border-slate-200 bg-white/95 p-6 text-center shadow-sm">
              <p className="angel-mini-label">
                Presented By
              </p>

              <img
                src="/mahi.logo.png"
                alt="Mahimedia Solutions"
                className="mx-auto mt-5 h-20 w-auto object-contain"
              />

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Analytics dashboard prepared for Angelbird reporting and
                performance review.
              </p>
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
        <section className="grid gap-4 md:grid-cols-4">
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
                  Upload CSV data.
                </h2>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                  Upload tickets and satisfaction files. The backend will save
                  records and reports will show the full uploaded dataset.
                  RMA analytics are extracted from uploaded ticket records.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Report View
                </p>

                <p className="mt-1 font-extrabold text-slate-900">
                  Filter inside Reports
                </p>
              </div>
            </div>

            <div className="grid items-stretch gap-6 xl:grid-cols-2">
              <CsvUploader
                eyebrow="Ticket Data"
                title="Upload Ticket CSV"
                description="Upload ticket records. RMA records are extracted from ticket RMA Type, Procedure, Support Category, Subject, or related fields."
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
                title="Upload Satisfaction CSV"
                description="Upload satisfaction records. Month and date range filters are available in Reports."
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