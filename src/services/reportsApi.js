import {
  apiGet,
} from "./apiClient";

export async function fetchReportsData({
  period,
  signal,
} = {}) {
  const response =
    await apiGet(
      "/reports",
      {
        query: {
          period,
        },

        signal,
      }
    );

  return response.data;
}