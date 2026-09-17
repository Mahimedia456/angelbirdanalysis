import { Search } from "lucide-react";
import { normalizeRegionKey, normalizeRegionLabel } from "../../utils/region";

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const ALLOWED_REGIONS = [
  "APAC",
  "AUS",
  "EMEA",
  "UAE",
  "UK",
  "US",
];

const WARRANTY_ORDER = [
  "In Warranty",
  "Out of Warranty",
];

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

export default function RmaFilters({
  rows = [],
  filters,
  onChange,
}) {
  const years = uniqueOptions(
    rows.map((row) => String(row.date || "").slice(0, 4))
  ).sort((a, b) => b.localeCompare(a));

  const activeRegionKeys = new Set(
    rows
      .map((row) => normalizeRegionKey(row.region))
      .filter(Boolean)
  );

  const regions = ALLOWED_REGIONS.filter((region) =>
    activeRegionKeys.has(normalizeRegionKey(region))
  );

  // RMA TYPE is owned by the dedicated RMA Sheet tab. Do not whitelist
  // values here: every non-empty category present in the sheet must appear
  // in the filter, including newly synced/custom categories.
  const rmaTypes = uniqueOptions(rows.map((row) => row.rmaType));

  const issues = uniqueOptions(rows.map(getIssue));

  const rawWarrantyStatuses = uniqueOptions(rows.map(getWarrantyStatus));
  const warrantyStatuses = [
    ...WARRANTY_ORDER.filter((status) =>
      rawWarrantyStatuses.some(
        (value) => normalizeKey(value) === normalizeKey(status)
      )
    ),
    ...rawWarrantyStatuses.filter(
      (value) =>
        !WARRANTY_ORDER.some(
          (status) => normalizeKey(value) === normalizeKey(status)
        )
    ),
  ];

  function updateFilter(key, value) {
    onChange?.({
      ...filters,
      [key]: value,
    });
  }

  function resetFilters() {
    onChange?.({
      search: "",
      year: "",
      month: "",
      region: "",
      rmaType: "",
      issue: "",
      warrantyStatus: "",
      dateFrom: "",
      dateTo: "",
    });
  }

  return (
    <div className="angel-card p-5">
      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr_0.55fr_0.75fr_0.95fr]">
        <div>
          <label className="angel-label">
            Search Ticket / Product / Subject
          </label>

          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
            />

            <input
              className="angel-input h-12 !pl-12"
              placeholder="Search ticket, product, subject, issue, warranty..."
              value={filters.search || ""}
              onChange={(event) => updateFilter("search", event.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="angel-label">Year</label>

          <select
            className="angel-input h-12"
            value={filters.year || ""}
            onChange={(event) => updateFilter("year", event.target.value)}
          >
            <option value="">All Years</option>

            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="angel-label">Month</label>

          <select
            className="angel-input h-12"
            value={filters.month || ""}
            onChange={(event) => updateFilter("month", event.target.value)}
          >
            <option value="">All Months</option>

            {MONTHS.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="angel-label">Region</label>

          <select
            className="angel-input h-12"
            value={filters.region || ""}
            onChange={(event) => updateFilter("region", event.target.value)}
          >
            <option value="">All Regions</option>

            {regions.map((region) => (
              <option key={region} value={region}>
                {normalizeRegionLabel(region)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="angel-label">RMA Type</label>

          <select
            className="angel-input h-12"
            value={filters.rmaType || ""}
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
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr_0.75fr_0.75fr_auto] xl:items-end">
        <div>
          <label className="angel-label">Issues</label>

          <select
            className="angel-input h-12"
            value={filters.issue || ""}
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
            className="angel-input h-12"
            value={filters.warrantyStatus || ""}
            onChange={(event) =>
              updateFilter("warrantyStatus", event.target.value)
            }
          >
            <option value="">All Warranty Status</option>

            {warrantyStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="angel-label">Date From</label>

          <input
            type="date"
            className="angel-input h-12"
            value={filters.dateFrom || ""}
            onChange={(event) => updateFilter("dateFrom", event.target.value)}
          />
        </div>

        <div>
          <label className="angel-label">Date To</label>

          <input
            type="date"
            className="angel-input h-12"
            value={filters.dateTo || ""}
            onChange={(event) => updateFilter("dateTo", event.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={resetFilters}
          className="angel-btn angel-btn-dark h-12"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}
