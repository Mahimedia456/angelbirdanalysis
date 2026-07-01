import {
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";

const chartTypes = [
  "bar",
  "line",
  "area",
  "pie",
  "donut",
];

const fields = [
  {
    key: "productChart",
    label:
      "Product Summary Chart",
  },
  {
    key: "categoryChart",
    label:
      "Product Category Chart",
  },
  {
    key: "monthlyChart",
    label:
      "General Monthly Chart",
  },
  {
    key: "stockChart",
    label: "Stock Chart",
  },
  {
    key: "ticketDailyChart",
    label:
      "Ticket Date-wise Chart",
  },
  {
    key: "ticketSupportChart",
    label:
      "Ticket Support Category Chart",
  },
  {
    key:
      "ticketProductCategoryChart",
    label:
      "Ticket Product Category Chart",
  },
  {
    key:
      "ticketProcedureChart",
    label:
      "Ticket Procedure Chart",
  },
];

export const DEFAULT_CHART_SETTINGS = {
  productChart: "bar",
  categoryChart: "bar",
  monthlyChart: "line",
  stockChart: "bar",
  ticketDailyChart: "line",
  ticketSupportChart: "bar",
  ticketProductCategoryChart:
    "bar",
  ticketProcedureChart: "bar",
};

export const DEFAULT_CHART_COLORS = [
  "#2f3d46",
  "#d7ff00",
  "#64748b",
  "#94a3b8",
  "#0f172a",
  "#cbd5e1",
];

export default function ChartSettings({
  settings,
  colors,
  onSettingsChange,
  onColorsChange,
  disabled = false,
}) {
  function updateField(
    key,
    value
  ) {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  }

  function updateColor(
    index,
    value
  ) {
    const nextColors = [
      ...colors,
    ];

    nextColors[index] =
      value;

    onColorsChange(
      nextColors
    );
  }

  function addColor() {
    if (
      colors.length >= 20
    ) {
      return;
    }

    onColorsChange([
      ...colors,
      "#64748b",
    ]);
  }

  function removeColor(
    index
  ) {
    if (
      colors.length <= 2
    ) {
      return;
    }

    onColorsChange(
      colors.filter(
        (_, colorIndex) =>
          colorIndex !== index
      )
    );
  }

  function resetChartSettings() {
    onSettingsChange({
      ...DEFAULT_CHART_SETTINGS,
    });
  }

  function resetColors() {
    onColorsChange([
      ...DEFAULT_CHART_COLORS,
    ]);
  }

  return (
    <div className="space-y-6">
      <section className="angel-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="angel-mini-label">
              Visualization
            </p>

            <h2 className="mt-2 text-xl font-black text-slate-900">
              Chart Output Mapping
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Choose a global chart type
              for each dashboard and
              report visualization.
            </p>
          </div>

          <button
            type="button"
            onClick={
              resetChartSettings
            }
            disabled={disabled}
            className="angel-btn angel-btn-dark gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw
              size={16}
            />
            Reset Mapping
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {fields.map(
            (field) => (
              <div
                key={field.key}
              >
                <label
                  htmlFor={`chart-${field.key}`}
                  className="angel-label"
                >
                  {field.label}
                </label>

                <select
                  id={`chart-${field.key}`}
                  className="angel-input"
                  value={
                    settings[
                      field.key
                    ] || "bar"
                  }
                  disabled={
                    disabled
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      field.key,
                      event.target
                        .value
                    )
                  }
                >
                  {chartTypes.map(
                    (type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type.toUpperCase()}
                      </option>
                    )
                  )}
                </select>
              </div>
            )
          )}
        </div>
      </section>

      <section className="angel-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="angel-mini-label">
              Palette
            </p>

            <h2 className="mt-2 text-xl font-black text-slate-900">
              Shared Chart Colors
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              These colors rotate
              across chart bars, pie
              slices and data series.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addColor}
              disabled={
                disabled ||
                colors.length >= 20
              }
              className="angel-btn angel-btn-lime gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={16} />
              Add Color
            </button>

            <button
              type="button"
              onClick={resetColors}
              disabled={disabled}
              className="angel-btn angel-btn-dark gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw
                size={16}
              />
              Reset Colors
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {colors.map(
            (color, index) => (
              <div
                key={`${index}-${color}`}
              >
                <label className="angel-label">
                  Chart Color{" "}
                  {index + 1}
                </label>

                <div className="flex gap-2">
                  <input
                    type="color"
                    value={color}
                    disabled={
                      disabled
                    }
                    onChange={(
                      event
                    ) =>
                      updateColor(
                        index,
                        event.target
                          .value
                      )
                    }
                    className="h-12 w-14 shrink-0 rounded-xl border border-slate-200 bg-white p-1 disabled:opacity-60"
                  />

                  <input
                    type="text"
                    value={color}
                    disabled={
                      disabled
                    }
                    maxLength={7}
                    onChange={(
                      event
                    ) =>
                      updateColor(
                        index,
                        event.target
                          .value
                      )
                    }
                    className="angel-input min-w-0"
                  />

                  {colors.length >
                  2 ? (
                    <button
                      type="button"
                      disabled={
                        disabled
                      }
                      onClick={() =>
                        removeColor(
                          index
                        )
                      }
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      aria-label={`Remove chart color ${
                        index + 1
                      }`}
                    >
                      <Trash2
                        size={16}
                      />
                    </button>
                  ) : null}
                </div>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}