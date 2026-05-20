import ChartPanel from "../dashboard/ChartPanel";
import SummaryTable from "../dashboard/SummaryTable";
import ComparisonCards from "../dashboard/ComparisonCards";

export default function TicketAnalyticsPanel({ analytics, chartSettings }) {
  return (
    <div className="space-y-8">
      <ComparisonCards
        title="Current Period vs Previous Period"
        items={analytics.comparison?.items || []}
      />

      <section className="space-y-5">
        <div>
          <p className="angel-mini-label">Ticket Charts</p>
          <h2 className="mt-2 angel-page-title">
            Date, Category and Procedure Reporting
          </h2>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <ChartPanel
            title="Tickets by Date"
            data={analytics.dailySummary}
            type={chartSettings.ticketDailyChart || "line"}
          />

          <ChartPanel
            title="Tickets by Month"
            data={analytics.monthlySummary}
            type="area"
          />

          <ChartPanel
            title="Support Category Breakdown"
            data={analytics.supportCategorySummary}
            type={chartSettings.ticketSupportChart || "bar"}
          />

          <ChartPanel
            title="Product Category Breakdown"
            data={analytics.productCategorySummary}
            type={chartSettings.ticketProductCategoryChart || "bar"}
          />

          <ChartPanel
            title="Procedure Breakdown"
            data={analytics.procedureSummary}
            type={chartSettings.ticketProcedureChart || "bar"}
          />

          <ChartPanel
            title="Top Products by Ticket Count"
            data={analytics.productSummary}
            type="bar"
          />
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <p className="angel-mini-label">Comparison Charts</p>
          <h2 className="mt-2 angel-page-title">
            Current vs Previous Breakdown
          </h2>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <ChartPanel
            title="Support Category Comparison"
            data={analytics.supportCategoryComparison}
            type="bar"
          />

          <ChartPanel
            title="Product Category Comparison"
            data={analytics.productCategoryComparison}
            type="bar"
          />

          <ChartPanel
            title="Procedure Comparison"
            data={analytics.procedureComparison}
            type="bar"
          />

          <ChartPanel
            title="Region Comparison"
            data={analytics.regionComparison}
            type="bar"
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
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
          title="TSE Summary"
          data={analytics.tseSummary}
        />

        <SummaryTable
          title="Top Products"
          data={analytics.productSummary}
        />
      </section>
    </div>
  );
}