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

  const allColumns = Array.from(
    new Set(
      rows.flatMap((row) => Object.keys(row || {}))
    )
  );

  return allColumns.filter((column) => {
    if (isBadColumnName(column)) return false;

    return rows.some(
      (row) => !isEmptyValue(row?.[column])
    );
  });
}

function formatColumnLabel(column = "") {
  return String(column)
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function DataPreview({
  title,
  rows = [],
}) {
  const columns = getCleanColumns(rows);

  if (!rows.length || !columns.length) {
    return (
      <section className="angel-card p-6">
        <p className="angel-mini-label">Source Preview</p>

        <h3 className="mt-2 break-words text-xl font-black text-slate-950">
          {title}
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          No source data has been uploaded yet.
        </p>
      </section>
    );
  }

  return (
    <section className="angel-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="angel-mini-label">Source Preview</p>

          <h3 className="mt-2 break-words text-xl font-black tracking-[-0.03em] text-slate-950">
            {title}
          </h3>

          <p className="mt-2 break-words text-sm leading-6 text-slate-500">
            Showing the first 10 records from {rows.length} imported rows.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <span
            className="rounded-full px-3 py-2 text-xs font-black text-slate-950"
            style={{ background: "var(--accent-color)" }}
          >
            {columns.length} Columns
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-500">
            {rows.length} Rows
          </span>
        </div>
      </div>

      <div className="max-h-[520px] overflow-auto">
        <table className="w-max min-w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="min-w-[150px] border-b border-slate-200 px-4 py-3 font-black"
                >
                  <span className="block whitespace-normal break-words">
                    {formatColumnLabel(column)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.slice(0, 10).map((row, index) => (
              <tr
                key={index}
                className="border-t border-slate-100 align-top transition hover:bg-slate-50/70"
              >
                {columns.map((column) => {
                  const value = String(row?.[column] ?? "").trim();

                  return (
                    <td
                      key={column}
                      className="max-w-[360px] px-4 py-3 text-slate-600"
                      title={value}
                    >
                      <span className="block whitespace-normal break-words leading-5">
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
    </section>
  );
}