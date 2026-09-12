import ChartPanel from "../dashboard/ChartPanel";

export default function RmaAnalyticsPanel({
  analytics,
  prefix = "rma",
}) {
  const safeAnalytics = analytics || {};

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <ChartPanel
        chartId={`${prefix}_rma_by_region`}
        title="RMA by Region"
        data={safeAnalytics.byRegion || []}
        type="horizontalBar"
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
        className="xl:col-span-2"
        chartId={`${prefix}_rma_by_product`}
        title="Products by RMA"
        data={safeAnalytics.byProduct || []}
        type="bar"
      />
    </section>
  );
}
