import type { RmaReportRow } from '@/reports/types';

export type RmaMetric = { name: string; value: number };

export type RmaFiltersState = {
  search: string;
  year: string;
  month: string;
  region: string;
  rmaType: string;
  issue: string;
  warrantyStatus: string;
  dateFrom: string;
  dateTo: string;
};

export type NormalizedRma = RmaReportRow & {
  _ticketNumber: string;
  _date: string;
  _dateDisplay: string;
  _region: string;
  _product1: string;
  _subject: string;
  _rmaType: string;
  _issue: string;
  _warrantyStatus: string;
};

export type MonthlyCategoryItem = {
  month: string;
  total: number;
  categories: RmaMetric[];
};

export type IssueHeatmapData = {
  months: string[];
  issues: Array<{ name: string; total: number; values: Record<string, number> }>;
  maxValue: number;
};

export const EMPTY_RMA_FILTERS: RmaFiltersState = {
  search: '',
  year: '',
  month: '',
  region: '',
  rmaType: '',
  issue: '',
  warrantyStatus: '',
  dateFrom: '',
  dateTo: '',
};

export function cleanText(value: unknown) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function key(value: unknown) {
  return cleanText(value).toLowerCase();
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
      if (month) {
        const year = yearPart.length === 2 ? `20${yearPart}` : yearPart;
        return `${year}-${month}-${dayPart.padStart(2, '0')}`;
      }
    }
  }

  const slash = raw.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2}|\d{4})$/);
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
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
}

function normalizeRegion(value: unknown) {
  const raw = cleanText(value).toUpperCase();
  if (raw === 'USA' || raw === 'UNITED STATES') return 'US';
  if (raw === 'NA' || raw === 'NORTH AMERICA') return 'UAE';
  if (raw === 'U.K.' || raw === 'UNITED KINGDOM') return 'UK';
  return raw;
}

function normalizeRmaType(value: unknown) {
  const raw = cleanText(value);
  const normalized = key(raw);
  if (!normalized) return '';
  if (normalized === 'dr' || normalized === 'data recovery') return 'Data Recovery';
  if (['dr rma', 'data recovery rma', 'date recovery rma'].includes(normalized)) return 'Data Recovery RMA';
  if (normalized === 'date recovery') return 'Date Recovery';
  if (normalized === 'rma') return 'RMA';
  if (['faulty', 'fault', 'defective', 'defect', 'faulty unit', 'faulty product'].includes(normalized)) return 'Faulty';
  if (normalized === 'broken plastic' || normalized === 'broken plastics') return 'Broken Plastic';
  if (['repair & replaced', 'repair and replaced', 'repaired & replaced', 'repair replaced'].includes(normalized)) return 'Repair & Replaced';
  return raw;
}

function normalizeWarrantyStatus(value: unknown) {
  const raw = cleanText(value);
  const normalized = key(raw).replace(/[\/_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (['in warranty', 'within warranty', 'under warranty', 'warranty', 'yes'].includes(normalized)) return 'In Warranty';
  if (['out of warranty', 'out warranty', 'oow', 'expired warranty', 'warranty expired', 'no warranty', 'no'].includes(normalized)) return 'Out of Warranty';
  return raw;
}

function isBlank(value: unknown) {
  return cleanText(value) === '';
}

function mergeRows(primary: NormalizedRma, fallback: NormalizedRma): NormalizedRma {
  const merged = { ...fallback, ...primary } as NormalizedRma;
  for (const field of Object.keys({ ...fallback, ...primary })) {
    const name = field as keyof NormalizedRma;
    if (isBlank(primary[name]) && !isBlank(fallback[name])) {
      (merged as unknown as Record<string, unknown>)[field] = fallback[name] as unknown;
    }
  }
  return merged;
}

function freshness(row: NormalizedRma) {
  const dateScore = row._date ? Date.parse(`${row._date}T00:00:00Z`) : 0;
  const idScore = Number(row.id || 0);
  return { dateScore: Number.isFinite(dateScore) ? dateScore : 0, idScore: Number.isFinite(idScore) ? idScore : 0 };
}

export function deduplicateRmaRows(rows: NormalizedRma[]) {
  const byTicket = new Map<string, NormalizedRma>();
  const withoutTicket: NormalizedRma[] = [];

  rows.forEach((row) => {
    const ticket = key(row._ticketNumber);
    if (!ticket) {
      withoutTicket.push(row);
      return;
    }
    const existing = byTicket.get(ticket);
    if (!existing) {
      byTicket.set(ticket, row);
      return;
    }
    const a = freshness(row);
    const b = freshness(existing);
    const rowIsNewer = a.dateScore > b.dateScore || (a.dateScore === b.dateScore && a.idScore >= b.idScore);
    byTicket.set(ticket, rowIsNewer ? mergeRows(row, existing) : mergeRows(existing, row));
  });

  return [...byTicket.values(), ...withoutTicket].sort((a, b) => a._date.localeCompare(b._date) || a._ticketNumber.localeCompare(b._ticketNumber));
}

export function normalizeRmaRows(rows: RmaReportRow[]) {
  const normalized = rows
    .map<NormalizedRma>((row) => {
      const date = normalizeDate(row.date);
      const issue = cleanText(row.issues || row.issue || (row as Record<string, unknown>).issue_type || (row as Record<string, unknown>).rma_issues);
      const warranty = normalizeWarrantyStatus(row.warrantyStatus || row.warranty_status || (row as Record<string, unknown>).warranty);
      return {
        ...row,
        _ticketNumber: cleanText(row.ticketNumber).replace(/\.0+$/, ''),
        _date: date,
        _dateDisplay: cleanText(row.date) || date,
        _region: normalizeRegion(row.region),
        _product1: cleanText(row.product1),
        _subject: cleanText(row.ticketSubject),
        _rmaType: normalizeRmaType(row.rmaType),
        _issue: issue,
        _warrantyStatus: warranty,
      };
    })
    .filter((row) => row._ticketNumber || row._rmaType);

  return deduplicateRmaRows(normalized);
}

function includesSearch(row: NormalizedRma, search: string) {
  if (!search) return true;
  const haystack = [
    row._ticketNumber,
    row._region,
    row._dateDisplay,
    row._product1,
    row._subject,
    row._rmaType,
    row._issue,
    row._warrantyStatus,
  ].join(' ').toLowerCase();
  return haystack.includes(search.toLowerCase());
}

export function filterRmaRows(rows: NormalizedRma[], filters: RmaFiltersState) {
  const dateFrom = normalizeDate(filters.dateFrom);
  const dateTo = normalizeDate(filters.dateTo);

  return rows.filter((row) => {
    if (!includesSearch(row, cleanText(filters.search))) return false;
    if (filters.year && !row._date.startsWith(`${filters.year}-`)) return false;
    if (filters.month && row._date.slice(5, 7) !== filters.month) return false;
    if (filters.region && row._region !== filters.region) return false;
    if (filters.rmaType && row._rmaType !== filters.rmaType) return false;
    if (filters.issue && row._issue !== filters.issue) return false;
    if (filters.warrantyStatus && row._warrantyStatus !== filters.warrantyStatus) return false;
    if (dateFrom && (!row._date || row._date < dateFrom)) return false;
    if (dateTo && (!row._date || row._date > dateTo)) return false;
    return true;
  });
}

function uniqueSorted(values: string[], sortDescending = false) {
  const sorted = Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return sortDescending ? sorted.reverse() : sorted;
}

export function rmaFilterOptions(rows: NormalizedRma[]) {
  return {
    years: uniqueSorted(rows.map((row) => row._date.slice(0, 4)).filter((value) => /^\d{4}$/.test(value)), true),
    months: uniqueSorted(rows.map((row) => row._date.slice(5, 7)).filter((value) => /^\d{2}$/.test(value))),
    regions: uniqueSorted(rows.map((row) => row._region)),
    rmaTypes: uniqueSorted(rows.map((row) => row._rmaType)),
    issues: uniqueSorted(rows.map((row) => row._issue)),
    warrantyStatuses: uniqueSorted(rows.map((row) => row._warrantyStatus)),
  };
}

function makeSummary(rows: NormalizedRma[], getter: (row: NormalizedRma) => string) {
  const counts = new Map<string, { name: string; value: number }>();
  rows.forEach((row) => {
    const name = cleanText(getter(row));
    if (!name) return;
    const normalized = key(name);
    const current = counts.get(normalized);
    if (current) current.value += 1;
    else counts.set(normalized, { name, value: 1 });
  });
  return Array.from(counts.values()).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

function chronologicalSummary(rows: NormalizedRma[], getter: (row: NormalizedRma) => string): RmaMetric[] {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const name = cleanText(getter(row));
    if (!name) return;
    counts.set(name, (counts.get(name) || 0) + 1);
  });
  return [...counts.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name));
}

function buildMonthlyCategorySummary(rows: NormalizedRma[]): MonthlyCategoryItem[] {
  const buckets = new Map<string, NormalizedRma[]>();
  rows.forEach((row) => {
    const month = row._date.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) return;
    const bucket = buckets.get(month) || [];
    bucket.push(row);
    buckets.set(month, bucket);
  });
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, bucket]) => ({ month, total: bucket.length, categories: makeSummary(bucket, (row) => row._rmaType) }));
}

function buildIssueHeatmap(rows: NormalizedRma[]): IssueHeatmapData {
  const months = uniqueSorted(rows.map((row) => row._date.slice(0, 7)).filter((month) => /^\d{4}-\d{2}$/.test(month)));
  const issueTotals = new Map<string, number>();
  const values = new Map<string, number>();
  rows.forEach((row) => {
    if (!row._issue) return;
    const month = row._date.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) return;
    issueTotals.set(row._issue, (issueTotals.get(row._issue) || 0) + 1);
    const composite = `${row._issue}|||${month}`;
    values.set(composite, (values.get(composite) || 0) + 1);
  });
  const issues = [...issueTotals.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, total]) => ({
      name,
      total,
      values: Object.fromEntries(months.map((month) => [month, values.get(`${name}|||${month}`) || 0])),
    }));
  const maxValue = Math.max(0, ...issues.flatMap((issue) => Object.values(issue.values)));
  return { months, issues, maxValue };
}

export function buildRmaAnalytics(rows: NormalizedRma[]) {
  const uniqueTickets = new Set(rows.map((row) => key(row._ticketNumber)).filter(Boolean)).size;
  const uniqueProducts = new Set(rows.map((row) => key(row._product1)).filter(Boolean)).size;
  const dataRecovery = rows.filter((row) => row._rmaType === 'Data Recovery' || row._rmaType === 'Data Recovery RMA' || row._rmaType === 'Date Recovery').length;
  const standardRma = rows.filter((row) => row._rmaType === 'RMA').length;
  const brokenPlastic = rows.filter((row) => row._rmaType === 'Broken Plastic').length;
  const repairReplaced = rows.filter((row) => row._rmaType === 'Repair & Replaced').length;

  return {
    kpis: { totalRma: rows.length, uniqueTickets, uniqueProducts, dataRecovery, standardRma, brokenPlastic, repairReplaced },
    dailySummary: chronologicalSummary(rows, (row) => row._date),
    monthlySummary: chronologicalSummary(rows, (row) => row._date.slice(0, 7)),
    monthlyCategorySummary: buildMonthlyCategorySummary(rows),
    issueHeatmap: buildIssueHeatmap(rows),
    issueSummary: makeSummary(rows, (row) => row._issue),
    warrantySummary: makeSummary(rows, (row) => row._warrantyStatus),
    regionSummary: makeSummary(rows, (row) => row._region),
    typeSummary: makeSummary(rows, (row) => row._rmaType),
    productSummary: makeSummary(rows, (row) => row._product1).filter((item) => !['unknown', 'na', '-'].includes(key(item.name))),
  };
}
