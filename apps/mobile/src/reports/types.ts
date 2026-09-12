export type ReportRow = Record<string, unknown> & {
  sheet_row_number?: number;
};

export type SheetReportResponse = {
  ok: boolean;
  source: 'google_sheet' | string;
  sheetId: string;
  tabs: { tickets: string; satisfaction: string };
  tickets: ReportRow[];
  satisfaction: ReportRow[];
  summary: {
    ticketCount: number;
    satisfactionCount: number;
    totalRows: number;
    updatedAt: string;
  };
};

export type RmaReportRow = {
  id: string | number;
  tse: string;
  ticketNumber: string;
  region: string;
  date: string;
  product1: string;
  product2: string;
  ticketSubject: string;
  rmaType: string;
  source: string;
};

export type MetricItem = { name: string; value: number };

export type RmaSheetReportResponse = {
  ok: boolean;
  source: 'google_sheet' | string;
  sheetId: string;
  tab: string;
  rows: RmaReportRow[];
  summary: {
    totalRows: number;
    rawRows: number;
    duplicateRows: number;
    generatedAt: string;
  };
  analytics: {
    totalRma: number;
    uniqueTickets: number;
    byRegion: MetricItem[];
    byTse: MetricItem[];
    byRmaType: MetricItem[];
    byDate: MetricItem[];
    byMonth: MetricItem[];
    byProduct: MetricItem[];
  };
};

export type ReportDataStatus = 'idle' | 'loading' | 'refreshing' | 'ready' | 'error';
