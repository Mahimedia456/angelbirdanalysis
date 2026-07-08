import {
  supabaseAdmin,
} from "../config/supabase.js";

const PAGE_SIZE = 1000;

function clean(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizeTicketNumber(value) {
  return String(value || "")
    .trim()
    .replace(/\.0+$/, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function isRmaProcedure(row) {
  const procedure = clean(row.procedure || row.Procedure);

  return (
    procedure.includes("rma") ||
    procedure.includes("broken plastic") ||
    procedure.includes("warranty claim")
  );
}

function getTicketDedupeScore(row) {
  let score = 0;

  if (isRmaProcedure(row)) score += 100;
  if (row.procedure) score += 10;
  if (row.support_category) score += 8;
  if (row.product_category) score += 6;
  if (row.product_1) score += 4;
  if (row.ticket_subject) score += 3;
  if (row.ticket_date) score += 1;

  return score;
}

function mergeTicketRows(current, candidate) {
  if (!current) return candidate;

  const currentScore = getTicketDedupeScore(current);
  const candidateScore = getTicketDedupeScore(candidate);

  const base = candidateScore > currentScore ? candidate : current;
  const fallback = candidateScore > currentScore ? current : candidate;

  return {
    ...fallback,
    ...base,

    procedure:
      isRmaProcedure(base)
        ? "RMA"
        : base.procedure || fallback.procedure || null,

    ticket_subject:
      base.ticket_subject ||
      fallback.ticket_subject ||
      null,

    support_category:
      base.support_category ||
      fallback.support_category ||
      null,

    product_category:
      base.product_category ||
      fallback.product_category ||
      null,

    product_1:
      base.product_1 ||
      fallback.product_1 ||
      null,

    product_2:
      base.product_2 ||
      fallback.product_2 ||
      null,
  };
}

function dedupeTickets(rows = []) {
  const map = new Map();

  rows.forEach((row) => {
    const key = normalizeTicketNumber(
      row.ticket_number ||
        row.ticketNumber ||
        row.ticket_no ||
        row.ticketNo ||
        row.ticket_id ||
        row.ticketId
    );

    if (!key) {
      return;
    }

    const current = map.get(key);

    map.set(
      key,
      mergeTicketRows(current, row)
    );
  });

  return Array.from(map.values()).sort((a, b) =>
    String(a.ticket_date || "").localeCompare(String(b.ticket_date || ""))
  );
}

async function fetchAllRows({
  table,
  orderColumn,
}) {
  let allRows = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;

    const {
      data,
      error,
    } = await supabaseAdmin
      .from(table)
      .select("*")
      .order(orderColumn, {
        ascending: true,
      })
      .range(from, to);

    if (error) {
      throw error;
    }

    const rows = data || [];

    allRows = allRows.concat(rows);

    if (rows.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return allRows;
}

export async function getReportsData(request, response, next) {
  try {
    const [
      ticketRows,
      satisfaction,
    ] = await Promise.all([
      fetchAllRows({
        table: "ticket_records",
        orderColumn: "ticket_date",
      }),

      fetchAllRows({
        table: "satisfaction_records",
        orderColumn: "updated_date",
      }),
    ]);

    const tickets = dedupeTickets(ticketRows);

    return response.json({
      success: true,
      data: {
        selectedPeriod: null,
        periods: [],
        tickets,
        satisfaction,
      },
    });
  } catch (error) {
    next(error);
  }
}