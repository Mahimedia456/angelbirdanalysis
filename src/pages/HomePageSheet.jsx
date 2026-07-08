import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  ShieldCheck,
  SmilePlus,
} from "lucide-react";

import { Link } from "react-router-dom";

import {
  fetchSheetApiHealth,
  fetchSheetHomeOverview,
} from "../services/sheetReportsApi";

const featureCards = [
  {
    title: "Sheet Ticket Analytics",
    description:
      "Read ticket records directly from the  ticket tab.",
    icon: FileSpreadsheet,
  },
  {
    title: "Sheet Satisfaction",
    description:
      "Read satisfaction responses directly from the  satisfaction tab.",
    icon: SmilePlus,
  },
  {
    title: "Live Sheet Reports",
    description:
      "Open reports and refresh anytime to load the latest  data.",
    icon: BarChart3,
  },
];

function CompactStat({ label, value, description }) {
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

function StatusNotice({ loading, message, error }) {
  if (loading) {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-800">
        <Loader2 size={19} className="mt-0.5 shrink-0 animate-spin" />

        <div>
          <p className="font-black">Loading data</p>
          <p className="mt-1 text-sm leading-6">
            Latest ticket and satisfaction records are being read from Google
            Sheet.
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
          <p className="font-black"> Connection failed</p>
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
          <p className="font-black">Sheet data loaded</p>
          <p className="mt-1 text-sm leading-6">{message}</p>
        </div>
      </div>
    );
  }

  return null;
}


export default function HomePageSheet() {
    const [unsynced, setUnsynced] = useState(false);
  const [overview, setOverview] = useState(null);
  const [health, setHealth] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadOverview = useCallback(async ({ signal } = {}) => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const [healthResponse, overviewResponse] = await Promise.all([
        fetchSheetApiHealth({ signal }),
        fetchSheetHomeOverview({ signal }),
      ]);

      setHealth(healthResponse);
      setOverview(overviewResponse);

      const ticketCount =
        overviewResponse?.periodSummary?.ticketCount ||
        overviewResponse?.summary?.ticketCount ||
        0;

      const satisfactionCount =
        overviewResponse?.periodSummary?.satisfactionCount ||
        overviewResponse?.summary?.satisfactionCount ||
        0;

      setMessage(
        `${Number(ticketCount).toLocaleString()} tickets and ${Number(
          satisfactionCount
        ).toLocaleString()} satisfaction records loaded from .`
      );
    } catch (loadError) {
      if (loadError.name === "AbortError") {
        return;
      }

      setError(loadError.message || "Unable to load  overview.");
    } finally {
      setLoading(false);
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

  const sheetSummary = overview?.periodSummary || {
    ticketCount: 0,
    satisfactionCount: 0,
    importBatchCount: 0,
    productCount: 0,
  };

  const sheetMeta = useMemo(
    () => ({
      sheetId: overview?.sheetId || "",
      ticketTab: overview?.tabs?.tickets || "Ticket",
      satisfactionTab: overview?.tabs?.satisfaction || "Satisfaction",
      updatedAt:
        overview?.summary?.updatedAt ||
        health?.timestamp ||
        "",
    }),
    [overview, health]
  );

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
                Angelbird Reports.
              </h1>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link to="/sheet-reports" className="angel-btn angel-btn-lime">
                  View Reports
                </Link>

                <button
                  type="button"
                  onClick={() => loadOverview()}
                  disabled={loading}
                  className="angel-btn angel-btn-dark gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <RefreshCw size={17} />
                  )}
                  Refresh
                </button>
              </div>

              <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
                <CompactStat
                  label="Tickets"
                  value={sheetSummary.ticketCount}
                  description={` tab: ${sheetMeta.ticketTab}`}
                />

                <CompactStat
                  label="Satisfaction"
                  value={sheetSummary.satisfactionCount}
                  description={` tab: ${sheetMeta.satisfactionTab}`}
                />
              </div>
            </div>

            <div className="w-full min-w-0 self-center rounded-[26px] border border-slate-200 bg-white/95 p-6 text-center shadow-sm">
              <p className="angel-mini-label">Presented By</p>

              <img
                src="/mahi.logo.png"
                alt="Mahimedia Solutions"
                className="mx-auto mt-5 h-20 w-auto object-contain"
              />

              {/* <p className="mt-2 text-sm leading-6 text-slate-500">
                Live  analytics dashboard prepared for Angelbird
                reporting and performance review.
              </p> */}

              {sheetMeta.updatedAt ? (
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                  Last loaded: {new Date(sheetMeta.updatedAt).toLocaleString()}
                </p>
              ) : null}
            </div>
          </div>

          <StatusNotice loading={loading} message={message} error={error} />
        </div>
      </section>

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
    </div>
  );
}