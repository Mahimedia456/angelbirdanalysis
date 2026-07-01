import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Columns3,
  Wand2,
} from "lucide-react";

import {
  applyProductMapping,
  detectProductMapping,
  PRODUCT_FIELDS,
} from "../../utils/productMapper";

import {
  saveProductMapping,
  saveProductsData,
} from "../../utils/storage";

export default function ProductColumnMapper({
  rawRows = [],
  onMapped,
}) {
  const columns = useMemo(() => {
    if (!rawRows.length) return [];
    return Object.keys(rawRows[0]);
  }, [rawRows]);

  const detectedMapping = useMemo(
    () => detectProductMapping(columns),
    [columns]
  );

  const [mapping, setMapping] = useState(detectedMapping);

  useEffect(() => {
    setMapping(detectedMapping);
  }, [detectedMapping]);

  if (!rawRows.length) return null;

  function updateMapping(fieldKey, value) {
    setMapping((current) => ({
      ...current,
      [fieldKey]: value,
    }));
  }

  function autoDetect() {
    setMapping(detectProductMapping(columns));
  }

  function applyMapping() {
    const mappedProducts = applyProductMapping(
      rawRows,
      mapping
    );

    saveProductMapping(mapping);
    saveProductsData(mappedProducts);

    onMapped?.(mappedProducts, mapping);
  }

  return (
    <section className="angel-card p-6 lg:p-7">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-slate-950"
            style={{ background: "var(--accent-color)" }}
          >
            <Columns3 size={22} />
          </div>

          <div className="min-w-0">
            <p className="angel-mini-label">
              Product Column Mapping
            </p>

            <h3 className="mt-2 break-words text-2xl font-black leading-tight tracking-[-0.04em] text-slate-950">
              Review product field detection before applying the mapping.
            </h3>

            <p className="mt-3 max-w-3xl break-words text-sm leading-6 text-slate-500">
              Confirm Product Name, Category, SKU, EAN and UPC. Automatic
              detection remains editable for source-specific corrections.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-wrap gap-3 xl:w-auto xl:justify-end">
          <button
            type="button"
            onClick={autoDetect}
            className="angel-btn angel-btn-dark flex-1 gap-2 sm:flex-none"
          >
            <Wand2 size={18} />
            Auto Detect
          </button>

          <button
            type="button"
            onClick={applyMapping}
            className="angel-btn angel-btn-lime flex-1 gap-2 sm:flex-none"
          >
            <CheckCircle2 size={18} />
            Apply Mapping
          </button>
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {PRODUCT_FIELDS.map((field) => (
          <div key={field.key} className="min-w-0">
            <label className="angel-label break-words">
              {field.label}
              {field.required ? " *" : ""}
            </label>

            <select
              className="angel-input min-w-0"
              value={mapping[field.key] || ""}
              onChange={(event) =>
                updateMapping(field.key, event.target.value)
              }
            >
              <option value="">Do not map</option>

              {columns.map((column) => (
                <option key={column} value={column}>
                  {column.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-slate-600">
          Product rows available for mapping
        </p>

        <span
          className="w-fit rounded-full px-3 py-1.5 text-xs font-black text-slate-950"
          style={{ background: "var(--accent-color)" }}
        >
          {rawRows.length} Rows
        </span>
      </div>
    </section>
  );
}