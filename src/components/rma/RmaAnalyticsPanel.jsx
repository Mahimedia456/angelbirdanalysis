import ChartPanel from "../dashboard/ChartPanel";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatMonthLabel(value) {
  const raw = String(value ?? "").trim();

  if (!raw) return "Unknown";

  const iso = raw.match(/^(\d{4})-(\d{2})$/);

  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);

    if (month >= 1 && month <= 12) {
      return `${MONTH_NAMES[month - 1]} ${year}`;
    }
  }

  const slash = raw.match(/^(\d{1,2})\/(\d{2,4})$/);

  if (slash) {
    const month = Number(slash[1]);
    let year = Number(slash[2]);

    if (year < 100) year += 2000;

    if (month >= 1 && month <= 12) {
      return `${MONTH_NAMES[month - 1]} ${year}`;
    }
  }

  return raw;
}

function normalizeMonthSummary(data = []) {
  return data.map((item) => ({
    ...item,
    name: formatMonthLabel(item.name),
  }));
}

export default function RmaAnalyticsPanel({
  analytics,
  prefix = "rma",
}) {
  const safeAnalytics = analytics || {};
  const monthData = normalizeMonthSummary(safeAnalytics.byMonth || []);

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <ChartPanel
        chartId={`${prefix}_rma_by_region`}
        title="RMA by Region"
        data={safeAnalytics.byRegion || []}
        type="bar"
      />

      <ChartPanel
        chartId={`${prefix}_rma_by_type`}
        title="RMA Type"
        data={safeAnalytics.byRmaType || []}
        type="bar"
      />

      <ChartPanel
        className="xl:col-span-2"
        chartId={`${prefix}_rma_by_date`}
        title="Date-wise RMA"
        data={safeAnalytics.byDate || []}
        type="line"
      />

      <ChartPanel
        chartId={`${prefix}_rma_by_month`}
        title="Month-wise RMA"
        data={monthData}
        type="pie"
      />

      <ChartPanel
        chartId={`${prefix}_rma_by_tse`}
        title="RMA Team"
        data={safeAnalytics.byTse || []}
        type="pie"
      />

      <ChartPanel
        className="xl:col-span-2"
        chartId={`${prefix}_rma_by_product`}
        title="Top Products by RMA"
        data={safeAnalytics.byProduct || []}
        type="bar"
      />
    </section>
  );
}