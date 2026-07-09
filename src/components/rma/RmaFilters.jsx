import { Search } from "lucide-react";

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
  "NA",
  "UAE",
  "UK",
  "US",
];

const ALLOWED_RMA_TYPES = [
  "Broken Plastic",
  "Data Recovery",
  "Data Recovery RMA",
  "Repair & Replaced",
  "RMA",
];

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

export default function RmaFilters({
  rows = [],
  filters,
  onChange,
}) {
  const years = uniqueOptions(
    rows.map((row) => String(row.date || "").slice(0, 4))
  ).sort((a, b) => b.localeCompare(a));

const regions = ALLOWED_REGIONS.filter((region) =>
  rows.some((row) => normalizeKey(row.region) === normalizeKey(region))
);

const rmaTypes = ALLOWED_RMA_TYPES.filter((type) =>
  rows.some((row) => normalizeKey(row.rmaType) === normalizeKey(type))
);

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
      dateFrom: "",
      dateTo: "",
    });
  }

  return (
    <div className="angel-card p-5">
      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.55fr_0.55fr_0.8fr_1fr]">
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
              placeholder="Search ticket number, product, TSE, subject, RMA type..."
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
                {region}
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

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.7fr_0.7fr_auto] xl:items-end">
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