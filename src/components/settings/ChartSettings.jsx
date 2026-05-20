import { useEffect, useState } from "react";
import {
  DEFAULT_CHART_COLORS,
  getChartColors,
  getChartSettings,
  saveChartColors,
  saveChartSettings,
} from "../../utils/storage";

const chartTypes = ["bar", "line", "area", "pie", "donut"];

const fields = [
  { key: "productChart", label: "Product Summary Chart" },
  { key: "categoryChart", label: "Product Category Chart" },
  { key: "monthlyChart", label: "General Monthly Chart" },
  { key: "stockChart", label: "Stock Chart" },
  { key: "ticketDailyChart", label: "Ticket Date-wise Chart" },
  { key: "ticketSupportChart", label: "Ticket Support Category Chart" },
  { key: "ticketProductCategoryChart", label: "Ticket Product Category Chart" },
  { key: "ticketProcedureChart", label: "Ticket Procedure Chart" },
];

export default function ChartSettings() {
  const [settings, setSettings] = useState(getChartSettings());
  const [colors, setColors] = useState(getChartColors());

  useEffect(() => {
    saveChartSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveChartColors(colors);
  }, [colors]);

  function updateField(key, value) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateColor(index, value) {
    const next = [...colors];
    next[index] = value;
    setColors(next);
  }

  function addColor() {
    setColors((current) => [...current, "#64748b"]);
  }

  function removeColor(index) {
    setColors((current) => current.filter((_, i) => i !== index));
  }

  function resetColors() {
    setColors(DEFAULT_CHART_COLORS);
  }

  return (
    <div className="space-y-6">
      <div className="angel-card p-6">
        <h3 className="text-xl font-black text-slate-900">
          Chart Output Mapping
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          Choose chart type separately for product analytics and ticket analytics.
          Bar/pie colors are controlled beside each chart and from the palette
          below.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="angel-label">{field.label}</label>

              <select
                className="angel-input"
                value={settings[field.key] || "bar"}
                onChange={(event) => updateField(field.key, event.target.value)}
              >
                {chartTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="angel-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900">
              Shared Chart Color Palette
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Add more colors if chart has many bars or pie slices. These colors
              rotate across bars and pie segments.
            </p>
          </div>

          <div className="flex gap-2">
            <button onClick={addColor} className="angel-btn angel-btn-lime">
              Add Color
            </button>

            <button onClick={resetColors} className="angel-btn angel-btn-dark">
              Reset
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {colors.map((color, index) => (
            <div key={`${color}-${index}`}>
              <label className="angel-label">Chart Color {index + 1}</label>

              <div className="flex gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(event) => updateColor(index, event.target.value)}
                  className="h-12 w-16 rounded-xl border border-slate-200 bg-white p-1"
                />

                <input
                  value={color}
                  onChange={(event) => updateColor(index, event.target.value)}
                  className="angel-input"
                />

                {colors.length > 2 ? (
                  <button
                    onClick={() => removeColor(index)}
                    className="rounded-xl border border-red-200 px-3 text-sm font-black text-red-600 hover:bg-red-50"
                  >
                    ×
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}