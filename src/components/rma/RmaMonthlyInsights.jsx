import { useMemo } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getChartColors } from "../../utils/storage";

function cleanText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeMonth(value) {
  const raw = cleanText(value);
  const match = raw.match(/^(\d{4})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}` : "";
}

function formatMonth(value) {
  const raw = cleanText(value);
  const match = raw.match(/^(\d{4})-(\d{2})$/);

  if (!match) return raw;

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const monthIndex = Number(match[2]) - 1;
  const month = monthNames[monthIndex] || match[2];
  return `${month} ${match[1].slice(2)}`;
}

function makeSeriesKey(label, index) {
  return `series_${index}_${String(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")}`;
}

function buildMonthlyDataset(rows = [], getCategory) {
  const categoryTotals = new Map();
  const monthBuckets = new Map();

  rows.forEach((row) => {
    const month = normalizeMonth(row?.date);
    const category = cleanText(getCategory(row));

    if (!month || !category) return;

    categoryTotals.set(
      category,
      (categoryTotals.get(category) || 0) + 1
    );

    if (!monthBuckets.has(month)) {
      monthBuckets.set(month, new Map());
    }

    const bucket = monthBuckets.get(month);
    bucket.set(category, (bucket.get(category) || 0) + 1);
  });

  const labels = Array.from(categoryTotals.entries())
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
    .map(([label]) => label);

  const series = labels.map((label, index) => ({
    label,
    key: makeSeriesKey(label, index),
    total: Number(categoryTotals.get(label) || 0),
  }));

  const data = Array.from(monthBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, bucket]) => {
      const item = {
        month,
        monthLabel: formatMonth(month),
        total: 0,
      };

      series.forEach(({ label, key }) => {
        const value = Number(bucket.get(label) || 0);
        item[key] = value;
        item.total += value;
      });

      return item;
    });

  return { data, series };
}

function buildIssueHeatmap(rows = []) {
  const monthSet = new Set();
  const issueTotals = new Map();
  const values = new Map();

  rows.forEach((row) => {
    const month = normalizeMonth(row?.date);
    const issue = cleanText(row?.issues || row?.issue);

    if (!month || !issue) return;

    monthSet.add(month);
    issueTotals.set(issue, (issueTotals.get(issue) || 0) + 1);

    const key = `${issue}|||${month}`;
    values.set(key, (values.get(key) || 0) + 1);
  });

  const months = Array.from(monthSet).sort((a, b) => a.localeCompare(b));
  const issues = Array.from(issueTotals.entries())
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
    .map(([name, total]) => ({ name, total: Number(total || 0) }));

  let maxValue = 0;
  values.forEach((value) => {
    maxValue = Math.max(maxValue, Number(value || 0));
  });

  return {
    months,
    issues,
    maxValue,
    getValue(issue, month) {
      return Number(values.get(`${issue}|||${month}`) || 0);
    },
  };
}

function MonthlyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const visible = payload
    .filter((entry) => Number(entry?.value || 0) > 0)
    .sort((a, b) => Number(b.value || 0) - Number(a.value || 0));

  return (
    <div className="min-w-[230px] rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
        {formatMonth(label)}
      </p>

      <div className="mt-3 space-y-2">
        {visible.map((entry) => (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-5 text-sm"
          >
            <span className="font-bold text-slate-600">{entry.name}</span>
            <span className="font-black text-slate-950">
              {Number(entry.value || 0).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex h-[360px] items-center justify-center rounded-2xl bg-slate-50 px-6 text-center text-sm font-bold text-slate-400">
      {message}
    </div>
  );
}

function IssueHeatmap({ rows = [] }) {
  const heatmap = useMemo(
    () => buildIssueHeatmap(Array.isArray(rows) ? rows : []),
    [rows]
  );

  if (!heatmap.months.length || !heatmap.issues.length) {
    return (
      <EmptyChart message='No issue trend data yet. Add values in the RMA Sheet column named "Issues".' />
    );
  }

  const gridTemplateColumns = `minmax(190px, 1.8fr) repeat(${heatmap.months.length}, minmax(72px, 1fr)) minmax(70px, 0.7fr)`;

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <div className="min-w-[760px] p-3">
        <div
          className="grid items-center gap-2"
          style={{ gridTemplateColumns }}
        >
          <div className="px-2 py-2 text-xs font-black uppercase tracking-[0.15em] text-slate-400">
            Issue
          </div>

          {heatmap.months.map((month) => (
            <div
              key={month}
              className="px-1 py-2 text-center text-xs font-black text-slate-500"
            >
              {formatMonth(month)}
            </div>
          ))}

          <div className="px-1 py-2 text-center text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            Total
          </div>

          {heatmap.issues.map((issue) => (
            <div key={issue.name} className="contents">
              <div className="truncate rounded-xl bg-slate-50 px-3 py-3 text-sm font-extrabold text-slate-700" title={issue.name}>
                {issue.name}
              </div>

              {heatmap.months.map((month) => {
                const value = heatmap.getValue(issue.name, month);
                const intensity = heatmap.maxValue
                  ? value / heatmap.maxValue
                  : 0;
                const alpha = value ? 0.16 + intensity * 0.72 : 0.04;

                return (
                  <div
                    key={`${issue.name}-${month}`}
                    className="flex min-h-11 items-center justify-center rounded-xl border border-slate-100 text-sm font-black text-slate-900 transition-transform hover:scale-[1.03]"
                    style={{
                      backgroundColor: value
                        ? `rgba(197, 255, 0, ${alpha})`
                        : "rgba(241, 245, 249, 0.85)",
                    }}
                    title={`${issue.name} • ${formatMonth(month)} • ${value.toLocaleString()}`}
                  >
                    {value ? value.toLocaleString() : "—"}
                  </div>
                );
              })}

              <div className="flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-2 text-sm font-black text-white">
                {issue.total.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
        Darker lime cells mean a higher issue count for that month. Rows are ordered by overall issue volume.
      </div>
    </div>
  );
}

export default function RmaMonthlyInsights({ rows = [], mode = "all" }) {
  const colors = getChartColors();

  const typeDataset = useMemo(
    () =>
      buildMonthlyDataset(
        Array.isArray(rows) ? rows : [],
        (row) => row?.rmaType
      ),
    [rows]
  );

  const showOverview = mode === "all" || mode === "overview";
  const showIssues = mode === "all" || mode === "issues";

  return (
    <>
      {showOverview ? (
        <section className="angel-card p-5 pdf-export-section">
          <div className="mb-5">
            <p className="angel-mini-label">Monthly Overview</p>
            <h3 className="mt-2 text-lg font-black text-slate-900">
              Monthly RMA Overview — Category Wise
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Month-by-month RMA category mix using every non-empty value from the dedicated RMA Sheet tab RMA TYPE column.
            </p>
          </div>

          {!typeDataset.data.length ? (
            <EmptyChart message="No monthly RMA category data available." />
          ) : (
            <div className="h-[430px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={typeDataset.data}
                  margin={{ top: 10, right: 24, bottom: 22, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={formatMonth}
                    tick={{ fontSize: 11, fill: "#334155" }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#334155" }}
                  />
                  <Tooltip content={<MonthlyTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />

                  {typeDataset.series.map((item, index) => (
                    <Bar
                      key={item.key}
                      dataKey={item.key}
                      name={item.label}
                      stackId="rma-month"
                      fill={colors[index % colors.length] || "#2f3d46"}
                      radius={
                        index === typeDataset.series.length - 1
                          ? [6, 6, 0, 0]
                          : 0
                      }
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      ) : null}

      {showIssues ? (
        <section className="angel-card p-5 pdf-export-section">
          <div className="mb-5">
            <p className="angel-mini-label">Trend Analysis</p>
            <h3 className="mt-2 text-lg font-black text-slate-900">
              Trending Issues by Month
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Heatmap view keeps every issue readable: compare monthly counts without overlapping lines or a crowded legend.
            </p>
          </div>

          <IssueHeatmap rows={rows} />
        </section>
      ) : null}
    </>
  );
}
