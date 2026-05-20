import { UploadCloud } from "lucide-react";
import { parseCsvFile, normalizeRows } from "../../utils/csvParser";

export default function CsvUploader({
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
      const rows = normalize ? normalizeRows(parsed.rows) : parsed.rows;

      onUpload({
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
    <div className="angel-card p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-900">{title}</h3>
          <p className="mt-2 max-w-xl text-sm text-slate-500">{description}</p>
        </div>

        <label className="angel-btn angel-btn-dark cursor-pointer gap-2">
          <UploadCloud size={18} />
          {buttonLabel}
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>
    </div>
  );
}