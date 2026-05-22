import ChartPanel from "../dashboard/ChartPanel";
import SummaryTable from "../dashboard/SummaryTable";

export default function TicketAnalyticsPanel({
  analytics,
  chartSettings,
  showTables = false,
  prefix = "dashboard",
}) {
  return (
    <section className="space-y-6">
      <div className="pdf-export-section">
        <p className="angel-mini-label">Ticket Charts</p>
        <h2 className="mt-2 angel-page-title">
          Date, Category, Product and Procedure Reporting
        </h2>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartPanel
          className="xl:col-span-2"
          chartId={`${prefix}_ticket_date_wise_trend`}
          title="Date-wise Ticket Trend"
          data={analytics.dailySummary}
          type={
            prefix === "report"
              ? chartSettings.reportDateTrendChart || "line"
              : chartSettings.ticketDailyChart || "line"
          }
        />

        <ChartPanel
          className="xl:col-span-2"
          chartId={`${prefix}_ticket_monthly_trend`}
          title="Monthly Ticket Trend"
          data={analytics.monthlySummary}
          type={chartSettings.ticketMonthlyChart || "area"}
        />

        <ChartPanel
          chartId={`${prefix}_ticket_support_category`}
          title="Support Category Report"
          data={analytics.supportCategorySummary}
          type={
            prefix === "report"
              ? chartSettings.reportSupportChart || "area"
              : chartSettings.ticketSupportChart || "composed"
          }
        />

        <ChartPanel
          chartId={`${prefix}_ticket_product_category`}
          title="Product Category Report"
          data={analytics.productCategorySummary}
          type={
            prefix === "report"
              ? chartSettings.reportProductCategoryChart || "bar"
              : chartSettings.ticketProductCategoryChart || "bar"
          }
        />

        <ChartPanel
          className="xl:col-span-2"
          chartId={`${prefix}_ticket_procedure`}
          title="Procedure Report"
          data={analytics.procedureSummary}
          type={
            prefix === "report"
              ? chartSettings.reportProcedureChart || "bar"
              : chartSettings.ticketProcedureChart || "radial"
          }
        />

        <ChartPanel
          chartId={`${prefix}_ticket_region`}
          title="Region Report"
          data={analytics.regionSummary}
          type="bar"
        />

        <ChartPanel
          chartId={`${prefix}_ticket_tse`}
          title="TSE / Agent Report"
          data={analytics.tseSummary}
          type="bar"
        />

        <ChartPanel
          className="xl:col-span-2"
          chartId={`${prefix}_ticket_top_products`}
          title="Top Products by Ticket Count"
          data={analytics.productSummary}
          type={chartSettings.ticketTopProductsChart || "composed"}
        />

        {showTables ? (
          <>
            <SummaryTable
              title="Support Category Summary"
              data={analytics.supportCategorySummary}
            />

            <SummaryTable
              title="Product Category Summary"
              data={analytics.productCategorySummary}
            />

            <SummaryTable
              title="Procedure Summary"
              data={analytics.procedureSummary}
            />

            <SummaryTable
              title="Region Summary"
              data={analytics.regionSummary}
            />

            <SummaryTable
              title="TSE / Agent Summary"
              data={analytics.tseSummary}
            />

            <SummaryTable
              title="Top Products Summary"
              data={analytics.productSummary}
            />
          </>
        ) : null}
      </div>
    </section>
  );
}