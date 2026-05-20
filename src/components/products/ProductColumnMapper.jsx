import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Wand2 } from "lucide-react";
import {
  applyProductMapping,
  detectProductMapping,
  PRODUCT_FIELDS,
} from "../../utils/productMapper";
import {
  saveProductMapping,
  saveProductsData,
} from "../../utils/storage";

export default function ProductColumnMapper({ rawRows = [], onMapped }) {
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
    const mappedProducts = applyProductMapping(rawRows, mapping);

    saveProductMapping(mapping);
    saveProductsData(mappedProducts);

    onMapped?.(mappedProducts, mapping);
  }

  return (
    <div className="angel-card p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="angel-mini-label">Angelbird Product Column Mapping</p>

          <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-900">
            Auto-detect and map product master fields.
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            This should map your real product columns: Product Name, Category,
            SKU, EAN and UPC.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={autoDetect} className="angel-btn angel-btn-dark gap-2">
            <Wand2 size={18} />
            Auto Detect
          </button>

          <button onClick={applyMapping} className="angel-btn angel-btn-lime gap-2">
            <CheckCircle2 size={18} />
            Apply Product Mapping
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {PRODUCT_FIELDS.map((field) => (
          <div key={field.key}>
            <label className="angel-label">
              {field.label} {field.required ? "*" : ""}
            </label>

            <select
              className="angel-input"
              value={mapping[field.key] || ""}
              onChange={(event) => updateMapping(field.key, event.target.value)}
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

      <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
        Product rows ready for mapping: <strong>{rawRows.length}</strong>
      </div>
    </div>
  );
}