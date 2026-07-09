import { apiGet } from "./apiClient";

export async function fetchUploadedRmaReports({ signal } = {}) {
  return apiGet("/rma/uploaded/reports", { signal });
}

export async function fetchSheetRmaReports({ signal } = {}) {
  return apiGet("/rma/sheet/reports", { signal });
}