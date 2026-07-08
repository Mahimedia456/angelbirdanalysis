import {
  getSatisfactionUniqueValues,
} from "../../utils/satisfactionMapper";

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

function normalizeDate(value) {
  const raw = String(value || "").trim();

  if (!raw) return "";

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }

  const slash = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);

  if (slash) {
    let first = Number(slash[1]);
    let second = Number(slash[2]);
    let year = Number(slash[3]);

    if (year < 100) {
      year += 2000;
    }

    let month = first;
    let day = second;

    if (first > 12) {
      day = first;
      month = second;
    }

    return [
      String(year).padStart(4, "0"),
      String(month).padStart(2, "0"),
      String(day).padStart(2, "0"),
    ].join("-");
  }

  const parsed = new Date(raw);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return "";
}

function getSatisfactionDate(row) {
  return normalizeDate(
    row.updated_date ||
      row.updatedDate ||
      row.date ||
      row.date_display ||
      row.responseDate ||
      row.response_date ||
      ""
  );
}

function uniqueCleanOptions(values = []) {
  return Array.from(
    new Set(
      values
        .map((value) =>
          String(value || "")
            .trim()
            .replace(/\s+/g, " ")
        )
        .filter(Boolean)
    )
  ).sort((a, b) => b.localeCompare(a));
}

export default function SatisfactionFilters({
  rows = [],
  filters,
  onChange,
}) {
  const ratings = getSatisfactionUniqueValues(rows, "rating");

  const years = uniqueCleanOptions(
    rows.map((row) => getSatisfactionDate(row).slice(0, 4))
  );

  function update(key, value) {
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
      rating: "",
      solvedStatus: "",
      dateFrom: "",
      dateTo: "",
    });
  }

  return (
    <section className="angel-section p-5">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="angel-mini-label">
            Satisfaction Filters
          </p>

          <h2 className="mt-2 text-xl font-black text-slate-900">
            Filter customer satisfaction data
          </h2>
        </div>

        <button
          type="button"
          onClick={resetFilters}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-50"
        >
          Reset Filters
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr]">
        <input
          value={filters.search || ""}
          onChange={(event) => update("search", event.target.value)}
          placeholder="Search ticket or comment..."
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-slate-400"
        />

        <select
          value={filters.year || ""}
          onChange={(event) => update("year", event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-slate-400"
        >
          <option value="">
            All Years
          </option>

          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <select
          value={filters.month || ""}
          onChange={(event) => update("month", event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-slate-400"
        >
          <option value="">
            All Months
          </option>

          {MONTHS.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>

        <select
          value={filters.rating || ""}
          onChange={(event) => update("rating", event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-slate-400"
        >
          <option value="">
            All Ratings
          </option>

          {ratings.map((rating) => (
            <option key={rating} value={rating}>
              {rating}
            </option>
          ))}
        </select>

        <select
          value={filters.solvedStatus || ""}
          onChange={(event) => update("solvedStatus", event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-slate-400"
        >
          <option value="">
            All Solved Status
          </option>

          <option value="solved">
            Solved
          </option>

          <option value="not_solved">
            Not Solved
          </option>
        </select>

        <input
          type="date"
          value={filters.dateFrom || ""}
          onChange={(event) => update("dateFrom", event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-slate-400"
        />

        <input
          type="date"
          value={filters.dateTo || ""}
          onChange={(event) => update("dateTo", event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-slate-400"
        />
      </div>
    </section>
  );
}