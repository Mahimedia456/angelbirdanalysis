import {
  supabaseAdmin,
} from "../config/supabase.js";

async function getCount(tableName) {
  const { count, error } = await supabaseAdmin
    .from(tableName)
    .select("*", {
      count: "exact",
      head: true,
    });

  if (error) {
    throw error;
  }

  return Number(count || 0);
}

export async function getHomeOverview(request, response, next) {
  try {
    const [
      ticketCount,
      satisfactionCount,
      importBatchCount,
    ] = await Promise.all([
      getCount("ticket_records"),
      getCount("satisfaction_records"),
      getCount("import_batches"),
    ]);

    return response.json({
      success: true,
      data: {
        selectedPeriod: null,
        periods: [],
        periodSummary: {
          periodId: null,
          periodKey: "",
          periodName: "All Uploaded Data",
          ticketCount,
          productCount: 0,
          satisfactionCount,
          importBatchCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}