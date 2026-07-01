import {
  apiGet,
} from "./apiClient";

export async function fetchDashboardData({
  period,
  signal,
} = {}) {
  const response =
    await apiGet(
      "/dashboard",
      {
        query: {
          period,
        },

        signal,
      }
    );

  return response.data;
}