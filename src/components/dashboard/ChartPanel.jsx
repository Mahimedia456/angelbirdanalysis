import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DEFAULT_CHART_COLORS,
  getChartColors,
  getChartTypeOverride,
  saveChartColors,
  saveChartTypeOverride,
} from "../../utils/storage";

const CHART_TYPES = [
  { value: "bar", label: "BAR" },
  { value: "horizontal_bar", label: "HORIZONTAL BAR" },
  { value: "line", label: "LINE" },
  { value: "area", label: "AREA" },
  { value: "pie", label: "PIE" },
  { value: "donut", label: "DONUT" },
  { value: "radial", label: "RADIAL" },
  { value: "composed", label: "COMPOSED" },
];

function makeChartId(title = "") {
  return String(title)
    .trim()
    .toLowerCase()
    .replace(/[^\w]+/g, "_")
    .replace(/^_|_$/g, "");
}

function CustomTooltip({ active, payload, label, chartTitle }) {
  if (!active || !payload?.length) return null;

  const item = payload[0];
  const row = item?.payload || {};
  const name = row.name || item?.name || label || "Item";
  const value = Number(row.value ?? item?.value ?? 0);

  return (
    <div className="min-w-[220px] rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        {chartTitle}
      </p>

      <p className="mt-2 text-sm font-black text-slate-900">{name}</p>

      <div className="mt-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            Count
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
        </div>
      </div>

      {row.previous !== undefined ? (
        <p className="mt-3 text-xs text-slate-500">
          <strong>Previous:</strong> {row.previous}
        </p>
      ) : null}

      {row.changePercent !== undefined ? (
        <p className="mt-2 text-xs text-slate-500">
          <strong>Change:</strong> {Number(row.changePercent).toFixed(1)}%
        </p>
      ) : null}

      {row.product_name ? (
        <p className="mt-2 text-xs text-slate-500">
          <strong>Product:</strong> {row.product_name}
        </p>
      ) : null}

      {row.category ? (
        <p className="mt-2 text-xs text-slate-500">
          <strong>Category:</strong> {row.category}
        </p>
      ) : null}
    </div>
  );
}

export default function ChartPanel({ title, data = [], type = "bar", chartId }) {
  const resolvedChartId = chartId || makeChartId(title);
  const savedType = getChartTypeOverride(resolvedChartId);

  const [selectedType, setSelectedType] = useState(savedType || type || "bar");
  const [colors, setColors] = useState(getChartColors());

  const safeData = useMemo(() => data.slice(0, 14), [data]);

  const total = useMemo(
    () => safeData.reduce((sum, item) => sum + Number(item.value || 0), 0),
    [safeData]
  );

  const radialData = useMemo(
    () =>
      safeData.map((item, index) => ({
        ...item,
        fill: colors[index % colors.length] || colors[0],
      })),
    [safeData, colors]
  );

  function updateChartType(value) {
    setSelectedType(value);
    saveChartTypeOverride(resolvedChartId, value);
  }

  function updateColor(index, value) {
    const next = [...colors];
    next[index] = value;
    setColors(next);
    saveChartColors(next);
  }

  function addColor() {
    const next = [...colors, "#64748b"];
    setColors(next);
    saveChartColors(next);
  }

  function resetColors() {
    setColors(DEFAULT_CHART_COLORS);
    saveChartColors(DEFAULT_CHART_COLORS);
  }

  const primary = colors[0] || "#2f3d46";

  return (
    <div className="angel-card p-5">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {safeData.length
              ? `${safeData.length} items · ${total} total count`
              : "No chart data available"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print no-export">
          <select
            value={selectedType}
            onChange={(event) => updateChartType(event.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-black uppercase text-slate-600 outline-none"
            title="Change chart type"
          >
            {CHART_TYPES.map((chartType) => (
              <option key={chartType.value} value={chartType.value}>
                {chartType.label}
              </option>
            ))}
          </select>

          {colors.slice(0, 6).map((color, index) => (
            <input
              key={`${color}-${index}`}
              type="color"
              value={color}
              onChange={(event) => updateColor(index, event.target.value)}
              className="h-8 w-8 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
              title={`Chart color ${index + 1}`}
            />
          ))}

          <button
            type="button"
            onClick={addColor}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-black text-slate-500 hover:bg-slate-50"
          >
            +
          </button>

          <button
            type="button"
            onClick={resetColors}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-black text-slate-500 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="h-[340px]">
        {!safeData.length ? (
          <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">
            Upload CSV data to generate this chart.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {selectedType === "line" ? (
              <LineChart data={safeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip chartTitle={title} />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={primary}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            ) : selectedType === "area" ? (
              <AreaChart data={safeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip chartTitle={title} />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={primary}
                  fill={colors[1] || "#d7ff00"}
                  strokeWidth={3}
                />
              </AreaChart>
            ) : selectedType === "pie" || selectedType === "donut" ? (
              <PieChart>
                <Tooltip content={<CustomTooltip chartTitle={title} />} />
                <Pie
                  data={safeData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  innerRadius={selectedType === "donut" ? 60 : 0}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {safeData.map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={colors[index % colors.length] || primary}
                    />
                  ))}
                </Pie>
              </PieChart>
            ) : selectedType === "radial" ? (
              <RadialBarChart
                data={radialData}
                innerRadius="15%"
                outerRadius="95%"
                startAngle={90}
                endAngle={-270}
              >
                <Tooltip content={<CustomTooltip chartTitle={title} />} />
                <Legend
                  iconSize={10}
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                />
                <RadialBar dataKey="value" background cornerRadius={12} />
              </RadialBarChart>
            ) : selectedType === "composed" ? (
              <ComposedChart data={safeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip chartTitle={title} />} />
                <Bar dataKey="value" fill={primary} radius={[8, 8, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={colors[1] || "#d7ff00"}
                  strokeWidth={3}
                />
              </ComposedChart>
            ) : selectedType === "horizontal_bar" ? (
              <BarChart
                data={safeData}
                layout="vertical"
                margin={{ left: 50, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  width={130}
                />
                <Tooltip content={<CustomTooltip chartTitle={title} />} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {safeData.map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={colors[index % colors.length] || primary}
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <BarChart data={safeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip chartTitle={title} />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {safeData.map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={colors[index % colors.length] || primary}
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}