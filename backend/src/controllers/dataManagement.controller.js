import {
  supabaseAdmin,
} from "../config/supabase.js";

async function deleteAllFromTable(tableName) {
  const { error } = await supabaseAdmin
    .from(tableName)
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    throw error;
  }
}

async function deleteByPeriodId(tableName, periodId) {
  const { error } = await supabaseAdmin
    .from(tableName)
    .delete()
    .eq("period_id", periodId);

  if (error) {
    throw error;
  }
}

async function getPeriodByKey(periodKey) {
  const { data, error } = await supabaseAdmin
    .from("reporting_periods")
    .select("id, period_key, period_name")
    .eq("period_key", periodKey)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

export async function deletePeriodData(request, response, next) {
  try {
    const periodKey = String(
      request.params.periodKey ||
        request.params.period ||
        request.query.period ||
        request.body?.periodKey ||
        ""
    ).trim();

    if (!periodKey) {
      return response.status(400).json({
        success: false,
        message: "Period key is required.",
      });
    }

    if (periodKey === "all") {
      await Promise.all([
        deleteAllFromTable("ticket_records"),
        deleteAllFromTable("satisfaction_records"),
        deleteAllFromTable("import_batches"),
      ]);

      return response.json({
        success: true,
        message: "All uploaded data deleted successfully.",
        data: {
          deleted: true,
          scope: "all",
        },
      });
    }

    const period = await getPeriodByKey(periodKey);

    if (!period) {
      return response.status(404).json({
        success: false,
        message: "Reporting period not found.",
      });
    }

    await Promise.all([
      deleteByPeriodId("ticket_records", period.id),
      deleteByPeriodId("satisfaction_records", period.id),
      deleteByPeriodId("import_batches", period.id),
    ]);

    return response.json({
      success: true,
      message: `${period.period_name || period.period_key} data deleted successfully.`,
      data: {
        deleted: true,
        scope: "period",
        period,
      },
    });
  } catch (error) {
    next(error);
  }
}

export const deleteSelectedPeriodData = deletePeriodData;