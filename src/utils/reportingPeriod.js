const SELECTED_PERIOD_KEY =
  "angelbird_selected_reporting_period";

export function getSelectedReportingPeriod() {
  return (
    localStorage.getItem(
      SELECTED_PERIOD_KEY
    ) || ""
  );
}

export function saveSelectedReportingPeriod(
  periodKey
) {
  const cleanPeriodKey =
    String(
      periodKey || ""
    ).trim();

  if (!cleanPeriodKey) {
    localStorage.removeItem(
      SELECTED_PERIOD_KEY
    );

    return;
  }

  localStorage.setItem(
    SELECTED_PERIOD_KEY,
    cleanPeriodKey
  );
}

export function clearSelectedReportingPeriod() {
  localStorage.removeItem(
    SELECTED_PERIOD_KEY
  );
}

export function getPeriodYear(
  period
) {
  return Number(
    period?.report_year || 0
  );
}

export function getPeriodMonth(
  period
) {
  return Number(
    period?.report_month || 0
  );
}

export function getAvailableYears(
  periods = []
) {
  return [
    ...new Set(
      periods
        .map((period) =>
          Number(
            period.report_year
          )
        )
        .filter(Boolean)
    ),
  ].sort(
    (a, b) => b - a
  );
}

export function getPeriodsForYear(
  periods = [],
  year
) {
  return periods
    .filter(
      (period) =>
        Number(
          period.report_year
        ) === Number(year)
    )
    .sort(
      (a, b) =>
        Number(
          b.report_month
        ) -
        Number(
          a.report_month
        )
    );
}

export function findPeriodByKey(
  periods = [],
  periodKey
) {
  return (
    periods.find(
      (period) =>
        period.period_key ===
        periodKey
    ) || null
  );
}