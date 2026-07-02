import { Search } from "lucide-react";

import {
  ALLOWED_REGIONS,
  getUniqueValues,
} from "../../utils/ticketMapper";

export default function TicketFilters({
  tickets = [],
  filters,
  onChange,
}) {
  const supportCategories = getUniqueValues(tickets, "support_category");
  const productCategories = getUniqueValues(tickets, "product_category");
  const procedures = getUniqueValues(tickets, "procedure");

  const activeRegions = ALLOWED_REGIONS.filter((region) =>
    tickets.some((ticket) => ticket.region === region)
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
      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.7fr_0.9fr_0.9fr]">
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
              value={filters.search}
              onChange={(event) =>
                updateFilter("search", event.target.value)
              }
            />
          </div>
        </div>

        <div>
          <label className="angel-label">Region</label>

          <select
            className="angel-input h-12"
            value={filters.region}
            onChange={(event) =>
              updateFilter("region", event.target.value)
            }
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
            value={filters.supportCategory}
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

        <div>
          <label className="angel-label">Product Category</label>

          <select
            className="angel-input h-12"
            value={filters.productCategory}
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
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_0.6fr_0.6fr_auto] xl:items-end">
        <div>
          <label className="angel-label">Procedure</label>

          <select
            className="angel-input h-12"
            value={filters.procedure}
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
            value={filters.dateFrom}
            onChange={(event) =>
              updateFilter("dateFrom", event.target.value)
            }
          />
        </div>

        <div>
          <label className="angel-label">Date To</label>

          <input
            type="date"
            className="angel-input h-12"
            value={filters.dateTo}
            onChange={(event) =>
              updateFilter("dateTo", event.target.value)
            }
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