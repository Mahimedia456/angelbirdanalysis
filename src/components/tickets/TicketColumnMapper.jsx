import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Wand2 } from "lucide-react";
import {
  applyTicketMapping,
  detectTicketMapping,
  TICKET_FIELDS,
} from "../../utils/ticketMapper";
import {
  saveTicketMapping,
  saveTicketsData,
} from "../../utils/storage";

export default function TicketColumnMapper({ rawRows = [], onMapped }) {
  const columns = useMemo(() => {
    if (!rawRows.length) return [];
    return Object.keys(rawRows[0]);
  }, [rawRows]);

  const detectedMapping = useMemo(
    () => detectTicketMapping(columns),
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
    setMapping(detectTicketMapping(columns));
  }

  function applyMapping() {
    const mappedTickets = applyTicketMapping(rawRows, mapping);

    saveTicketMapping(mapping);
    saveTicketsData(mappedTickets);

    onMapped?.(mappedTickets, mapping);
  }

  return (
    <div className="angel-card p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="angel-mini-label">Ticket Column Mapping</p>

          <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-900">
            Auto-detect and map ticket CSV columns.
          </h3>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            This should map your real columns: TSE, Ticket number, Region,
            Submitted, Date, Product 1, Product 2, Ticket Subject, Support
            Category, Product Category and Procedure.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={autoDetect} className="angel-btn angel-btn-dark gap-2">
            <Wand2 size={18} />
            Auto Detect
          </button>

          <button onClick={applyMapping} className="angel-btn angel-btn-lime gap-2">
            <CheckCircle2 size={18} />
            Apply Ticket Mapping
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {TICKET_FIELDS.map((field) => (
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
        Ticket rows ready for mapping: <strong>{rawRows.length}</strong>
      </div>
    </div>
  );
}