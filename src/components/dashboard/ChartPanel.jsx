import {
  useMemo,
  useState,
} from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getChartColors,
} from "../../utils/storage";

const ENTRY_LIMITS = [
  {
    value: "10",
    label: "TOP 10",
  },
  {
    value: "25",
    label: "TOP 25",
  },
  {
    value: "50",
    label: "TOP 50",
  },
  {
    value: "all",
    label: "ALL",
  },
];

const ENTRY_LIMITS_STORAGE_KEY =
  "angelbird_chart_entry_limits";

function makeChartId(title = "") {
  return String(title)
    .trim()
    .toLowerCase()
    .replace(/[^\w]+/g, "_")
    .replace(/^_|_$/g, "");
}

function readLocalObject(key) {
  try {
    return JSON.parse(
      localStorage.getItem(key) ||
        "{}"
    );
  } catch {
    return {};
  }
}

function saveLocalObject(
  key,
  value
) {
  localStorage.setItem(
    key,
    JSON.stringify(value || {})
  );
}

function getChartEntryLimit(
  chartId
) {
  const limits =
    readLocalObject(
      ENTRY_LIMITS_STORAGE_KEY
    );

  return (
    limits[chartId] ||
    "10"
  );
}

function saveChartEntryLimit(
  chartId,
  limit
) {
  const limits =
    readLocalObject(
      ENTRY_LIMITS_STORAGE_KEY
    );

  limits[chartId] =
    limit || "10";

  saveLocalObject(
    ENTRY_LIMITS_STORAGE_KEY,
    limits
  );
}

function formatAxisLabel(
  value = ""
) {
  const text = String(
    value || ""
  );

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      text
    )
  ) {
    const [
      ,
      month,
      day,
    ] = text.split("-");

    return `${day}/${month}`;
  }

  if (
    /^\d{4}-\d{2}$/.test(
      text
    )
  ) {
    const [
      year,
      month,
    ] = text.split("-");

    return `${month}/${year.slice(
      2
    )}`;
  }

  if (text.length > 22) {
    return `${text.slice(
      0,
      22
    )}…`;
  }

  return text;
}

function isDateLikeLabel(
  value = ""
) {
  const text = String(
    value || ""
  );

  return (
    /^\d{4}-\d{2}-\d{2}$/.test(
      text
    ) ||
    /^\d{4}-\d{2}$/.test(
      text
    )
  );
}

function sortDataForChart(
  rows = []
) {
  const list =
    Array.isArray(rows)
      ? [...rows]
      : [];

  if (!list.length) {
    return [];
  }

  const hasDateLabels =
    list.some((item) =>
      isDateLikeLabel(
        item?.name
      )
    );

  if (hasDateLabels) {
    return list.sort(
      (a, b) =>
        String(
          a.name || ""
        ).localeCompare(
          String(
            b.name || ""
          )
        )
    );
  }

  return list.sort(
    (a, b) =>
      Number(
        b.value || 0
      ) -
      Number(
        a.value || 0
      )
  );
}

function limitData(
  rows = [],
  limit = "10"
) {
  const list =
    sortDataForChart(rows);

  if (limit === "all") {
    return list;
  }

  const numericLimit =
    Number(limit || 10);

  return list.slice(
    0,
    Number.isFinite(
      numericLimit
    )
      ? numericLimit
      : 10
  );
}

function averageLabelLength(
  rows = []
) {
  if (!rows.length) {
    return 0;
  }

  const total = rows.reduce(
    (sum, item) =>
      sum +
      String(
        item?.name || ""
      ).length,
    0
  );

  return (
    total / rows.length
  );
}

function getChartHeight({
  rowsCount,
  type,
  fullWidth,
}) {
  const count = Number(
    rowsCount || 0
  );

  if (!count) {
    return 360;
  }

  if (
    type === "pie" ||
    type === "donut"
  ) {
    return fullWidth
      ? 460
      : 410;
  }

  if (type === "line") {
    if (count > 40) {
      return 520;
    }

    if (count > 20) {
      return 470;
    }

    return fullWidth
      ? 430
      : 390;
  }

  if (count > 35) {
    return 560;
  }

  if (count > 20) {
    return 500;
  }

  return fullWidth
    ? 430
    : 390;
}

function CustomTooltip({
  active,
  payload,
  label,
  chartTitle,
}) {
  if (
    !active ||
    !payload?.length
  ) {
    return null;
  }

  const item = payload[0];

  const row =
    item?.payload || {};

  const name =
    row.name ||
    item?.name ||
    label ||
    "Item";

  const value = Number(
    row.value ??
      item?.value ??
      0
  );

  return (
    <div className="min-w-[220px] rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        {chartTitle}
      </p>

      <p className="mt-2 text-sm font-black text-slate-900">
        {name}
      </p>

      <div className="mt-3 rounded-xl bg-slate-50 p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
          Count
        </p>

        <p className="mt-1 text-2xl font-black text-slate-900">
          {value.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function renderPieLabel({
  cx,
  cy,
  midAngle,
  outerRadius,
  name,
  value,
}) {
  const RADIAN =
    Math.PI / 180;

  const radius =
    Number(outerRadius || 0) +
    30;

  const x =
    Number(cx || 0) +
    radius *
      Math.cos(
        -midAngle * RADIAN
      );

  const y =
    Number(cy || 0) +
    radius *
      Math.sin(
        -midAngle * RADIAN
      );

  return (
    <text
      x={x}
      y={y}
      fill="#000000"
      textAnchor={
        x >
        Number(cx || 0)
          ? "start"
          : "end"
      }
      dominantBaseline="central"
      fontSize={11}
      fontWeight={800}
    >
      {`${formatAxisLabel(
        name
      )}: ${Number(
        value || 0
      ).toLocaleString()}`}
    </text>
  );
}

export default function ChartPanel({
  title,
  data = [],
  type = "bar",
  chartId,
  className = "",
}) {
  const resolvedChartId =
    chartId ||
    makeChartId(title);

  const savedLimit =
    getChartEntryLimit(
      resolvedChartId
    );

  const [
    entryLimit,
    setEntryLimit,
  ] = useState(
    savedLimit || "10"
  );

  const colors =
    getChartColors();

  const originalData =
    useMemo(() => {
      return Array.isArray(
        data
      )
        ? data
        : [];
    }, [data]);

  const safeData =
    useMemo(() => {
      return limitData(
        originalData,
        entryLimit
      );
    }, [
      originalData,
      entryLimit,
    ]);

  const fullWidth =
    className.includes(
      "xl:col-span-2"
    ) ||
    className.includes(
      "col-span-2"
    ) ||
    className.includes(
      "full"
    );

  const total =
    useMemo(
      () =>
        safeData.reduce(
          (sum, item) =>
            sum +
            Number(
              item.value || 0
            ),
          0
        ),
      [safeData]
    );

  const originalTotal =
    useMemo(
      () =>
        originalData.reduce(
          (sum, item) =>
            sum +
            Number(
              item.value || 0
            ),
          0
        ),
      [originalData]
    );

  function updateEntryLimit(
    value
  ) {
    setEntryLimit(value);

    saveChartEntryLimit(
      resolvedChartId,
      value
    );
  }

  const primary =
    colors[0] ||
    "#2f3d46";

  const chartHeight =
    getChartHeight({
      rowsCount:
        safeData.length,
      type,
      fullWidth,
    });

  const shouldRotateAxis =
    type === "line" ||
    safeData.length > 8 ||
    averageLabelLength(
      safeData
    ) > 12;

  const xAxisProps = {
    dataKey: "name",

    tick: {
      fontSize:
        safeData.length > 40
          ? 8
          : safeData.length >
            25
          ? 9
          : 10,

      fill: "#334155",
    },

    tickFormatter:
      formatAxisLabel,

    interval: 0,

    minTickGap: 0,

    angle:
      shouldRotateAxis
        ? -42
        : 0,

    textAnchor:
      shouldRotateAxis
        ? "end"
        : "middle",

    height:
      shouldRotateAxis
        ? 96
        : 42,
  };

  const hiddenCount =
    Math.max(
      originalData.length -
        safeData.length,
      0
    );

  const cardClassName = [
    "angel-card p-5 pdf-export-section",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const isDonut =
    type === "donut";

  return (
    <div
      className={
        cardClassName
      }
    >
      <div className="mb-5 grid gap-4 2xl:grid-cols-[minmax(260px,1fr)_auto] 2xl:items-start">
        <div className="min-w-0">
          <h3 className="text-lg font-black leading-tight text-slate-900">
            {title}
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {safeData.length ? (
              <>
                {
                  safeData.length
                }{" "}
                shown from{" "}
                {
                  originalData.length
                }{" "}
                records ·{" "}
                {total.toLocaleString()}{" "}
                visible count
                {hiddenCount > 0
                  ? ` · ${hiddenCount} hidden`
                  : ""}
                {originalTotal !==
                total
                  ? ` · ${originalTotal.toLocaleString()} total count`
                  : ""}
              </>
            ) : (
              "No chart data available"
            )}
          </p>
        </div>

        <div className="no-print no-export flex flex-wrap items-center gap-2 2xl:justify-end">
          <select
            value={entryLimit}
            onChange={(
              event
            ) =>
              updateEntryLimit(
                event.target.value
              )
            }
            className="h-9 min-w-[110px] rounded-lg border border-slate-200 bg-white px-2 text-xs font-black uppercase text-slate-600 outline-none"
            title="How many entries to show"
          >
            {ENTRY_LIMITS.map(
              (limit) => (
                <option
                  key={
                    limit.value
                  }
                  value={
                    limit.value
                  }
                >
                  {limit.label}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      <div
        style={{
          height: `${chartHeight}px`,
        }}
      >
        {!safeData.length ? (
          <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">
            Upload CSV data to
            generate this chart.
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            {type === "line" ? (
              <LineChart
                data={safeData}
                margin={{
                  top: 10,
                  right: 28,
                  bottom: 28,
                  left: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                />

                <XAxis
                  {...xAxisProps}
                />

                <YAxis
                  tick={{
                    fontSize: 11,
                    fill: "#334155",
                  }}
                  allowDecimals={
                    false
                  }
                />

                <Tooltip
                  content={
                    <CustomTooltip
                      chartTitle={
                        title
                      }
                    />
                  }
                />

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={primary}
                  strokeWidth={3}
                  dot={{
                    r:
                      safeData.length >
                      45
                        ? 2
                        : 4,
                  }}
                  activeDot={{
                    r: 7,
                  }}
                />
              </LineChart>
            ) : type === "pie" ||
              type === "donut" ? (
              <PieChart>
                <Tooltip
                  content={
                    <CustomTooltip
                      chartTitle={
                        title
                      }
                    />
                  }
                />

                <Pie
                  data={safeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={
                    fullWidth
                      ? 150
                      : 112
                  }
                  innerRadius={
                    isDonut
                      ? fullWidth
                        ? 82
                        : 62
                      : 0
                  }
                  labelLine={{
                    stroke:
                      "#000000",
                    strokeWidth: 1,
                  }}
                  label={
                    renderPieLabel
                  }
                >
                  {safeData.map(
                    (
                      entry,
                      index
                    ) => (
                      <Cell
                        key={`${entry.name}-${index}`}
                        fill={
                          colors[
                            index %
                              colors.length
                          ] ||
                          primary
                        }
                      />
                    )
                  )}
                </Pie>
              </PieChart>
            ) : (
              <BarChart
                data={safeData}
                margin={{
                  top: 10,
                  right: 28,
                  bottom: 28,
                  left: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                />

                <XAxis
                  {...xAxisProps}
                />

                <YAxis
                  tick={{
                    fontSize: 11,
                    fill: "#334155",
                  }}
                  allowDecimals={
                    false
                  }
                />

                <Tooltip
                  content={
                    <CustomTooltip
                      chartTitle={
                        title
                      }
                    />
                  }
                />

                <Bar
                  dataKey="value"
                  radius={[
                    8,
                    8,
                    0,
                    0,
                  ]}
                >
                  {safeData.map(
                    (
                      entry,
                      index
                    ) => (
                      <Cell
                        key={`${entry.name}-${index}`}
                        fill={
                          colors[
                            index %
                              colors.length
                          ] ||
                          primary
                        }
                      />
                    )
                  )}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}