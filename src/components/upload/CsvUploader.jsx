import { FileSpreadsheet, UploadCloud } from "lucide-react";
import { parseCsvFile, normalizeRows } from "../../utils/csvParser";

export default function CsvUploader({
  eyebrow = "CSV Import",
  title,
  description,
  onUpload,
  buttonLabel = "Upload CSV",
  normalize = true,
}) {
  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const parsed = await parseCsvFile(file);
      const rows = normalize
        ? normalizeRows(parsed.rows)
        : parsed.rows;

      onUpload?.({
        file,
        rows,
        rawRows: parsed.rows,
        fields: parsed.fields,
        errors: parsed.errors,
      });
    } catch (error) {
      alert(error.message || "CSV upload failed.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <article className="angel-card flex h-full min-w-0 flex-col p-6">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-slate-950"
            style={{ background: "var(--accent-color)" }}
          >
            <FileSpreadsheet size={22} />
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            CSV
          </span>
        </div>

        <p className="mt-6 break-words text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
          {eyebrow}
        </p>

        <h3 className="mt-3 break-words text-2xl font-black leading-tight tracking-[-0.04em] text-slate-950">
          {title}
        </h3>

        <p className="mt-3 break-words text-sm leading-6 text-slate-500">
          {description}
        </p>

        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <p className="text-xs font-bold leading-5 text-slate-500">
            Accepted format: CSV. Empty helper columns are removed
            automatically during import.
          </p>
        </div>
      </div>

      <label className="angel-btn angel-btn-dark mt-6 w-full cursor-pointer gap-2">
        <UploadCloud size={18} />
        <span className="break-words text-center">{buttonLabel}</span>

        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>
    </article>
  );
}