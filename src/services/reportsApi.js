import {
  apiGet,
} from "./apiClient";

export async function fetchReportsData({
  signal,
} = {}) {
  const response = await apiGet(
    "/reports",
    {
      signal,
    }
  );

  return response?.data || response;
}