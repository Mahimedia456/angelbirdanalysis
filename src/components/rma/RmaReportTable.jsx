import {
  ArrowDownToLine,
  Search,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  normalizeRegionKey,
  normalizeRegionLabel,
} from "../../utils/region";
import ZendeskTicketLink from "../common/ZendeskTicketLink";

function cleanText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeKey(value) {
  return cleanText(value).toLowerCase();
}

function getIssue(row = {}) {
  return cleanText(
    row.issues ??
      row.issue ??
      row.rmaIssues ??
      row.rma_issues ??
      row.issueType ??
      row.issue_type
  );
}

function normalizeWarrantyStatus(value) {
  const raw = cleanText(value);
  const key = normalizeKey(raw)
    .replace(/[\/_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!key) return "";

  if ([
    "in warranty",
    "within warranty",
    "under warranty",
    "warranty",
    "yes",
  ].includes(key)) {
    return "In Warranty";
  }

  if ([
    "out of warranty",
    "out warranty",
    "oow",
    "expired warranty",
    "warranty expired",
    "no warranty",
    "no",
  ].includes(key)) {
    return "Out of Warranty";
  }

  return raw;
}

function getWarrantyStatus(row = {}) {
  return normalizeWarrantyStatus(
    row.warrantyStatus ??
      row.warranty_status ??
      row.warranty ??
      row["Warranty Status"]
  );
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
    "Ticket Number",
    "Date",
    "Region",
    "Product 1",
    "Ticket Subject",
    "Issues",
    "Warranty Status",
    "RMA Type",
  ];

  const body = rows.map((row) =>
    [
      row.ticketNumber,
      row.date,
      normalizeRegionLabel(row.region),
      row.product1,
      row.ticketSubject,
      getIssue(row),
      getWarrantyStatus(row),
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
    issue: "",
    warrantyStatus: "",
    rmaType: "",
  });

  const regions = uniqueOptions(
    rows.map((row) => normalizeRegionLabel(row.region)).filter(Boolean)
  );
  const rmaTypes = uniqueOptions(rows.map((row) => row.rmaType));
  const issues = uniqueOptions(rows.map(getIssue));
  const warrantyStatuses = uniqueOptions(rows.map(getWarrantyStatus));

  const visibleRows = useMemo(() => {
    return rows.filter((row) => {
      const search = normalizeKey(tableFilters.search);

      const searchable = [
        row.ticketNumber,
        normalizeRegionLabel(row.region),
        row.date,
        row.product1,
        row.ticketSubject,
        getIssue(row),
        getWarrantyStatus(row),
        row.rmaType,
      ]
        .map(normalizeKey)
        .join(" ");

      if (search && !searchable.includes(search)) return false;

      if (
        tableFilters.region &&
        normalizeRegionKey(row.region) !== normalizeRegionKey(tableFilters.region)
      ) {
        return false;
      }

      if (
        tableFilters.issue &&
        normalizeKey(getIssue(row)) !== normalizeKey(tableFilters.issue)
      ) {
        return false;
      }

      if (
        tableFilters.warrantyStatus &&
        normalizeKey(getWarrantyStatus(row)) !==
          normalizeKey(tableFilters.warrantyStatus)
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
      issue: "",
      warrantyStatus: "",
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
        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr_0.85fr_0.9fr_0.85fr_auto] xl:items-end">
          <div>
            <label className="angel-label">Search</label>

            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
              />

              <input
                className="angel-input h-12 !pl-12 bg-white"
                placeholder="Search ticket, product, subject, issue, warranty..."
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
            <label className="angel-label">Issues</label>

            <select
              className="angel-input h-12 bg-white"
              value={tableFilters.issue}
              onChange={(event) => updateFilter("issue", event.target.value)}
            >
              <option value="">All Issues</option>

              {issues.map((issue) => (
                <option key={issue} value={issue}>
                  {issue}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="angel-label">Warranty Status</label>

            <select
              className="angel-input h-12 bg-white"
              value={tableFilters.warrantyStatus}
              onChange={(event) =>
                updateFilter("warrantyStatus", event.target.value)
              }
            >
              <option value="">All Warranty</option>

              {warrantyStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
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

      <div className="w-full overflow-hidden">
        <table className="w-full table-fixed border-collapse text-left text-[12px] xl:text-[13px]">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.12em] text-slate-500 xl:text-xs">
            <tr>
              <th className="w-[7%] px-2.5 py-4 font-black">Ticket #</th>
              <th className="w-[8%] px-2.5 py-4 font-black">Date</th>
              <th className="w-[7%] px-2.5 py-4 font-black">Region</th>
              <th className="w-[16%] px-2.5 py-4 font-black">Product 1</th>
              <th className="w-[18%] px-2.5 py-4 font-black">Subject</th>
              <th className="w-[17%] px-2.5 py-4 font-black">Issues</th>
              <th className="w-[14%] px-2.5 py-4 font-black">Warranty Status</th>
              <th className="w-[13%] px-2.5 py-4 font-black">RMA Type</th>
            </tr>
          </thead>

          <tbody>
            {visibleRows.length ? (
              visibleRows.slice(0, 800).map((row, index) => (
                <tr
                  key={`${row.ticketNumber || row.date}-${index}`}
                  className="border-t border-slate-100 align-top transition hover:bg-slate-50/70"
                >
                  <td className="break-words px-2.5 py-4 font-bold text-slate-800">
                    <ZendeskTicketLink value={row.ticketNumber} />
                  </td>

                  <td className="break-words px-2.5 py-4 text-slate-600">
                    {row.date || "-"}
                  </td>

                  <td className="break-words px-2.5 py-4 text-slate-600">
                    {normalizeRegionLabel(row.region) || "-"}
                  </td>

                  <td className="break-words px-2.5 py-4 font-black text-slate-800">
                    {row.product1 || "-"}
                  </td>

                  <td className="break-words px-2.5 py-4 leading-5 text-slate-600">
                    {row.ticketSubject || "-"}
                  </td>

                  <td className="break-words px-2.5 py-4 leading-5 text-slate-600">
                    {getIssue(row) || "-"}
                  </td>

                  <td className="break-words px-2.5 py-4 font-bold text-slate-700">
                    {getWarrantyStatus(row) || "-"}
                  </td>

                  <td className="px-2.5 py-4">
                    <span
                      className="inline-flex max-w-full whitespace-normal break-words rounded-full px-2.5 py-1.5 text-[11px] font-black text-slate-950"
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
