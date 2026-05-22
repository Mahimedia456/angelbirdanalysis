import {
  cleanText,
  formatDateKey,
  formatDisplayDate,
  formatMonthKey,
  normalizeColumnName,
} from "./ticketMapper";

export const SATISFACTION_FIELDS = [
  {
    key: "ticket_id",
    label: "Ticket ID",
    required: true,
    aliases: ["ticket_id", "ticket", "ticket_number", "id"],
  },
  {
    key: "rating",
    label: "Ticket satisfaction rating",
    required: true,
    aliases: [
      "ticket_satisfaction_rating",
      "satisfaction_rating",
      "rating",
      "ticket_rating",
    ],
  },
  {
    key: "comment",
    label: "Ticket satisfaction comment",
    required: false,
    aliases: [
      "ticket_satisfaction_comment",
      "satisfaction_comment",
      "comment",
      "feedback",
    ],
  },
  {
    key: "reason",
    label: "Ticket satisfaction reason",
    required: false,
    aliases: [
      "ticket_satisfaction_reason",
      "satisfaction_reason",
      "reason",
      "rating_reason",
    ],
  },
  {
    key: "updated_date",
    label: "Ticket updated - Date",
    required: true,
    aliases: [
      "ticket_updated_date",
      "ticket_updated___date",
      "ticket_updated",
      "updated_date",
      "date",
    ],
  },
  {
    key: "solved_tickets",
    label: "Solved tickets",
    required: false,
    aliases: [
      "solved_tickets",
      "solved",
      "is_solved",
      "ticket_solved",
      "solved_count",
    ],
  },
];

export function normalizeSatisfactionRating(value = "") {
  const clean = cleanText(value).toLowerCase();

  if (!clean) return "Unknown";
  if (clean.includes("good")) return "Good";
  if (clean.includes("bad")) return "Bad";
  if (clean.includes("offered")) return "Offered";
  if (clean.includes("unoffered")) return "Unoffered";

  return cleanText(value) || "Unknown";
}

export function normalizeSolved(value = "") {
  const clean = cleanText(value).toLowerCase();

  if (clean === "1") return true;
  if (clean === "true") return true;
  if (clean === "yes") return true;
  if (clean === "y") return true;
  if (clean === "solved") return true;

  return false;
}

export function detectSatisfactionMapping(columns = []) {
  const mapping = {};

  const normalized = columns.map((column) => ({
    original: column,
    normalized: normalizeColumnName(column),
  }));

  SATISFACTION_FIELDS.forEach((field) => {
    const match = normalized.find((column) =>
      field.aliases.includes(column.normalized)
    );

    mapping[field.key] = match?.original || "";
  });

  return mapping;
}

export function applySatisfactionMapping(rows = [], mapping = {}) {
  return rows
    .map((row, index) => {
      const item = {
        id: index + 1,
        ticket_id: "",
        rating: "",
        comment: "",
        reason: "",
        updated_date: "",
        date_display: "",
        date_key: "",
        month_key: "",
        solved_tickets: 0,
        is_solved: false,
        raw: row,
      };

      SATISFACTION_FIELDS.forEach((field) => {
        const sourceColumn = mapping[field.key];

        if (sourceColumn && row[sourceColumn] !== undefined) {
          item[field.key] = row[sourceColumn];
        }
      });

      item.ticket_id = cleanText(item.ticket_id);
      item.rating = normalizeSatisfactionRating(item.rating);
      item.comment = cleanText(item.comment);
      item.reason = cleanText(item.reason) || "No reason given";
      item.updated_date = cleanText(item.updated_date);
      item.date_key = formatDateKey(item.updated_date);
      item.date_display = formatDisplayDate(item.updated_date);
      item.month_key = formatMonthKey(item.updated_date);
      item.is_solved = normalizeSolved(item.solved_tickets);
      item.solved_tickets = item.is_solved ? 1 : 0;

      return item;
    })
    .filter(
      (item) =>
        item.ticket_id ||
        item.rating !== "Unknown" ||
        item.comment ||
        item.reason !== "No reason given" ||
        item.updated_date
    );
}

export function getSatisfactionUniqueValues(rows = [], key) {
  return Array.from(
    new Set(rows.map((row) => String(row[key] || "").trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
}

export function filterSatisfaction(rows = [], filters = {}) {
  const search = String(filters.search || "").toLowerCase().trim();

  return rows.filter((row) => {
    const matchesSearch =
      !search ||
      String(row.ticket_id || "").toLowerCase().includes(search) ||
      String(row.rating || "").toLowerCase().includes(search) ||
      String(row.comment || "").toLowerCase().includes(search) ||
      String(row.reason || "").toLowerCase().includes(search);

    const matchesRating = !filters.rating || row.rating === filters.rating;

    const matchesReason = !filters.reason || row.reason === filters.reason;

    const matchesSolved =
      !filters.solvedStatus ||
      (filters.solvedStatus === "solved" && row.is_solved) ||
      (filters.solvedStatus === "not_solved" && !row.is_solved);

    const dateKey = row.date_key;

    const matchesFrom =
      !filters.dateFrom || dateKey === "Unknown" || dateKey >= filters.dateFrom;

    const matchesTo =
      !filters.dateTo || dateKey === "Unknown" || dateKey <= filters.dateTo;

    return (
      matchesSearch &&
      matchesRating &&
      matchesReason &&
      matchesSolved &&
      matchesFrom &&
      matchesTo
    );
  });
}