import {
  supabaseAdmin,
} from "../config/supabase.js";

const PERIOD_SELECT = `
  id,
  report_year,
  report_month,
  period_key,
  period_name,
  period_start,
  period_end,
  status,
  notes,
  created_at,
  updated_at
`;

export function getCurrentReportingPeriodValues() {
  const now = new Date();

  const reportYear =
    now.getUTCFullYear();

  const reportMonth =
    now.getUTCMonth() + 1;

  const periodKey =
    `${reportYear}-${String(
      reportMonth
    ).padStart(2, "0")}`;

  return {
    reportYear,
    reportMonth,
    periodKey,
  };
}

export async function ensureCurrentReportingPeriod({
  createdBy = null,
} = {}) {
  const {
    reportYear,
    reportMonth,
    periodKey,
  } =
    getCurrentReportingPeriodValues();

  const {
    data: existingPeriod,
    error: findError,
  } = await supabaseAdmin
    .from("reporting_periods")
    .select(PERIOD_SELECT)
    .eq(
      "period_key",
      periodKey
    )
    .maybeSingle();

  if (findError) {
    throw findError;
  }

  if (existingPeriod) {
    return existingPeriod;
  }

  const insertPayload = {
    report_year:
      reportYear,

    report_month:
      reportMonth,

    status:
      "open",

    notes:
      null,
  };

  if (createdBy) {
    insertPayload.created_by =
      createdBy;
  }

  const {
    data: createdPeriod,
    error: insertError,
  } = await supabaseAdmin
    .from("reporting_periods")
    .insert(insertPayload)
    .select(PERIOD_SELECT)
    .single();

  /*
   * Agar do requests same waqt current month
   * create karne ki koshish karein.
   */
  if (
    insertError?.code ===
    "23505"
  ) {
    const {
      data: concurrentPeriod,
      error: concurrentError,
    } = await supabaseAdmin
      .from(
        "reporting_periods"
      )
      .select(PERIOD_SELECT)
      .eq(
        "period_key",
        periodKey
      )
      .single();

    if (concurrentError) {
      throw concurrentError;
    }

    return concurrentPeriod;
  }

  if (insertError) {
    throw insertError;
  }

  return createdPeriod;
}