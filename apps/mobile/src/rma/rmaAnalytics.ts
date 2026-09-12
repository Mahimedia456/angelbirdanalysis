import type { RmaReportRow } from '@/reports/types';

export type RmaMetric = { name: string; value: number };

export type RmaFiltersState = {
  search: string;
  year: string;
  month: string;
  region: string;
  rmaType: string;
  tse: string;
  dateFrom: string;
  dateTo: string;
};

export type NormalizedRma = RmaReportRow & {
  _ticketNumber: string;
  _date: string;
  _dateDisplay: string;
  _region: string;
  _tse: string;
  _product1: string;
  _product2: string;
  _subject: string;
  _rmaType: string;
};

export const EMPTY_RMA_FILTERS: RmaFiltersState = {
  search: '',
  year: '',
  month: '',
  region: '',
  rmaType: '',
  tse: '',
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
  if (raw === 'NORTH AMERICA') return 'NA';
  if (raw === 'U.K.' || raw === 'UNITED KINGDOM') return 'UK';
  return raw;
}

function normalizeRmaType(value: unknown) {
  const raw = cleanText(value);
  const normalized = key(raw);
  if (normalized === 'dr' || normalized === 'data recovery' || normalized === 'date recovery') return 'Data Recovery';
  if (['dr rma', 'data recovery rma', 'date recovery rma'].includes(normalized)) return 'Data Recovery RMA';
  if (normalized === 'rma') return 'RMA';
  if (normalized === 'broken plastic' || normalized === 'broken plastics') return 'Broken Plastic';
  if (['repair & replaced', 'repair and replaced', 'repaired & replaced', 'repair replaced'].includes(normalized)) return 'Repair & Replaced';
  return raw;
}

export function normalizeRmaRows(rows: RmaReportRow[]) {
  return rows
    .map<NormalizedRma>((row) => {
      const date = normalizeDate(row.date);
      return {
        ...row,
        _ticketNumber: cleanText(row.ticketNumber),
        _date: date,
        _dateDisplay: cleanText(row.date) || date,
        _region: normalizeRegion(row.region),
        _tse: cleanText(row.tse),
        _product1: cleanText(row.product1),
        _product2: cleanText(row.product2),
        _subject: cleanText(row.ticketSubject),
        _rmaType: normalizeRmaType(row.rmaType),
      };
    })
    .filter((row) => row._ticketNumber);
}

function includesSearch(row: NormalizedRma, search: string) {
  if (!search) return true;
  const haystack = [
    row._ticketNumber,
    row._tse,
    row._region,
    row._dateDisplay,
    row._product1,
    row._product2,
    row._subject,
    row._rmaType,
  ]
    .join(' ')
    .toLowerCase();
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
    if (filters.tse && row._tse !== filters.tse) return false;
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
    tses: uniqueSorted(rows.map((row) => row._tse)),
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
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function makeProductSummary(rows: NormalizedRma[]) {
  const counts = new Map<string, { name: string; value: number }>();
  rows.forEach((row) => {
    const products = Array.from(new Set([row._product1, row._product2].map(cleanText).filter(Boolean)));
    products.forEach((name) => {
      const normalized = key(name);
      const current = counts.get(normalized);
      if (current) current.value += 1;
      else counts.set(normalized, { name, value: 1 });
    });
  });
  return Array.from(counts.values()).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

export function buildRmaAnalytics(rows: NormalizedRma[]) {
  const uniqueTickets = new Set(rows.map((row) => key(row._ticketNumber)).filter(Boolean)).size;
  const uniqueProducts = new Set(
    rows.flatMap((row) => [row._product1, row._product2]).map(key).filter(Boolean),
  ).size;
  const dataRecovery = rows.filter((row) => row._rmaType === 'Data Recovery' || row._rmaType === 'Data Recovery RMA').length;
  const standardRma = rows.filter((row) => row._rmaType === 'RMA').length;
  const brokenPlastic = rows.filter((row) => row._rmaType === 'Broken Plastic').length;
  const repairReplaced = rows.filter((row) => row._rmaType === 'Repair & Replaced').length;

  return {
    kpis: {
      totalRma: rows.length,
      uniqueTickets,
      uniqueProducts,
      dataRecovery,
      standardRma,
      brokenPlastic,
      repairReplaced,
    },
    dailySummary: chronologicalSummary(rows, (row) => row._date),
    regionSummary: makeSummary(rows, (row) => row._region),
    tseSummary: makeSummary(rows, (row) => row._tse),
    typeSummary: makeSummary(rows, (row) => row._rmaType),
    productSummary: makeProductSummary(rows),
    monthSummary: makeSummary(rows, (row) => row._date.slice(0, 7)).sort((a, b) => a.name.localeCompare(b.name)),
  };
}
