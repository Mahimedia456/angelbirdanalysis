import {
  RotateCcw,
} from "lucide-react";

const fields = [
  {
    key: "headerColor",
    label: "Header Color",
  },
  {
    key: "footerColor",
    label: "Footer Color",
  },
  {
    key: "accentColor",
    label:
      "Angelbird Accent Color",
  },
  {
    key: "kpiColor",
    label: "KPI Card Color",
  },
  {
    key: "chartColor",
    label:
      "Default Chart Color",
  },
  {
    key: "textColor",
    label: "Text Color",
  },
];

export const DEFAULT_THEME = {
  headerColor: "#2f3d46",
  footerColor: "#2f3d46",
  accentColor: "#d7ff00",
  kpiColor: "#f4f6f6",
  chartColor: "#2f3d46",
  textColor: "#2f3d46",
};

export default function ThemeSettings({
  theme,
  onChange,
  disabled = false,
}) {
  function updateField(
    key,
    value
  ) {
    onChange({
      ...theme,
      [key]: value,
    });
  }

  function resetTheme() {
    onChange({
      ...DEFAULT_THEME,
    });
  }

  return (
    <section className="angel-card p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="angel-mini-label">
            Interface
          </p>

          <h2 className="mt-2 text-xl font-black text-slate-900">
            Global Theme Colors
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            These colors are saved to
            the Angelbird database and
            applied globally for all
            authorized users.
          </p>
        </div>

        <button
          type="button"
          onClick={resetTheme}
          disabled={disabled}
          className="angel-btn angel-btn-dark gap-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw size={16} />
          Reset Theme
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key}>
            <label
              htmlFor={`theme-${field.key}`}
              className="angel-label"
            >
              {field.label}
            </label>

            <div className="flex gap-3">
              <input
                id={`theme-${field.key}`}
                type="color"
                value={
                  theme[field.key]
                }
                disabled={disabled}
                onChange={(event) =>
                  updateField(
                    field.key,
                    event.target.value
                  )
                }
                className="h-12 w-16 shrink-0 rounded-xl border border-slate-200 bg-white p-1 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <input
                type="text"
                value={
                  theme[field.key]
                }
                disabled={disabled}
                onChange={(event) =>
                  updateField(
                    field.key,
                    event.target.value
                  )
                }
                className="angel-input"
                maxLength={7}
                pattern="^#[0-9a-fA-F]{6}$"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}