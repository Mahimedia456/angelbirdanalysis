import { Search } from "lucide-react";

import {
  ALLOWED_REGIONS,
  getUniqueValues,
} from "../../utils/ticketMapper";

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

function normalizeOption(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function uniqueCleanOptions(values = []) {
  const map = new Map();

  values.forEach((value) => {
    const clean = String(value || "")
      .trim()
      .replace(/\s+/g, " ");

    if (!clean) return;

    const key = normalizeOption(clean);

    if (!map.has(key)) {
      map.set(key, clean);
    }
  });

  return Array.from(map.values()).sort((a, b) =>
    a.localeCompare(b)
  );
}

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

function getTicketDate(row) {
  return normalizeDate(
    row.ticket_date ||
      row.ticketDate ||
      row.date ||
      row.date_display ||
      row.createdDate ||
      row.submittedDate ||
      ""
  );
}

function getYearFromTicket(row) {
  return getTicketDate(row).slice(0, 4);
}

function normalizeProcedureLabel(value) {
  const clean = String(value || "")
    .trim()
    .replace(/\s+/g, " ");

  if (normalizeOption(clean) === "data recovery") {
    return "Data Recovery";
  }

  return clean;
}
function normalizeSupportCategoryLabel(value) {
  const clean = String(value || "")
    .trim()
    .replace(/\s+/g, " ");

  if (normalizeOption(clean) === "data recovery") {
    return "Data Recovery";
  }

  if (normalizeOption(clean) === "troubleshoot") {
    return "Troubleshoot";
  }

  return clean;
}

export default function TicketFilters({
  tickets = [],
  filters,
  onChange,
}) {
  const years = uniqueCleanOptions(
    tickets.map((ticket) => getYearFromTicket(ticket))
  ).sort((a, b) => b.localeCompare(a));

const supportCategories = uniqueCleanOptions(
  getUniqueValues(tickets, "support_category").map(normalizeSupportCategoryLabel)
);
  const productCategories = uniqueCleanOptions(
    getUniqueValues(tickets, "product_category")
  );

  const procedures = uniqueCleanOptions(
    getUniqueValues(tickets, "procedure").map(normalizeProcedureLabel)
  );

  const activeRegions = uniqueCleanOptions(
    ALLOWED_REGIONS.filter((region) =>
      tickets.some(
        (ticket) =>
          normalizeOption(ticket.region) === normalizeOption(region)
      )
    )
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
      supportCategory: "",
      productCategory: "",
      procedure: "",
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
              placeholder="Search ticket number, product, subject, procedure..."
              value={filters.search || ""}
              onChange={(event) =>
                updateFilter("search", event.target.value)
              }
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

            {activeRegions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="angel-label">Support Category</label>

          <select
            className="angel-input h-12"
            value={filters.supportCategory || ""}
            onChange={(event) =>
              updateFilter("supportCategory", event.target.value)
            }
          >
            <option value="">All Support Categories</option>

            {supportCategories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_0.9fr_0.6fr_0.6fr_auto] xl:items-end">
        <div>
          <label className="angel-label">Product Category</label>

          <select
            className="angel-input h-12"
            value={filters.productCategory || ""}
            onChange={(event) =>
              updateFilter("productCategory", event.target.value)
            }
          >
            <option value="">All Product Categories</option>

            {productCategories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="angel-label">Procedure</label>

          <select
            className="angel-input h-12"
            value={filters.procedure || ""}
            onChange={(event) =>
              updateFilter("procedure", event.target.value)
            }
          >
            <option value="">All Procedures</option>

            {procedures.map((item) => (
              <option key={item} value={item}>
                {item}
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