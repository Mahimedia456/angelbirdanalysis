import { supabaseAdmin } from "../config/supabase.js";

async function getCount(
  tableName,
  periodId
) {
  const {
    count,
    error,
  } = await supabaseAdmin
    .from(tableName)
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("period_id", periodId);

  if (error) {
    throw error;
  }

  return Number(count || 0);
}

export async function getHomeOverview(
  request,
  response,
  next
) {
  try {
    const requestedPeriodKey = String(
      request.query.period || ""
    ).trim();

    const {
      data: periods,
      error: periodsError,
    } = await supabaseAdmin
      .from("reporting_periods")
      .select(`
        id,
        report_year,
        report_month,
        period_key,
        period_name,
        period_start,
        period_end,
        status
      `)
      .order("report_year", {
        ascending: false,
      })
      .order("report_month", {
        ascending: false,
      });

    if (periodsError) {
      throw periodsError;
    }

    const safePeriods = periods || [];

    const selectedPeriod =
      safePeriods.find(
        (period) =>
          period.period_key ===
          requestedPeriodKey
      ) ||
      safePeriods[0] ||
      null;

    if (!selectedPeriod) {
      return response.json({
        success: true,

        data: {
          selectedPeriod: null,
          periods: [],
          periodSummary: {
            ticketCount: 0,
            productCount: 0,
            satisfactionCount: 0,
            importBatchCount: 0,
          },
        },
      });
    }

    const [
      ticketCount,
      productCount,
      satisfactionCount,
      importBatchCount,
    ] = await Promise.all([
      getCount(
        "ticket_records",
        selectedPeriod.id
      ),

      getCount(
        "product_records",
        selectedPeriod.id
      ),

      getCount(
        "satisfaction_records",
        selectedPeriod.id
      ),

      getCount(
        "import_batches",
        selectedPeriod.id
      ),
    ]);

    return response.json({
      success: true,

      data: {
        selectedPeriod,
        periods: safePeriods,

        periodSummary: {
          periodId: selectedPeriod.id,
          periodKey:
            selectedPeriod.period_key,
          periodName:
            selectedPeriod.period_name,

          ticketCount,
          productCount,
          satisfactionCount,
          importBatchCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}