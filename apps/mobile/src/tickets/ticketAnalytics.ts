import type { ReportRow } from '@/reports/types';

export type TicketMetric = { name: string; value: number };

export type TicketFiltersState = {
  search: string;
  year: string;
  month: string;
  region: string;
  supportCategory: string;
  productCategory: string;
  procedure: string;
  dateFrom: string;
  dateTo: string;
};

export type NormalizedTicket = ReportRow & {
  _ticketNumber: string;
  _date: string;
  _dateDisplay: string;
  _region: string;
  _tse: string;
  _product1: string;
  _product2: string;
  _subject: string;
  _supportCategory: string;
  _productCategory: string;
  _procedure: string;
};

export const EMPTY_TICKET_FILTERS: TicketFiltersState = {
  search: '',
  year: '',
  month: '',
  region: '',
  supportCategory: '',
  productCategory: '',
  procedure: '',
  dateFrom: '',
  dateTo: '',
};

const ALLOWED_REGIONS = new Set(['APAC', 'AUS', 'EMEA', 'NA', 'UAE', 'UK', 'US']);
const ALLOWED_RMA_TYPES = new Set([
  'broken plastic',
  'data recovery',
  'data recovery rma',
  'repair & replaced',
  'rma',
]);

export function cleanText(value: unknown) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function pick(row: ReportRow, keys: string[]) {
  for (const key of keys) {
    const value = cleanText(row[key]);
    if (value) return value;
  }
  return '';
}

function key(value: unknown) {
  return cleanText(value).toLowerCase();
}

function normalizeRegion(value: unknown) {
  const raw = cleanText(value).toUpperCase();
  if (raw === 'USA' || raw === 'UNITED STATES') return 'US';
  if (raw === 'NORTH AMERICA') return 'NA';
  if (raw === 'U.K.' || raw === 'UNITED KINGDOM') return 'UK';
  return ALLOWED_REGIONS.has(raw) ? raw : raw;
}

function normalizeProcedure(value: unknown) {
  const text = key(value);
  if (text === 'dr' || text === 'data recovery') return 'data recovery';
  if (['dr rma', 'data recovery rma', 'date recovery rma'].includes(text)) return 'data recovery rma';
  if (['broken plastic', 'broken plastics'].includes(text)) return 'broken plastic';
  if (['repair & replaced', 'repair and replaced', 'repaired & replaced', 'repair replaced'].includes(text)) {
    return 'repair & replaced';
  }
  return text;
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

  const slash = raw.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/);
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
    _tse: pick(row, ['tse', 'TSE', 'agent', 'engineer']),
    _product1: pick(row, ['product_1', 'product1', 'product', 'productName', 'product_name']),
    _product2: pick(row, ['product_2', 'product2']),
    _subject: pick(row, ['ticket_subject', 'ticketSubject', 'subject']),
    _supportCategory: pick(row, ['support_category', 'supportCategory', 'category']),
    _productCategory: pick(row, ['product_category', 'productCategory']),
    _procedure: pick(row, ['procedure', 'Procedure']),
  };
}

export function normalizeTickets(rows: ReportRow[]) {
  return rows.map(normalizeTicket);
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
    procedures: unique(rows.map((row) => row._procedure)),
  };
}

export function filterTickets(rows: NormalizedTicket[], filters: TicketFiltersState) {
  const search = key(filters.search);

  return rows.filter((ticket) => {
    if (search) {
      const searchable = [
        ticket._ticketNumber,
        ticket._product1,
        ticket._product2,
        ticket._subject,
        ticket._procedure,
        ticket._supportCategory,
        ticket._productCategory,
        ticket._tse,
        ticket._region,
      ].map(key).join(' ');
      if (!searchable.includes(search)) return false;
    }

    if (filters.year && ticket._date.slice(0, 4) !== filters.year) return false;
    if (filters.month && ticket._date.slice(5, 7) !== filters.month) return false;
    if (filters.region && key(ticket._region) !== key(filters.region)) return false;
    if (filters.supportCategory && key(ticket._supportCategory) !== key(filters.supportCategory)) return false;
    if (filters.productCategory && key(ticket._productCategory) !== key(filters.productCategory)) return false;
    if (filters.procedure && normalizeProcedure(ticket._procedure) !== normalizeProcedure(filters.procedure)) return false;
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

function productMetric(rows: NormalizedTicket[]) {
  const counts = new Map<string, { name: string; value: number }>();
  rows.forEach((row) => {
    [row._product1, row._product2].forEach((name) => {
      const clean = cleanText(name);
      if (!clean || ['unknown', 'na', '-'].includes(clean.toLowerCase())) return;
      const normalized = clean.toLowerCase();
      const current = counts.get(normalized) || { name: clean, value: 0 };
      current.value += 1;
      counts.set(normalized, current);
    });
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
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function dedupeTicketNumber(rows: NormalizedTicket[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const ticket = key(row._ticketNumber);
    if (!ticket) return true;
    if (seen.has(ticket)) return false;
    seen.add(ticket);
    return true;
  });
}

export function buildTicketAnalytics(rows: NormalizedTicket[]) {
  const supportCategorySummary = metric(rows, (row) => row._supportCategory);
  const productCategorySummary = metric(rows, (row) => row._productCategory);
  const procedureSummary = metric(rows, (row) => row._procedure);
  const regionSummary = metric(rows, (row) => row._region);
  const tseSummary = metric(rows, (row) => row._tse);
  const productSummary = productMetric(rows);
  const dailySummary = chronologicalMetric(rows, (row) => row._date);

  const validRegionRows = dedupeTicketNumber(rows.filter((row) => ALLOWED_REGIONS.has(row._region)));
  const dataRecoveryCount = validRegionRows.filter((row) => normalizeProcedure(row._procedure) === 'data recovery').length;
  const rmaCount = validRegionRows.filter((row) => ALLOWED_RMA_TYPES.has(normalizeProcedure(row._procedure))).length;

  const contains = (row: NormalizedTicket, search: string) =>
    [row._supportCategory, row._procedure, row._subject].some((value) => key(value).includes(search));

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
    tseSummary,
    supportCategorySummary,
    productCategorySummary,
    procedureSummary,
    productSummary,
  };
}
