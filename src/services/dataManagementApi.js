import {
  apiRequest,
} from "./apiClient";

export async function deleteSelectedPeriodData(
  periodKey
) {
  const cleanPeriodKey =
    String(
      periodKey || ""
    ).trim();

  if (!cleanPeriodKey) {
    throw new Error(
      "Reporting period is required."
    );
  }

  const response =
    await apiRequest(
      `/data-management/period/${encodeURIComponent(
        cleanPeriodKey
      )}`,
      {
        method: "DELETE",

        /*
         * Backend safety confirmation automatic hai.
         * User ko phrase type nahi karna.
         */
        body: {
          confirmation:
            `DELETE ${cleanPeriodKey}`,
        },
      }
    );

  return response.data;
}