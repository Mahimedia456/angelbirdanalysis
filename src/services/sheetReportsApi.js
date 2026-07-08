import { apiGet } from "./apiClient";

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