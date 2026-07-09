import {
  ArrowDownToLine,
  Search,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

function cleanText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeKey(value) {
  return cleanText(value).toLowerCase();
}

function uniqueOptions(values = []) {
  const map = new Map();

  values.forEach((value) => {
    const clean = cleanText(value);

    if (!clean) return;

    const key = normalizeKey(clean);

    if (!map.has(key)) {
      map.set(key, clean);
    }
  });

  return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
}

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function convertToCsv(rows) {
  if (!rows.length) return "";

  const headers = [
    "TSE",
    "Ticket Number",
    "Region",
    "Date",
    "Product 1",
    "Product 2",
    "Ticket Subject",
    "RMA Type",
  ];

  const body = rows.map((row) =>
    [
      row.tse,
      row.ticketNumber,
      row.region,
      row.date,
      row.product1,
      row.product2,
      row.ticketSubject,
      row.rmaType,
    ]
      .map(csvEscape)
      .join(",")
  );

  return [headers.join(","), ...body].join("\n");
}

export default function RmaReportTable({
  title = "RMA Report Data",
  rows = [],
}) {
  const [tableFilters, setTableFilters] = useState({
    search: "",
    region: "",
    tse: "",
    rmaType: "",
  });

  const regions = uniqueOptions(rows.map((row) => row.region));
  const tseOptions = uniqueOptions(rows.map((row) => row.tse));
  const rmaTypes = uniqueOptions(rows.map((row) => row.rmaType));

  const visibleRows = useMemo(() => {
    return rows.filter((row) => {
      const search = normalizeKey(tableFilters.search);

      const searchable = [
        row.tse,
        row.ticketNumber,
        row.region,
        row.date,
        row.product1,
        row.product2,
        row.ticketSubject,
        row.rmaType,
      ]
        .map(normalizeKey)
        .join(" ");

      if (search && !searchable.includes(search)) return false;

      if (
        tableFilters.region &&
        normalizeKey(row.region) !== normalizeKey(tableFilters.region)
      ) {
        return false;
      }

      if (
        tableFilters.tse &&
        normalizeKey(row.tse) !== normalizeKey(tableFilters.tse)
      ) {
        return false;
      }

      if (
        tableFilters.rmaType &&
        normalizeKey(row.rmaType) !== normalizeKey(tableFilters.rmaType)
      ) {
        return false;
      }

      return true;
    });
  }, [rows, tableFilters]);

  function updateFilter(key, value) {
    setTableFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetTableFilters() {
    setTableFilters({
      search: "",
      region: "",
      tse: "",
      rmaType: "",
    });
  }

  function exportCsv() {
    const csv = convertToCsv(visibleRows);

    if (!csv) {
      alert("No RMA records to export.");
      return;
    }

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "angelbird-rma-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <section className="angel-card overflow-hidden pdf-export-section">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="angel-mini-label">RMA Data</p>

          <h3 className="mt-2 break-words text-xl font-black tracking-[-0.03em] text-slate-950">
            {title}
          </h3>

          <p className="mt-2 break-words text-sm leading-6 text-slate-500">
            Showing {visibleRows.length.toLocaleString()} from{" "}
            {rows.length.toLocaleString()} RMA records.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          className="angel-btn angel-btn-dark w-full shrink-0 gap-2 sm:w-auto"
        >
          <ArrowDownToLine size={18} />
          Export RMA CSV
        </button>
      </div>

      <div className="no-print no-export border-b border-slate-200 bg-slate-50/70 p-5">
        <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr_0.9fr_0.9fr_auto] xl:items-end">
          <div>
            <label className="angel-label">Search</label>

            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
              />

              <input
                className="angel-input h-12 !pl-12 bg-white"
                placeholder="Search ticket, product, TSE, subject..."
                value={tableFilters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="angel-label">Region</label>

            <select
              className="angel-input h-12 bg-white"
              value={tableFilters.region}
              onChange={(event) => updateFilter("region", event.target.value)}
            >
              <option value="">All Regions</option>

              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="angel-label">TSE</label>

            <select
              className="angel-input h-12 bg-white"
              value={tableFilters.tse}
              onChange={(event) => updateFilter("tse", event.target.value)}
            >
              <option value="">All TSE</option>

              {tseOptions.map((tse) => (
                <option key={tse} value={tse}>
                  {tse}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="angel-label">RMA Type</label>

            <select
              className="angel-input h-12 bg-white"
              value={tableFilters.rmaType}
              onChange={(event) => updateFilter("rmaType", event.target.value)}
            >
              <option value="">All RMA Types</option>

              {rmaTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={resetTableFilters}
            className="angel-btn angel-btn-dark h-12"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="w-full">
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="w-[12%] px-4 py-4 font-black">TSE</th>
              <th className="w-[9%] px-4 py-4 font-black">Ticket #</th>
              <th className="w-[8%] px-4 py-4 font-black">Region</th>
              <th className="w-[10%] px-4 py-4 font-black">Date</th>
              <th className="w-[16%] px-4 py-4 font-black">Product 1</th>
              <th className="w-[13%] px-4 py-4 font-black">Product 2</th>
              <th className="w-[22%] px-4 py-4 font-black">Subject</th>
              <th className="w-[10%] px-4 py-4 font-black">RMA Type</th>
            </tr>
          </thead>

          <tbody>
            {visibleRows.length ? (
              visibleRows.slice(0, 800).map((row, index) => (
                <tr
                  key={`${row.ticketNumber || row.date}-${index}`}
                  className="border-t border-slate-100 align-top transition hover:bg-slate-50/70"
                >
                  <td className="break-words px-4 py-4 text-slate-600">
                    {row.tse || "-"}
                  </td>

                  <td className="break-words px-4 py-4 font-bold text-slate-800">
                    {row.ticketNumber || "-"}
                  </td>

                  <td className="break-words px-4 py-4 text-slate-600">
                    {row.region || "-"}
                  </td>

                  <td className="break-words px-4 py-4 text-slate-600">
                    {row.date || "-"}
                  </td>

                  <td className="break-words px-4 py-4 font-black text-slate-800">
                    {row.product1 || "-"}
                  </td>

                  <td className="break-words px-4 py-4 text-slate-600">
                    {row.product2 || "-"}
                  </td>

                  <td className="break-words px-4 py-4 leading-6 text-slate-600">
                    {row.ticketSubject || "-"}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className="inline-flex max-w-full whitespace-normal break-words rounded-full px-3 py-1.5 text-xs font-black text-slate-950"
                      style={{ background: "var(--accent-color)" }}
                    >
                      {row.rmaType || "Unknown"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-12 text-center text-sm font-bold text-slate-400"
                >
                  No RMA records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}