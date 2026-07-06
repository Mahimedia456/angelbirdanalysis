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
          Good / Bad Ratings, Solved Status and Comment Availability
        </h2>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartPanel
          chartId={`${prefix}_satisfaction_rating`}
          title="Good vs Bad Rating"
          data={analytics.ratingSummary}
          type="pie"
        />

        <ChartPanel
          chartId={`${prefix}_satisfaction_solved_status`}
          title="Solved vs Not Solved"
          data={analytics.solvedSummary}
          type="pie"
        />

        <ChartPanel
          className="xl:col-span-2"
          chartId={`${prefix}_satisfaction_comments`}
          title="Comments Availability"
          data={analytics.commentSummary}
          type="pie"
        />

        {showTables ? (
          <>
            <SummaryTable title="Rating Summary" data={analytics.ratingSummary} />

            <SummaryTable
              title="Solved Status Summary"
              data={analytics.solvedSummary}
            />

            <SummaryTable
              title="Comment Availability Summary"
              data={analytics.commentSummary}
            />
          </>
        ) : null}
      </div>
    </section>
  );
}