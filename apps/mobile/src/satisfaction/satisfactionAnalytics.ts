import type { ReportRow } from '@/reports/types';

export type SatisfactionMetric = { name: string; value: number };

export type SatisfactionFiltersState = {
  search: string;
  year: string;
  month: string;
  reason: string;
  dateFrom: string;
  dateTo: string;
};

export type NormalizedSatisfaction = ReportRow & {
  _ticketNumber: string;
  _rating: string;
  _comment: string;
  _reason: string;
  _date: string;
  _dateDisplay: string;
  _internalNote: string;
  _externalTeamNote: string;
  _isSolved: boolean;
  _solvedLabel: 'Solved' | 'Not Solved';
};

export const EMPTY_SATISFACTION_FILTERS: SatisfactionFiltersState = {
  search: '',
  year: '',
  month: '',
  reason: '',
  dateFrom: '',
  dateTo: '',
};

export function cleanText(value: unknown) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function key(value: unknown) {
  return cleanText(value).toLowerCase();
}

function pick(row: ReportRow, keys: string[]) {
  for (const candidate of keys) {
    const value = cleanText(row[candidate]);
    if (value) return value;
  }
  return '';
}

function pickRaw(row: ReportRow, keys: string[]) {
  for (const candidate of keys) {
    const value = row[candidate];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

export function normalizeSatisfactionRating(value: unknown) {
  const raw = cleanText(value);
  const normalized = raw.toLowerCase();
  if (!normalized) return 'Unknown';
  if (normalized.includes('unoffered')) return 'Unoffered';
  if (normalized.includes('offered')) return 'Offered';
  if (normalized.includes('good') || normalized.includes('positive') || normalized.includes('satisfied') || normalized.includes('excellent')) return 'Good';
  if (normalized.includes('bad') || normalized.includes('negative') || normalized.includes('dissatisfied') || normalized.includes('unsatisfied') || normalized.includes('poor')) return 'Bad';
  return raw || 'Unknown';
}

function normalizeSolved(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  return ['1', 'true', 'yes', 'y', 'solved', 'closed', 'resolved'].includes(key(value));
}

export function normalizeSatisfactionDate(value: unknown) {
  const raw = cleanText(value);
  if (!raw) return '';

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const [, yearPart, monthPart, dayPart] = iso;
    if (yearPart && monthPart && dayPart) return `${yearPart}-${monthPart.padStart(2, '0')}-${dayPart.padStart(2, '0')}`;
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

export function normalizeSatisfaction(row: ReportRow): NormalizedSatisfaction {
  const rawDate = pick(row, ['updated_date', 'updatedDate', 'ticket_updated_date', 'date', 'date_display', 'responseDate', 'response_date']);
  const date = normalizeSatisfactionDate(rawDate);
  const solvedValue = pickRaw(row, ['is_solved', 'isSolved', 'solved_tickets', 'solvedTickets', 'solved', 'solvedStatus', 'solved_status', 'status']);
  const isSolved = normalizeSolved(solvedValue);

  return {
    ...row,
    _ticketNumber: pick(row, ['ticketNumber', 'ticket_number', 'ticketId', 'ticket_id', 'ticket', 'id']).replace(/\.0+$/, ''),
    _rating: normalizeSatisfactionRating(pick(row, ['rating', 'satisfactionRating', 'satisfaction_rating', 'ticket_satisfaction_rating'])),
    _comment: pick(row, ['comment', 'comments', 'feedback', 'satisfactionComment', 'satisfaction_comment', 'ticket_satisfaction_comment']),
    _reason: pick(row, ['reason', 'satisfactionReason', 'satisfaction_reason', 'ticket_satisfaction_reason', 'rating_reason']) || 'No reason given',
    _date: date,
    _dateDisplay: pick(row, ['date_display', 'updatedDate', 'updated_date', 'ticket_updated_date', 'date', 'responseDate', 'response_date']) || date,
    _internalNote: pick(row, ['internalNote', 'internal_note', 'Internal Note', 'internal team note']),
    _externalTeamNote: pick(row, ['externalTeamNote', 'external_team_note', 'External Team Note', 'external note']),
    _isSolved: isSolved,
    _solvedLabel: isSolved ? 'Solved' : 'Not Solved',
  };
}

export function normalizeSatisfactionRows(rows: ReportRow[]) {
  return rows.map(normalizeSatisfaction).filter((row) => row._ticketNumber || row._rating !== 'Unknown' || row._comment || row._date);
}

function unique(values: string[]) {
  const map = new Map<string, string>();
  values.forEach((value) => {
    const clean = cleanText(value);
    if (clean && !map.has(clean.toLowerCase())) map.set(clean.toLowerCase(), clean);
  });
  return [...map.values()].sort((a, b) => a.localeCompare(b));
}

export function satisfactionFilterOptions(rows: NormalizedSatisfaction[]) {
  return {
    years: unique(rows.map((row) => row._date.slice(0, 4)).filter(Boolean)).sort((a, b) => b.localeCompare(a)),
    months: unique(rows.map((row) => row._date.slice(5, 7)).filter(Boolean)),
    reasons: unique(rows.map((row) => row._reason).filter((value) => value !== 'No reason given')),
  };
}

export function filterSatisfactionRows(rows: NormalizedSatisfaction[], filters: SatisfactionFiltersState) {
  const search = key(filters.search);
  return rows.filter((row) => {
    if (search) {
      const searchable = [row._ticketNumber, row._rating, row._comment, row._reason, row._internalNote, row._externalTeamNote].map(key).join(' ');
      if (!searchable.includes(search)) return false;
    }
    if (filters.year && row._date.slice(0, 4) !== filters.year) return false;
    if (filters.month && row._date.slice(5, 7) !== filters.month) return false;
    if (filters.reason && key(row._reason) !== key(filters.reason)) return false;
    if (filters.dateFrom && row._date && row._date < filters.dateFrom) return false;
    if (filters.dateTo && row._date && row._date > filters.dateTo) return false;
    return true;
  });
}

function percent(value: number, total: number) {
  return total ? Number(((value / total) * 100).toFixed(1)) : 0;
}

export function buildSatisfactionAnalytics(rows: NormalizedSatisfaction[]) {
  const totalResponses = rows.length;
  const goodCount = rows.filter((row) => row._rating === 'Good').length;
  const badCount = rows.filter((row) => row._rating === 'Bad').length;
  const commentCount = rows.filter((row) => Boolean(row._comment)).length;
  const noCommentCount = totalResponses - commentCount;

  return {
    kpis: {
      totalResponses,
      goodCount,
      badCount,
      goodPercent: percent(goodCount, totalResponses),
      badPercent: percent(badCount, totalResponses),
    },
    ratingSummary: [
      { name: 'Good', value: goodCount },
      { name: 'Bad', value: badCount },
    ],
    commentSummary: [
      { name: 'With Comments', value: commentCount },
      { name: 'Without Comments', value: noCommentCount },
    ],
  };
}
