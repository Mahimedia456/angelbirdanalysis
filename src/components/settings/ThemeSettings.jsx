import { useEffect, useState } from "react";
import { applyTheme, getTheme, saveTheme } from "../../utils/storage";

const fields = [
  { key: "headerColor", label: "Header Color" },
  { key: "footerColor", label: "Footer Color" },
  { key: "accentColor", label: "Angelbird Accent Color" },
  { key: "kpiColor", label: "KPI Card Color" },
  { key: "chartColor", label: "Default Chart Color" },
  { key: "textColor", label: "Text Color" },
];

export default function ThemeSettings() {
  const [theme, setTheme] = useState(getTheme());

  useEffect(() => {
    applyTheme(theme);
    saveTheme(theme);
  }, [theme]);

  function updateField(key, value) {
    setTheme((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetTheme() {
    setTheme({
      headerColor: "#2f3d46",
      footerColor: "#2f3d46",
      accentColor: "#d7ff00",
      kpiColor: "#f4f6f6",
      chartColor: "#2f3d46",
      textColor: "#2f3d46",
    });
  }

  return (
    <div className="angel-card p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900">
            Global Theme Colors
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            These colors control the overall Angelbird dashboard theme. Individual
            chart bar/pie colors can be changed directly beside each chart.
          </p>
        </div>

        <button onClick={resetTheme} className="angel-btn angel-btn-dark">
          Reset Theme
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="angel-label">{field.label}</label>

            <div className="flex gap-3">
              <input
                type="color"
                value={theme[field.key]}
                onChange={(event) => updateField(field.key, event.target.value)}
                className="h-12 w-16 rounded-xl border border-slate-200 bg-white p-1"
              />

              <input
                value={theme[field.key]}
                onChange={(event) => updateField(field.key, event.target.value)}
                className="angel-input"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}