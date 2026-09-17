import ChartPanel from "../dashboard/ChartPanel";
import RmaMonthlyInsights from "./RmaMonthlyInsights";

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mb-4">
      <p className="angel-mini-label">{eyebrow}</p>
      <h3 className="mt-2 text-xl font-black tracking-[-0.03em] text-slate-950">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export default function RmaAnalyticsPanel({
  analytics,
  rows = [],
  prefix = "rma",
}) {
  const safeAnalytics = analytics || {};

  return (
    <section className="space-y-8">
      <div>
        <SectionHeading
          eyebrow="Timeline"
          title="Date-wise RMA"
          description="Daily RMA movement from the unique Ticket # records currently included by the active filters."
        />

        <ChartPanel
          chartId={`${prefix}_rma_by_date`}
          title="Date-wise RMA"
          data={safeAnalytics.byDate || []}
          type="line"
        />
      </div>

      <div>
        <SectionHeading
          eyebrow="Monthly Insights"
          title="RMA Monthly Performance"
          description="Monthly volume, RMA TYPE category mix, and issue movement are grouped together for faster trend reading."
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <ChartPanel
            chartId={`${prefix}_rma_month_wise_trend`}
            title="RMA Month-wise Trend"
            data={safeAnalytics.byMonth || []}
            type="line"
          />

          <RmaMonthlyInsights rows={rows} mode="overview" />
        </div>

        <div className="mt-6">
          <RmaMonthlyInsights rows={rows} mode="issues" />
        </div>
      </div>

      <div>
        <SectionHeading
          eyebrow="Issue & Warranty Analysis"
          title="Issue Distribution and Warranty Coverage"
          description="Compare the overall issue mix with warranty coverage for the same filtered RMA population."
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <ChartPanel
            chartId={`${prefix}_rma_overall_issues`}
            title="Overall Issues Distribution"
            data={safeAnalytics.byIssue || []}
            type="horizontalBar"
          />

          <ChartPanel
            chartId={`${prefix}_rma_warranty_status`}
            title="Warranty Status"
            data={safeAnalytics.byWarrantyStatus || []}
            type="donut"
          />
        </div>
      </div>

      <div>
        <SectionHeading
          eyebrow="RMA Classification"
          title="Region and RMA Type"
          description="Regional distribution and the dedicated RMA Sheet RMA TYPE classification are shown side by side."
        />

        <div className="grid gap-6 xl:grid-cols-2">
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
        </div>
      </div>

      <div>
        <SectionHeading
          eyebrow="Product Analysis"
          title="Products by RMA"
          description="Product 1 distribution across the final unique-ticket RMA dataset."
        />

        <ChartPanel
          chartId={`${prefix}_rma_by_product`}
          title="Products by RMA"
          data={safeAnalytics.byProduct || []}
          type="bar"
        />
      </div>
    </section>
  );
}
