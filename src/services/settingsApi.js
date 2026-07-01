import {
  apiGet,
  apiRequest,
} from "./apiClient";

export async function fetchUiSettings({
  signal,
} = {}) {
  const response =
    await apiGet(
      "/settings/ui",
      {
        signal,
      }
    );

  return response.data;
}

export async function updateUiSettings(
  payload
) {
  const response =
    await apiRequest(
      "/settings/ui",
      {
        method: "PUT",
        body: payload,
      }
    );

  return response.data;
}