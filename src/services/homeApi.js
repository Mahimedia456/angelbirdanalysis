import {
  apiGet,
} from "./apiClient";

export async function fetchApiHealth({
  signal,
} = {}) {
  return apiGet(
    "/health",
    {
      auth: false,
      signal,
    }
  );
}

export async function fetchHomeOverview({
  period,
  signal,
} = {}) {
  const response =
    await apiGet(
      "/home/overview",
      {
        query: {
          period,
        },

        signal,
      }
    );

  return response.data;
}