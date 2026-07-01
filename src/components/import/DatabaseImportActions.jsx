import {
  AlertCircle,
  CheckCircle2,
  Database,
  Loader2,
  Save,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  importMonthlyDataset,
} from "../../services/importsApi";

function DatasetAction({
  label,
  datasetType,
  periodKey,
  file,
  rows,
  onImported,
}) {
  const [
    importing,
    setImporting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    result,
    setResult,
  ] = useState(null);

  const disabled =
    importing ||
    !periodKey ||
    !rows?.length;

  async function handleImport() {
    setImporting(true);
    setError("");
    setResult(null);

    try {
      const imported =
        await importMonthlyDataset({
          datasetType,
          periodKey,
          file,
          rows,
        });

      setResult(imported);

      await onImported?.(
        datasetType,
        imported
      );
    } catch (importError) {
      setError(
        importError.message ||
          "Database import failed."
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <article className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-slate-950"
          style={{
            background:
              "var(--accent-color)",
          }}
        >
          <Database size={19} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-950">
            {label}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {rows?.length || 0} mapped rows ready.
          </p>
        </div>
      </div>

      {error ? (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
          <AlertCircle
            size={16}
            className="mt-0.5 shrink-0"
          />

          <p className="text-xs font-bold leading-5">
            {error}
          </p>
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-lime-200 bg-lime-50 p-3 text-lime-800">
          <CheckCircle2
            size={16}
            className="mt-0.5 shrink-0"
          />

          <p className="text-xs font-bold leading-5">
            {
              result.summary
                .insertedRows
            }{" "}
            rows saved successfully.
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleImport}
        disabled={disabled}
        className="angel-btn angel-btn-dark mt-4 w-full gap-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {importing ? (
          <Loader2
            size={17}
            className="animate-spin"
          />
        ) : (
          <Save size={17} />
        )}

        {importing
          ? "Saving to Database..."
          : `Save ${label}`}
      </button>
    </article>
  );
}

export default function DatabaseImportActions({
  periodKey,
  periodName,
  ticketFile,
  ticketRows,
  productFile,
  productRows,
  satisfactionFile,
  satisfactionRows,
  onImported,
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
      <div>
        <p className="angel-mini-label">
          Database Import
        </p>

        <h2 className="mt-2 angel-page-title">
          Save mapped records to{" "}
          {periodName ||
            "the selected period"}.
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Replace mode will replace the
          selected month’s existing dataset
          with the mapped preview below.
        </p>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <DatasetAction
          label="Ticket Data"
          datasetType="tickets"
          periodKey={periodKey}
          file={ticketFile}
          rows={ticketRows}
          onImported={onImported}
        />

        <DatasetAction
          label="Product Data"
          datasetType="products"
          periodKey={periodKey}
          file={productFile}
          rows={productRows}
          onImported={onImported}
        />

        <DatasetAction
          label="Satisfaction Data"
          datasetType="satisfaction"
          periodKey={periodKey}
          file={satisfactionFile}
          rows={satisfactionRows}
          onImported={onImported}
        />
      </div>
    </section>
  );
}