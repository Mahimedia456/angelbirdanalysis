import { Search } from "lucide-react";

import {
  ANGELBIRD_CATEGORIES,
  getProductCategories,
} from "../../utils/productMapper";

export default function ProductFilters({
  products = [],
  filters,
  onChange,
}) {
  const uploadedCategories = getProductCategories(products);

  const categories = Array.from(
    new Set([...ANGELBIRD_CATEGORIES, ...uploadedCategories])
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
      category: "",
    });
  }

  return (
    <div className="angel-card p-5">
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.8fr_auto] xl:items-end">
        <div>
          <label className="angel-label">
            Search Product / SKU / EAN / UPC
          </label>

          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
            />

            <input
              className="angel-input h-12 !pl-12"
              placeholder="Search product name, SKU, EAN, UPC..."
              value={filters.search}
              onChange={(event) =>
                updateFilter("search", event.target.value)
              }
            />
          </div>
        </div>

        <div>
          <label className="angel-label">Product Category</label>

          <select
            className="angel-input h-12"
            value={filters.category}
            onChange={(event) =>
              updateFilter("category", event.target.value)
            }
          >
            <option value="">All Categories</option>

            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={resetFilters}
          className="angel-btn angel-btn-dark h-12"
        >
          Reset
        </button>
      </div>
    </div>
  );
}