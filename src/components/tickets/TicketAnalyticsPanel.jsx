import ChartPanel from "../dashboard/ChartPanel";
import SummaryTable from "../dashboard/SummaryTable";

export default function TicketAnalyticsPanel({ analytics, chartSettings }) {
  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <div>
          <p className="angel-mini-label">Ticket Charts</p>
          <h2 className="mt-2 angel-page-title">
            Date, Category and Procedure Reporting
          </h2>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <ChartPanel
            chartId="tickets_by_date"
            title="Tickets by Date"
            data={analytics.dailySummary}
            type={chartSettings.ticketDailyChart || "line"}
          />

          <ChartPanel
            chartId="tickets_by_month"
            title="Tickets by Month"
            data={analytics.monthlySummary}
            type={chartSettings.ticketMonthlyChart || "area"}
          />

          <ChartPanel
            chartId="support_category_breakdown"
            title="Support Category Breakdown"
            data={analytics.supportCategorySummary}
            type={chartSettings.ticketSupportChart || "composed"}
          />

          <ChartPanel
            chartId="product_category_breakdown"
            title="Product Category Breakdown"
            data={analytics.productCategorySummary}
            type={chartSettings.ticketProductCategoryChart || "bar"}
          />

          <ChartPanel
            chartId="procedure_breakdown"
            title="Procedure Breakdown"
            data={analytics.procedureSummary}
            type={chartSettings.ticketProcedureChart || "radial"}
          />

          <ChartPanel
            chartId="top_products_by_ticket_count"
            title="Top Products by Ticket Count"
            data={analytics.productSummary}
            type={chartSettings.ticketTopProductsChart || "composed"}
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