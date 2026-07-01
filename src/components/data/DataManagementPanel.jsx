import {
  AlertCircle,
  Database,
  Loader2,
  Trash2,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  deleteSelectedPeriodData,
} from "../../services/dataManagementApi";

export default function DataManagementPanel({
  periodKey,
  periodName,
  counts,
  onDeleteComplete,
}) {
  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  async function handleDeleteAll() {
    if (!periodKey) {
      return;
    }

    const confirmation =
      window.prompt(
        `This will permanently delete database records, import batches, Storage CSV files and browser previews for ${periodName}.\n\nType DELETE ${periodKey} to continue.`
      );

    if (
      confirmation !==
      `DELETE ${periodKey}`
    ) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const result =
        await deleteSelectedPeriodData(
          periodKey
        );

      await onDeleteComplete?.(
        result
      );
    } catch (deleteError) {
      setError(
        deleteError.message ||
          "Unable to delete the selected period data."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-red-200 bg-red-50 p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-red-600 shadow-sm">
            <Database size={21} />
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-500">
              Data Management
            </p>

            <h2 className="mt-2 text-xl font-black text-slate-950">
              Delete all {periodName || "selected period"} data
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Tickets:{" "}
              {counts?.ticketCount || 0}
              {" · "}
              Products:{" "}
              {counts?.productCount || 0}
              {" · "}
              Satisfaction:{" "}
              {counts?.satisfactionCount ||
                0}
              {" · "}
              Imports:{" "}
              {counts?.importBatchCount ||
                0}
            </p>

            <p className="mt-2 text-xs font-bold text-red-600">
              This deletes database rows,
              import history, Storage CSV
              files and local browser
              previews.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDeleteAll}
          disabled={
            deleting ||
            !periodKey
          }
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? (
            <Loader2
              size={18}
              className="animate-spin"
            />
          ) : (
            <Trash2 size={18} />
          )}

          {deleting
            ? "Deleting Everything..."
            : "Delete Local + Database Data"}
        </button>
      </div>

      {error ? (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-white p-4 text-red-700">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <p className="text-sm font-bold">
            {error}
          </p>
        </div>
      ) : null}
    </section>
  );
}