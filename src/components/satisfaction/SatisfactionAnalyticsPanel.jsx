import ChartPanel from "../dashboard/ChartPanel";
import SummaryTable from "../dashboard/SummaryTable";

export default function SatisfactionAnalyticsPanel({
  analytics,
  chartSettings,
  prefix = "dashboard",
  showTables = false,
}) {
  return (
    <section className="space-y-6">
      <div className="pdf-export-section">
        <p className="angel-mini-label">Customer Satisfaction Charts</p>

        <h2 className="mt-2 angel-page-title">
          Good / Bad Ratings
        </h2>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartPanel
          chartId={`${prefix}_satisfaction_rating`}
          title="Good vs Bad Rating"
          data={analytics.ratingSummary}
          type="pie"
        />

        {showTables ? (
          <SummaryTable title="Rating Summary" data={analytics.ratingSummary} />
        ) : null}
      </div>
    </section>
  );
}
