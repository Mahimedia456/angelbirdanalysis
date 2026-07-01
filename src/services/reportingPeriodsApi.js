import {
  apiGet,
  apiPatch,
  apiPost,
} from "./apiClient";

export async function fetchReportingPeriods(
  options = {}
) {
  const response = await apiGet(
    "/reporting-periods",
    options
  );

  return response.data || [];
}

export async function createReportingPeriod(
  payload
) {
  const response = await apiPost(
    "/reporting-periods",
    payload
  );

  return response.data;
}

export async function updateReportingPeriodStatus(
  periodId,
  status
) {
  const response = await apiPatch(
    `/reporting-periods/${periodId}/status`,
    {
      status,
    }
  );

  return response.data;
}