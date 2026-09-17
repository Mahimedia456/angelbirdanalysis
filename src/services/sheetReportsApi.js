import { apiGet, apiRequest } from "./apiClient";

export async function fetchSheetApiHealth({ signal } = {}) {
  return apiGet("/sheets/health", {
    signal,
  });
}

export async function fetchSheetHomeOverview({ signal } = {}) {
  return apiGet("/sheets/overview", {
    signal,
  });
}

export async function fetchSheetReportsData({ signal } = {}) {
  return apiGet("/sheets/reports", {
    signal,
  });
}
export async function updateSatisfactionNotes(payload = {}) {
  return apiRequest("/sheets/satisfaction/notes", {
    method: "PATCH",
    body: payload,
  });
}
