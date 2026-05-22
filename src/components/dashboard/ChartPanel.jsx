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

const ENTRY_LIMITS = [
  { value: "auto", label: "AUTO" },
  { value: "all", label: "ALL" },
  { value: "10", label: "TOP 10" },
  { value: "20", label: "TOP 20" },
  { value: "50", label: "TOP 50" },
];

const LAYOUT_MODES = [
  { value: "auto", label: "AUTO WIDTH" },
  { value: "half", label: "HALF" },
  { value: "full", label: "FULL" },
];

const ENTRY_LIMITS_STORAGE_KEY = "angelbird_chart_entry_limits";
const LAYOUT_STORAGE_KEY = "angelbird_chart_layout_modes";

function makeChartId(title = "") {
  return String(title)
    .trim()
    .toLowerCase()
    .replace(/[^\w]+/g, "_")
    .replace(/^_|_$/g, "");
}

function readLocalObject(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}

function saveLocalObject(key, value) {
  localStorage.setItem(key, JSON.stringify(value || {}));
}

function getChartEntryLimit(chartId) {
  const limits = readLocalObject(ENTRY_LIMITS_STORAGE_KEY);
  return limits[chartId] || "auto";
}

function saveChartEntryLimit(chartId, limit) {
  const limits = readLocalObject(ENTRY_LIMITS_STORAGE_KEY);

  if (!limit || limit === "auto") {
    delete limits[chartId];
  } else {
    limits[chartId] = limit;
  }

  saveLocalObject(ENTRY_LIMITS_STORAGE_KEY, limits);
}

function getChartLayoutMode(chartId) {
  const modes = readLocalObject(LAYOUT_STORAGE_KEY);
  return modes[chartId] || "auto";
}

function saveChartLayoutMode(chartId, mode) {
  const modes = readLocalObject(LAYOUT_STORAGE_KEY);

  if (!mode || mode === "auto") {
    delete modes[chartId];
  } else {
    modes[chartId] = mode;
  }

  saveLocalObject(LAYOUT_STORAGE_KEY, modes);
}

function formatAxisLabel(value = "") {
  const text = String(value || "");

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [, month, day] = text.split("-");
    return `${day}/${month}`;
  }

  if (/^\d{4}-\d{2}$/.test(text)) {
    const [year, month] = text.split("-");
    return `${month}/${year.slice(2)}`;
  }

  if (text.length > 20) return `${text.slice(0, 20)}…`;

  return text;
}

function isDateLikeLabel(value = "") {
  const text = String(value || "");
  return /^\d{4}-\d{2}-\d{2}$/.test(text) || /^\d{4}-\d{2}$/.test(text);
}

function isDateChartTitle(title = "") {
  const clean = String(title || "").toLowerCase();

  return (
    clean.includes("date") ||
    clean.includes("daily") ||
    clean.includes("month") ||
    clean.includes("trend")
  );
}

function isLongLabelChart(title = "") {
  const clean = String(title || "").toLowerCase();

  return (
    clean.includes("sku") ||
    clean.includes("product") ||
    clean.includes("procedure") ||
    clean.includes("reason") ||
    clean.includes("ticket count")
  );
}

function averageLabelLength(rows = []) {
  if (!rows.length) return 0;

  const total = rows.reduce((sum, item) => {
    return sum + String(item?.name || "").length;
  }, 0);

  return total / rows.length;
}

function sortDataForChart(rows = [], title = "") {
  const list = Array.isArray(rows) ? [...rows] : [];

  if (!list.length) return [];

  const shouldSortAsDate =
    isDateChartTitle(title) || list.some((item) => isDateLikeLabel(item?.name));

  if (shouldSortAsDate) {
    return list.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""))
    );
  }

  return list;
}

function limitData(rows = [], limit = "auto", selectedType = "bar", title = "") {
  const list = sortDataForChart(rows, title);

  if (!list.length) return [];

  if (limit === "all") return list;
  if (limit === "10") return list.slice(0, 10);
  if (limit === "20") return list.slice(0, 20);
  if (limit === "50") return list.slice(0, 50);

  const dateChart = isDateChartTitle(title);

  if (dateChart) return list;

  if (
    selectedType === "line" ||
    selectedType === "area" ||
    selectedType === "composed"
  ) {
    return list.length > 50 ? list.slice(0, 50) : list;
  }

  if (
    selectedType === "pie" ||
    selectedType === "donut" ||
    selectedType === "radial"
  ) {
    return list.slice(0, 12);
  }

  return list.slice(0, 20);
}

function shouldUseFullWidth({
  title,
  originalData,
  visibleData,
  selectedType,
  layoutMode,
  className,
}) {
  if (layoutMode === "full") return true;
  if (layoutMode === "half") return false;

  if (className.includes("xl:col-span-2")) return true;
  if (className.includes("col-span-2")) return true;
  if (className.includes("full")) return true;

  const visibleCount = visibleData.length;
  const originalCount = originalData.length;
  const avgLabel = averageLabelLength(visibleData);
  const dateChart = isDateChartTitle(title);
  const longLabelChart = isLongLabelChart(title);

  // Very small charts should stay half width.
  if (visibleCount <= 4) return false;

  // Pie/donut/radial with normal small data should stay half.
  if (
    (selectedType === "pie" ||
      selectedType === "donut" ||
      selectedType === "radial") &&
    visibleCount <= 12
  ) {
    return false;
  }

  // Date charts only need full width when there are enough points.
  if (dateChart && visibleCount > 8) return true;

  // Long label charts need full width only when actually crowded.
  if (longLabelChart && visibleCount > 10) return true;

  // Large datasets need full width.
  if (originalCount > 35 && visibleCount > 10) return true;

  // Labels are too long and many.
  if (avgLabel > 16 && visibleCount > 8) return true;

  // Normal bar/line/composed crowded charts.
  if (
    (selectedType === "bar" ||
      selectedType === "horizontal_bar" ||
      selectedType === "line" ||
      selectedType === "area" ||
      selectedType === "composed") &&
    visibleCount > 16
  ) {
    return true;
  }

  return false;
}

function getAutoHeight({ rowsCount, selectedType, isWide, isHorizontal }) {
  const count = Number(rowsCount || 0);

  if (!count) return 360;

  if (isHorizontal) {
    return Math.max(420, Math.min(980, count * 34 + 145));
  }

  if (selectedType === "pie" || selectedType === "donut") {
    return isWide ? 500 : 390;
  }

  if (selectedType === "radial") {
    return isWide ? 530 : 420;
  }

  if (
    selectedType === "line" ||
    selectedType === "area" ||
    selectedType === "composed"
  ) {
    if (count > 45) return isWide ? 580 : 500;
    if (count > 25) return isWide ? 530 : 460;
    if (count > 12) return isWide ? 480 : 430;
    return isWide ? 440 : 390;
  }

  if (count > 40) return isWide ? 590 : 500;
  if (count > 24) return isWide ? 540 : 460;
  if (count > 14) return isWide ? 490 : 420;

  return isWide ? 440 : 390;
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

export default function ChartPanel({
  title,
  data = [],
  type = "bar",
  chartId,
  className = "",
}) {
  const resolvedChartId = chartId || makeChartId(title);
  const savedType = getChartTypeOverride(resolvedChartId);
  const savedLimit = getChartEntryLimit(resolvedChartId);
  const savedLayoutMode = getChartLayoutMode(resolvedChartId);

  const [selectedType, setSelectedType] = useState(savedType || type || "bar");
  const [entryLimit, setEntryLimit] = useState(savedLimit || "auto");
  const [layoutMode, setLayoutMode] = useState(savedLayoutMode || "auto");
  const [colors, setColors] = useState(getChartColors());

  const originalData = useMemo(() => {
    return Array.isArray(data) ? data : [];
  }, [data]);

  const safeData = useMemo(() => {
    return limitData(originalData, entryLimit, selectedType, title);
  }, [originalData, entryLimit, selectedType, title]);

  const isFullWidth = shouldUseFullWidth({
    title,
    originalData,
    visibleData: safeData,
    selectedType,
    layoutMode,
    className,
  });

  const isHorizontal = selectedType === "horizontal_bar";

  const total = useMemo(
    () => safeData.reduce((sum, item) => sum + Number(item.value || 0), 0),
    [safeData]
  );

  const originalTotal = useMemo(
    () => originalData.reduce((sum, item) => sum + Number(item.value || 0), 0),
    [originalData]
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

  function updateEntryLimit(value) {
    setEntryLimit(value);
    saveChartEntryLimit(resolvedChartId, value);
  }

  function updateLayoutMode(value) {
    setLayoutMode(value);
    saveChartLayoutMode(resolvedChartId, value);
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

  const chartHeight = getAutoHeight({
    rowsCount: safeData.length,
    selectedType,
    isWide: isFullWidth,
    isHorizontal,
  });

  const shouldRotateAxis =
    selectedType === "line" ||
    selectedType === "area" ||
    selectedType === "composed" ||
    safeData.length > 8 ||
    averageLabelLength(safeData) > 12;

  const xAxisProps = {
    dataKey: "name",
    tick: {
      fontSize: safeData.length > 40 ? 8 : safeData.length > 25 ? 9 : 10,
    },
    tickFormatter: formatAxisLabel,
    interval: 0,
    minTickGap: 0,
    angle: shouldRotateAxis ? -42 : 0,
    textAnchor: shouldRotateAxis ? "end" : "middle",
    height: shouldRotateAxis ? 96 : 42,
  };

  const hiddenCount = Math.max(originalData.length - safeData.length, 0);

  const cardClassName = [
    "angel-card p-5 pdf-export-section",
    isFullWidth ? "xl:col-span-2" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClassName}>
      <div className="mb-5 grid gap-4 2xl:grid-cols-[minmax(260px,1fr)_auto] 2xl:items-start">
        <div className="min-w-0">
          <h3 className="text-lg font-black leading-tight text-slate-900">
            {title}
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {safeData.length ? (
              <>
                {safeData.length} shown from {originalData.length} records ·{" "}
                {total} visible count
                {hiddenCount > 0 ? ` · ${hiddenCount} hidden` : ""}
                {originalTotal !== total ? ` · ${originalTotal} total count` : ""}
              </>
            ) : (
              "No chart data available"
            )}
          </p>
        </div>

        <div className="no-print no-export flex flex-wrap items-center gap-2 2xl:justify-end">
          <select
            value={selectedType}
            onChange={(event) => updateChartType(event.target.value)}
            className="h-9 min-w-[150px] rounded-lg border border-slate-200 bg-white px-2 text-xs font-black uppercase text-slate-600 outline-none"
            title="Change chart type"
          >
            {CHART_TYPES.map((chartType) => (
              <option key={chartType.value} value={chartType.value}>
                {chartType.label}
              </option>
            ))}
          </select>

          <select
            value={entryLimit}
            onChange={(event) => updateEntryLimit(event.target.value)}
            className="h-9 min-w-[110px] rounded-lg border border-slate-200 bg-white px-2 text-xs font-black uppercase text-slate-600 outline-none"
            title="How many entries to show"
          >
            {ENTRY_LIMITS.map((limit) => (
              <option key={limit.value} value={limit.value}>
                {limit.label}
              </option>
            ))}
          </select>

          <select
            value={layoutMode}
            onChange={(event) => updateLayoutMode(event.target.value)}
            className="h-9 min-w-[122px] rounded-lg border border-slate-200 bg-white px-2 text-xs font-black uppercase text-slate-600 outline-none"
            title="Chart width"
          >
            {LAYOUT_MODES.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>

          {colors.slice(0, 6).map((color, index) => (
            <input
              key={`${color}-${index}`}
              type="color"
              value={color}
              onChange={(event) => updateColor(index, event.target.value)}
              className="h-9 w-9 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
              title={`Chart color ${index + 1}`}
            />
          ))}

          <button
            type="button"
            onClick={addColor}
            className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-500 hover:bg-slate-50"
          >
            +
          </button>

          <button
            type="button"
            onClick={resetColors}
            className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-500 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>
      </div>

      <div style={{ height: `${chartHeight}px` }}>
        {!safeData.length ? (
          <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">
            Upload CSV data to generate this chart.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {selectedType === "line" ? (
              <LineChart
                data={safeData}
                margin={{ top: 10, right: 28, bottom: 28, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis {...xAxisProps} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip chartTitle={title} />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={primary}
                  strokeWidth={3}
                  dot={{ r: safeData.length > 45 ? 2 : 4 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            ) : selectedType === "area" ? (
              <AreaChart
                data={safeData}
                margin={{ top: 10, right: 28, bottom: 28, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis {...xAxisProps} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
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
                  outerRadius={isFullWidth ? 150 : 112}
                  innerRadius={
                    selectedType === "donut" ? (isFullWidth ? 82 : 62) : 0
                  }
                  label={({ name, value }) =>
                    `${formatAxisLabel(name)}: ${value}`
                  }
                >
                  {safeData.map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={colors[index % colors.length] || primary}
                    />
                  ))}
                </Pie>

                {isFullWidth ? (
                  <Legend
                    iconSize={10}
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                  />
                ) : null}
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
              <ComposedChart
                data={safeData}
                margin={{ top: 10, right: 28, bottom: 28, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis {...xAxisProps} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip chartTitle={title} />} />
                <Bar dataKey="value" fill={primary} radius={[8, 8, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={colors[1] || "#d7ff00"}
                  strokeWidth={3}
                  dot={{ r: safeData.length > 45 ? 2 : 4 }}
                />
              </ComposedChart>
            ) : selectedType === "horizontal_bar" ? (
              <BarChart
                data={safeData}
                layout="vertical"
                margin={{
                  top: 10,
                  right: 28,
                  bottom: 12,
                  left: isFullWidth ? 110 : 65,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  width={isFullWidth ? 230 : 150}
                  tickFormatter={formatAxisLabel}
                  interval={0}
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
              <BarChart
                data={safeData}
                margin={{ top: 10, right: 28, bottom: 28, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis {...xAxisProps} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
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