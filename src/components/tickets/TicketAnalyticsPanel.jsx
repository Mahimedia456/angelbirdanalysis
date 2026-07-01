import ChartPanel from "../dashboard/ChartPanel";
import SummaryTable from "../dashboard/SummaryTable";
import TicketReportTable from "./TicketReportTable";

export default function TicketAnalyticsPanel({
  analytics,
  chartSettings = {},
  prefix = "ticket",
  showTables = false,
}) {
  const safeAnalytics =
    analytics || {};

  const dailySummary =
    safeAnalytics.dailySummary ||
    [];

  const supportCategorySummary =
    safeAnalytics
      .supportCategorySummary ||
    [];

  const productCategorySummary =
    safeAnalytics
      .productCategorySummary ||
    [];

  const procedureSummary =
    safeAnalytics
      .procedureSummary ||
    [];

  const regionSummary =
    safeAnalytics
      .regionSummary ||
    [];

  const tseSummary =
    safeAnalytics
      .tseSummary ||
    [];

  const productSummary =
    safeAnalytics
      .productSummary ||
    [];

  const dataRecoveryTickets =
    safeAnalytics
      .dataRecoveryTickets ||
    [];

  const rmaTickets =
    safeAnalytics
      .rmaTickets ||
    [];

  const troubleshootTickets =
    safeAnalytics
      .troubleshootTickets ||
    [];

  const registrationTickets =
    safeAnalytics
      .registrationTickets ||
    [];

  const hardwareTickets =
    safeAnalytics
      .hardwareTickets ||
    [];

  const informationTickets =
    safeAnalytics
      .informationTickets ||
    [];

  const compatibilityTickets =
    safeAnalytics
      .compatibilityTickets ||
    [];

  const firmwareTickets =
    safeAnalytics
      .firmwareTickets ||
    [];

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-2">
        <ChartPanel
          className="xl:col-span-2"
          chartId={`${prefix}_ticket_daily_trend`}
          title="Date-wise Ticket Trend"
          data={dailySummary}
          type={
            chartSettings
              .ticketDailyChart ||
            "line"
          }
        />

        <ChartPanel
          chartId={`${prefix}_ticket_support_category`}
          title="Ticket Support Category"
          data={
            supportCategorySummary
          }
          type={
            chartSettings
              .ticketSupportChart ||
            "bar"
          }
        />

        <ChartPanel
          chartId={`${prefix}_ticket_product_category`}
          title="Ticket Product Category"
          data={
            productCategorySummary
          }
          type={
            chartSettings
              .ticketProductCategoryChart ||
            "bar"
          }
        />

        <ChartPanel
          chartId={`${prefix}_ticket_procedure`}
          title="Ticket Procedure"
          data={
            procedureSummary
          }
          type={
            chartSettings
              .ticketProcedureChart ||
            "bar"
          }
        />

        <ChartPanel
          chartId={`${prefix}_ticket_region`}
          title="Tickets by Region"
          data={regionSummary}
          type="bar"
        />

        <ChartPanel
          chartId={`${prefix}_ticket_tse`}
          title="Tickets by TSE"
          data={tseSummary}
          type="bar"
        />

        <ChartPanel
          className="xl:col-span-2"
          chartId={`${prefix}_ticket_product_count`}
          title="Top Products by Ticket Count"
          data={productSummary}
          type="bar"
        />
      </section>

      {showTables ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <SummaryTable
            title="Support Category Summary"
            data={
              supportCategorySummary
            }
          />

          <SummaryTable
            title="Product Category Summary"
            data={
              productCategorySummary
            }
          />

          <SummaryTable
            title="Procedure Summary"
            data={
              procedureSummary
            }
          />

          <SummaryTable
            title="Region Summary"
            data={
              regionSummary
            }
          />

          <SummaryTable
            title="TSE Summary"
            data={
              tseSummary
            }
          />

          <SummaryTable
            title="Product Ticket Count"
            data={
              productSummary
            }
          />
        </section>
      ) : null}

      {showTables ? (
        <section className="space-y-6">
          {dataRecoveryTickets.length ? (
            <TicketReportTable
              title="Data Recovery Tickets"
              tickets={
                dataRecoveryTickets
              }
            />
          ) : null}

          {rmaTickets.length ? (
            <TicketReportTable
              title="RMA Tickets"
              tickets={
                rmaTickets
              }
            />
          ) : null}

          {troubleshootTickets.length ? (
            <TicketReportTable
              title="Troubleshooting Tickets"
              tickets={
                troubleshootTickets
              }
            />
          ) : null}

          {registrationTickets.length ? (
            <TicketReportTable
              title="Registration Tickets"
              tickets={
                registrationTickets
              }
            />
          ) : null}

          {hardwareTickets.length ? (
            <TicketReportTable
              title="Hardware Tickets"
              tickets={
                hardwareTickets
              }
            />
          ) : null}

          {informationTickets.length ? (
            <TicketReportTable
              title="Information Tickets"
              tickets={
                informationTickets
              }
            />
          ) : null}

          {compatibilityTickets.length ? (
            <TicketReportTable
              title="Compatibility Tickets"
              tickets={
                compatibilityTickets
              }
            />
          ) : null}

          {firmwareTickets.length ? (
            <TicketReportTable
              title="Firmware Tickets"
              tickets={
                firmwareTickets
              }
            />
          ) : null}
        </section>
      ) : null}
    </div>
  );
}