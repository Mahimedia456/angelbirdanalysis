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
          Good / Bad Ratings, Solved Status and Date Trends
        </h2>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartPanel
          chartId={`${prefix}_satisfaction_rating`}
          title="Good vs Bad Rating"
          data={analytics.ratingSummary}
          type={
            prefix === "report"
              ? chartSettings.reportSatisfactionRatingChart || "donut"
              : chartSettings.satisfactionRatingChart || "donut"
          }
        />

        <ChartPanel
          chartId={`${prefix}_satisfaction_solved_status`}
          title="Solved vs Not Solved"
          data={analytics.solvedSummary}
          type={
            prefix === "report"
              ? chartSettings.reportSatisfactionSolvedChart || "pie"
              : chartSettings.satisfactionSolvedChart || "pie"
          }
        />

        <ChartPanel
          className="xl:col-span-2"
          chartId={`${prefix}_satisfaction_daily_trend`}
          title="Date-wise Satisfaction Responses"
          data={analytics.dailySummary}
          type={
            prefix === "report"
              ? chartSettings.reportSatisfactionDailyChart || "line"
              : chartSettings.satisfactionDailyChart || "line"
          }
        />

        <ChartPanel
          className="xl:col-span-2"
          chartId={`${prefix}_satisfaction_reason_breakdown`}
          title="Satisfaction Reason Breakdown"
          data={analytics.reasonSummary}
          type={
            prefix === "report"
              ? chartSettings.reportSatisfactionReasonChart || "bar"
              : chartSettings.satisfactionReasonChart || "bar"
          }
        />

        <ChartPanel
          chartId={`${prefix}_satisfaction_comments`}
          title="Comments Availability"
          data={analytics.commentSummary}
          type={chartSettings.satisfactionCommentChart || "bar"}
        />

        <ChartPanel
          className="xl:col-span-2"
          chartId={`${prefix}_satisfaction_monthly_trend`}
          title="Monthly Satisfaction Responses"
          data={analytics.monthlySummary}
          type="area"
        />

        {showTables ? (
          <>
            <SummaryTable
              title="Rating Summary"
              data={analytics.ratingSummary}
            />

            <SummaryTable
              title="Reason Summary"
              data={analytics.reasonSummary}
            />

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