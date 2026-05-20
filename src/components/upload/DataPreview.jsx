function isEmptyValue(value) {
  return String(value ?? "").trim() === "";
}

function isBadColumnName(column = "") {
  const clean = String(column || "").trim();

  if (!clean) return true;
  if (/^unnamed/i.test(clean)) return true;
  if (/^\d+$/.test(clean)) return true;

  return false;
}

function getCleanColumns(rows = []) {
  if (!rows.length) return [];

  const allColumns = Object.keys(rows[0] || {});

  return allColumns.filter((column) => {
    if (isBadColumnName(column)) return false;

    const hasValue = rows.some((row) => !isEmptyValue(row[column]));

    return hasValue;
  });
}

function formatColumnLabel(column = "") {
  return String(column)
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function DataPreview({ title, rows }) {
  const columns = getCleanColumns(rows || []);

  if (!rows?.length || !columns.length) {
    return (
      <div className="angel-card p-6">
        <h3 className="text-lg font-black text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">No data uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="angel-card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900">{title}</h3>

          <p className="mt-1 text-sm text-slate-500">
            Showing first 10 rows from {rows.length} total rows.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className="rounded-full px-3 py-1 text-xs font-black text-slate-900"
            style={{ background: "var(--accent-color)" }}
          >
            {columns.length} Columns
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
            {rows.length} Rows
          </span>
        </div>
      </div>

      <div className="max-h-[520px] overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-[0.15em] text-slate-500">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="whitespace-nowrap border-b border-slate-200 px-4 py-3 font-black"
                >
                  {formatColumnLabel(column)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.slice(0, 10).map((row, index) => (
              <tr key={index} className="border-t border-slate-100">
                {columns.map((column) => {
                  const value = String(row[column] ?? "").trim();

                  return (
                    <td
                      key={column}
                      className="max-w-[340px] whitespace-nowrap px-4 py-3 text-slate-600"
                      title={value}
                    >
                      <span className="block max-w-[340px] truncate">
                        {value || "-"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}