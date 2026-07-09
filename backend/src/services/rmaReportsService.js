import { supabaseAdmin } from "../config/supabase.js";

import {
  buildRmaAnalytics,
  deduplicateRmaRows,
  normalizeRmaRows,
} from "./rmaAnalyticsService.js";

const PAGE_SIZE = 1000;

async function fetchAllTicketRecords() {
  const rows = [];

  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabaseAdmin
      .from("ticket_records")
      .select("*")
      .range(from, to);

    if (error) {
      throw error;
    }

    const pageRows = Array.isArray(data) ? data : [];

    rows.push(...pageRows);

    if (pageRows.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return rows;
}

export async function getUploadedRmaReportData() {
  const ticketRows = await fetchAllTicketRecords();

  const normalizedRows = normalizeRmaRows(
    ticketRows.map((row) => ({
      ...row,
      source: "uploaded_csv",
    }))
  );

  const uniqueRows = deduplicateRmaRows(normalizedRows);

  return {
    ok: true,
    source: "uploaded_csv",
    rows: uniqueRows,
    summary: {
      totalRows: uniqueRows.length,
      rawRows: normalizedRows.length,
      duplicateRows: normalizedRows.length - uniqueRows.length,
      generatedAt: new Date().toISOString(),
    },
    analytics: buildRmaAnalytics(uniqueRows),
  };
}