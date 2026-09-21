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
  issues?: string;
  issue?: string;
  warrantyStatus?: string;
  warranty_status?: string;
  source: string;
};

export type MetricItem = { name: string; value: number };

export type RmaSheetReportResponse = {
  ok: boolean;
  source: 'google_sheet_rma_tab' | 'google_sheet' | string;
  sheetId: string;
  tab: string;
  rows: RmaReportRow[];
  summary: {
    totalRows: number;
    rawRows: number;
    duplicateRows: number;
    sourceRows?: number;
    sourceTab?: string;
    generatedAt: string;
  };
  analytics: {
    totalRma: number;
    uniqueTickets: number;
    byRegion: MetricItem[];
    byTse?: MetricItem[];
    byRmaType: MetricItem[];
    byDate: MetricItem[];
    byMonth: MetricItem[];
    byProduct: MetricItem[];
    byIssue?: MetricItem[];
    byWarrantyStatus?: MetricItem[];
  };
};

export type ReportDataStatus = 'idle' | 'loading' | 'refreshing' | 'ready' | 'error';
