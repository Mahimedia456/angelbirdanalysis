import {
  getSatisfactionUniqueValues,
} from "../../utils/satisfactionMapper";

export default function SatisfactionFilters({
  rows = [],
  filters,
  onChange,
}) {
  const ratings =
    getSatisfactionUniqueValues(
      rows,
      "rating"
    );

  function update(
    key,
    value
  ) {
    onChange?.({
      ...filters,
      [key]: value,
    });
  }

  function resetFilters() {
    onChange?.({
      search: "",
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
            Filter customer
            satisfaction data
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

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
        <input
          value={
            filters.search
          }
          onChange={(
            event
          ) =>
            update(
              "search",
              event.target.value
            )
          }
          placeholder="Search ticket or comment..."
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-slate-400"
        />

        <select
          value={
            filters.rating
          }
          onChange={(
            event
          ) =>
            update(
              "rating",
              event.target.value
            )
          }
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-slate-400"
        >
          <option value="">
            All Ratings
          </option>

          {ratings.map(
            (rating) => (
              <option
                key={rating}
                value={rating}
              >
                {rating}
              </option>
            )
          )}
        </select>

        <select
          value={
            filters.solvedStatus
          }
          onChange={(
            event
          ) =>
            update(
              "solvedStatus",
              event.target.value
            )
          }
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
          value={
            filters.dateFrom
          }
          onChange={(
            event
          ) =>
            update(
              "dateFrom",
              event.target.value
            )
          }
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-slate-400"
        />

        <input
          type="date"
          value={
            filters.dateTo
          }
          onChange={(
            event
          ) =>
            update(
              "dateTo",
              event.target.value
            )
          }
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-slate-400"
        />
      </div>
    </section>
  );
}