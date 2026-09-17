import type { ReportRow, RmaReportRow } from '@/reports/types';

export type TicketMetric = { name: string; value: number };

export type TicketFiltersState = {
  search: string;
  year: string;
  month: string;
  region: string;
  supportCategory: string;
  productCategory: string;
  dateFrom: string;
  dateTo: string;
};

export type NormalizedTicket = ReportRow & {
  _ticketNumber: string;
  _date: string;
  _dateDisplay: string;
  _region: string;
  _product1: string;
  _subject: string;
  _supportCategory: string;
  _productCategory: string;
};

export const EMPTY_TICKET_FILTERS: TicketFiltersState = {
  search: '',
  year: '',
  month: '',
  region: '',
  supportCategory: '',
  productCategory: '',
  dateFrom: '',
  dateTo: '',
};

export function cleanText(value: unknown) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function pick(row: ReportRow, keys: string[]) {
  for (const field of keys) {
    const value = cleanText(row[field]);
    if (value) return value;
  }
  return '';
}

function key(value: unknown) {
  return cleanText(value).toLowerCase();
}

export function normalizeRegion(value: unknown) {
  const raw = cleanText(value).toUpperCase();
  if (raw === 'USA' || raw === 'UNITED STATES') return 'US';
  if (raw === 'NA' || raw === 'NORTH AMERICA') return 'UAE';
  if (raw === 'U.K.' || raw === 'UNITED KINGDOM') return 'UK';
  return raw;
}

export function normalizeDate(value: unknown) {
  const raw = cleanText(value);
  if (!raw) return '';

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const [, yearPart, monthPart, dayPart] = iso;
    if (yearPart && monthPart && dayPart) {
      return `${yearPart}-${monthPart.padStart(2, '0')}-${dayPart.padStart(2, '0')}`;
    }
  }

  const named = raw.match(/^(\d{1,2})[-./\s]([A-Za-z]{3,9})[-./\s](\d{2}|\d{4})$/);
  if (named) {
    const months: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };
    const [, dayPart, monthName, yearPart] = named;
    if (dayPart && monthName && yearPart) {
      const month = months[monthName.slice(0, 3).toLowerCase()];
      let year = Number(yearPart);
      if (year < 100) year += 2000;
      if (month) return `${year}-${month}-${String(Number(dayPart)).padStart(2, '0')}`;
    }
  }

  const slash = raw.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/);
  if (slash) {
    let first = Number(slash[1]);
    let second = Number(slash[2]);
    let year = Number(slash[3]);
    if (year < 100) year += 2000;
    let month = first;
    let day = second;
    if (first > 12) {
      day = first;
      month = second;
    }
    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
}

export function normalizeTicket(row: ReportRow): NormalizedTicket {
  const rawDate = pick(row, ['date_key', 'ticket_date', 'ticketDate', 'date', 'date_display', 'createdDate', 'submittedDate']);
  const date = normalizeDate(rawDate);

  return {
    ...row,
    _ticketNumber: pick(row, ['ticket_number', 'ticketNumber', 'ticketNo', 'ticket_no', 'ticket_id', 'ticketId']).replace(/\.0+$/, ''),
    _date: date,
    _dateDisplay: pick(row, ['date_display', 'date', 'ticket_date', 'ticketDate']) || date,
    _region: normalizeRegion(pick(row, ['region', 'Region'])),
    _product1: pick(row, ['product_1', 'product1', 'product', 'productName', 'product_name', 'products']),
    _subject: pick(row, ['ticket_subject', 'ticketSubject', 'subject']),
    _supportCategory: pick(row, ['support_category', 'supportCategory', 'category']),
    _productCategory: pick(row, ['product_category', 'productCategory']),
  };
}

export function normalizeTickets(rows: ReportRow[]) {
  const seen = new Set<string>();
  return rows.map(normalizeTicket).filter((row) => {
    const id = key(row._ticketNumber);
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function unique(values: string[]) {
  const byKey = new Map<string, string>();
  values.forEach((value) => {
    const clean = cleanText(value);
    if (clean && !byKey.has(clean.toLowerCase())) byKey.set(clean.toLowerCase(), clean);
  });
  return [...byKey.values()].sort((a, b) => a.localeCompare(b));
}

export function ticketFilterOptions(rows: NormalizedTicket[]) {
  return {
    years: unique(rows.map((row) => row._date.slice(0, 4)).filter(Boolean)).sort((a, b) => b.localeCompare(a)),
    months: unique(rows.map((row) => row._date.slice(5, 7)).filter(Boolean)),
    regions: unique(rows.map((row) => row._region)),
    supportCategories: unique(rows.map((row) => row._supportCategory)),
    productCategories: unique(rows.map((row) => row._productCategory)),
  };
}

export function filterTickets(rows: NormalizedTicket[], filters: TicketFiltersState) {
  const search = key(filters.search);

  return rows.filter((ticket) => {
    if (search) {
      const searchable = [
        ticket._ticketNumber,
        ticket._product1,
        ticket._subject,
        ticket._supportCategory,
        ticket._productCategory,
        ticket._region,
      ].map(key).join(' ');
      if (!searchable.includes(search)) return false;
    }

    if (filters.year && ticket._date.slice(0, 4) !== filters.year) return false;
    if (filters.month && ticket._date.slice(5, 7) !== filters.month) return false;
    if (filters.region && key(ticket._region) !== key(filters.region)) return false;
    if (filters.supportCategory && key(ticket._supportCategory) !== key(filters.supportCategory)) return false;
    if (filters.productCategory && key(ticket._productCategory) !== key(filters.productCategory)) return false;
    if (filters.dateFrom && ticket._date && ticket._date < filters.dateFrom) return false;
    if (filters.dateTo && ticket._date && ticket._date > filters.dateTo) return false;
    return true;
  });
}

function metric(rows: NormalizedTicket[], getter: (row: NormalizedTicket) => string): TicketMetric[] {
  const counts = new Map<string, { name: string; value: number }>();
  rows.forEach((row) => {
    const name = cleanText(getter(row)) || 'Unknown';
    const normalized = name.toLowerCase();
    const current = counts.get(normalized) || { name, value: 0 };
    current.value += 1;
    counts.set(normalized, current);
  });
  return [...counts.values()].sort((a, b) => b.value - a.value);
}

function chronologicalMetric(rows: NormalizedTicket[], getter: (row: NormalizedTicket) => string): TicketMetric[] {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const name = cleanText(getter(row));
    if (!name) return;
    counts.set(name, (counts.get(name) || 0) + 1);
  });
  return [...counts.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeRmaType(value: unknown) {
  return key(value).replace(/\s+/g, ' ');
}

function buildRmaLinkedKpis(ticketRows: NormalizedTicket[], rmaRows: RmaReportRow[]) {
  const ticketIds = new Set(ticketRows.map((row) => key(row._ticketNumber)).filter(Boolean));
  const matching = rmaRows.filter((row) => {
    const id = key(cleanText(row.ticketNumber).replace(/\.0+$/, ''));
    return Boolean(id && ticketIds.has(id));
  });

  return {
    dataRecoveryCount: matching.filter((row) => {
      const type = normalizeRmaType(row.rmaType);
      return type === 'data recovery' || type === 'data recovery rma';
    }).length,
    rmaCount: matching.filter((row) => normalizeRmaType(row.rmaType) === 'rma').length,
  };
}

export function buildTicketAnalytics(rows: NormalizedTicket[], rmaRows: RmaReportRow[] = []) {
  const supportCategorySummary = metric(rows, (row) => row._supportCategory);
  const productCategorySummary = metric(rows, (row) => row._productCategory);
  const regionSummary = metric(rows, (row) => row._region);
  const productSummary = metric(rows, (row) => row._product1).filter((item) => !['unknown', 'na', '-'].includes(key(item.name)));
  const dailySummary = chronologicalMetric(rows, (row) => row._date);
  const { dataRecoveryCount, rmaCount } = buildRmaLinkedKpis(rows, rmaRows);

  const contains = (row: NormalizedTicket, search: string) =>
    [row._supportCategory, row._subject].some((value) => key(value).includes(search));

  return {
    kpis: {
      totalTickets: rows.length,
      totalProducts: productSummary.length,
      totalSupportCategories: supportCategorySummary.length,
      totalProductCategories: productCategorySummary.length,
      dataRecoveryCount,
      rmaCount,
      troubleshootCount: rows.filter((row) => contains(row, 'troubleshoot')).length,
      registrationCount: rows.filter((row) => key(row._supportCategory).includes('registration')).length,
      hardwareCount: rows.filter((row) => key(row._supportCategory).includes('hardware')).length,
      firmwareCount: rows.filter((row) => contains(row, 'firmware')).length,
    },
    dailySummary,
    regionSummary,
    supportCategorySummary,
    productCategorySummary,
    productSummary,
  };
}
