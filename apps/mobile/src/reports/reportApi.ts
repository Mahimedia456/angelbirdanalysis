import type { ApiRequestInit } from '@/services/apiClient';
import type { RmaSheetReportResponse, SheetReportResponse } from '@/reports/types';

type AuthenticatedRequest = <T>(path: string, init?: ApiRequestInit) => Promise<T>;

export function fetchLiveSheetReports(request: AuthenticatedRequest) {
  return request<SheetReportResponse>('/sheets/reports', { method: 'GET' });
}

export function fetchLiveRmaReport(request: AuthenticatedRequest) {
  return request<RmaSheetReportResponse>('/rma/sheet/reports', { method: 'GET' });
}
