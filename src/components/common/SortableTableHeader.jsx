import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
} from "lucide-react";

export default function SortableTableHeader({
  label,
  sortKey,
  sortConfig,
  onSort,
  className = "",
  buttonClassName = "",
}) {
  const active = sortConfig?.key === sortKey;
  const direction = active
    ? sortConfig.direction
    : null;

  const ariaSort = active
    ? direction === "desc"
      ? "descending"
      : "ascending"
    : "none";

  const Icon = !active
    ? ArrowUpDown
    : direction === "desc"
    ? ArrowDown
    : ArrowUp;

  return (
    <th
      className={className}
      aria-sort={ariaSort}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={[
          "group inline-flex w-full items-center gap-1.5 text-left",
          "transition hover:text-slate-950 focus:outline-none focus-visible:ring-2",
          "focus-visible:ring-slate-300 focus-visible:ring-offset-2",
          buttonClassName,
        ].join(" ")}
        title={`${label}: sort ${
          active && direction === "asc"
            ? "descending"
            : "ascending"
        }`}
      >
        <span>{label}</span>

        <Icon
          size={14}
          strokeWidth={active ? 2.5 : 2}
          className={[
            "shrink-0 transition",
            active
              ? "text-slate-900"
              : "text-slate-300 group-hover:text-slate-500",
          ].join(" ")}
        />
      </button>
    </th>
  );
}
