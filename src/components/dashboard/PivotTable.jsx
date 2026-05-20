import { useMemo, useState } from "react";
import { buildPivot } from "../../utils/pivot";

export default function PivotTable({ rows = [], title = "Pivot Table" }) {
  const columns = rows.length ? Object.keys(rows[0]) : [];

  const [rowField, setRowField] = useState(columns[0] || "");
  const [valueField, setValueField] = useState("");
  const [aggregation, setAggregation] = useState("count");

  const pivot = useMemo(
    () => buildPivot(rows, rowField, valueField, aggregation),
    [rows, rowField, valueField, aggregation]
  );

  return (
    <div className="angel-card overflow-hidden">
      <div className="border-b border-slate-200 p-5">
        <h3 className="text-lg font-black text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">
          Select row, value and aggregation to create a custom pivot.
        </p>
      </div>

      <div className="grid gap-4 border-b border-slate-200 p-5 md:grid-cols-3">
        <div>
          <label className="angel-label">Row Field</label>
          <select
            className="angel-input"
            value={rowField}
            onChange={(event) => setRowField(event.target.value)}
          >
            {columns.map((column) => (
              <option key={column} value={column}>
                {column.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="angel-label">Value Field</label>
          <select
            className="angel-input"
            value={valueField}
            onChange={(event) => setValueField(event.target.value)}
          >
            <option value="">None</option>
            {columns.map((column) => (
              <option key={column} value={column}>
                {column.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="angel-label">Aggregation</label>
          <select
            className="angel-input"
            value={aggregation}
            onChange={(event) => setAggregation(event.target.value)}
          >
            <option value="count">Count</option>
            <option value="sum">Sum</option>
            <option value="avg">Average</option>
            <option value="min">Min</option>
            <option value="max">Max</option>
          </select>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.15em] text-slate-500">
            <tr>
              <th className="px-5 py-3 font-black">Name</th>
              <th className="px-5 py-3 font-black">Value</th>
              <th className="px-5 py-3 font-black">Count</th>
            </tr>
          </thead>

          <tbody>
            {pivot.length ? (
              pivot.slice(0, 50).map((item, index) => (
                <tr key={`${item.name}-${index}`} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-bold text-slate-700">{item.name}</td>
                  <td className="px-5 py-3 text-slate-600">{item.value}</td>
                  <td className="px-5 py-3 text-slate-600">{item.count}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="px-5 py-6 text-center text-slate-500">
                  Upload data to use pivot table.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}