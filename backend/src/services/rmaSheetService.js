import { google } from "googleapis";

import {
  buildRmaAnalytics,
  deduplicateRmaRows,
  normalizeRmaRows,
} from "./rmaAnalyticsService.js";

const DEFAULT_SHEET_ID = "1LM5A2NrX4O0M8aOwx29tLMXnTiRG5kAAYQiYxwDXIJc";

const SHEET_ID = process.env.GOOGLE_SHEET_ID || DEFAULT_SHEET_ID;
const RMA_TAB = process.env.GOOGLE_SHEET_RMA_TAB || "RMA";

function cleanText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeHeader(value) {
  return cleanText(value)
    .replace(/^\uFEFF/, "")
    .replace(/[^\w\s#/-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_")
    .replace(/\/+/g, "_")
    .toLowerCase();
}

function makeUniqueHeader(baseKey, existingKeys) {
  let key = baseKey || "column";

  if (!existingKeys.has(key)) {
    existingKeys.add(key);
    return key;
  }

  let counter = 2;

  while (existingKeys.has(`${key}_${counter}`)) {
    counter += 1;
  }

  const uniqueKey = `${key}_${counter}`;

  existingKeys.add(uniqueKey);

  return uniqueKey;
}

function valuesToObjects(values = []) {
  if (!Array.isArray(values) || values.length < 2) {
    return [];
  }

  const headerRow = values[0] || [];
  const existingKeys = new Set();

  const headers = headerRow.map((header) =>
    makeUniqueHeader(normalizeHeader(header), existingKeys)
  );

  return values
    .slice(1)
    .map((row, rowIndex) => {
      const item = {
        sheet_row_number: rowIndex + 2,
      };

      headers.forEach((key, index) => {
        item[key] = cleanText(row[index]);
      });

      return item;
    })
    .filter((row) =>
      Object.entries(row).some(([key, value]) => {
        if (key === "sheet_row_number") return false;

        return cleanText(value) !== "";
      })
    );
}

function getPrivateKey() {
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || "";

  if (!rawKey) return "";

  return rawKey.replace(/\\n/g, "\n");
}

async function getSheetsClient() {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

  if (apiKey) {
    return google.sheets({
      version: "v4",
      auth: apiKey,
    });
  }

  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = getPrivateKey();

  if (!serviceAccountEmail || !privateKey) {
    throw new Error(
      "Google Sheets credentials missing. Add GOOGLE_SHEETS_API_KEY or service account credentials."
    );
  }

  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return google.sheets({
    version: "v4",
    auth,
  });
}

async function readSheetRange(tabName) {
  const sheets = await getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${tabName}'!A:ZZ`,
    valueRenderOption: "FORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
  });

  return response?.data?.values || [];
}

async function tryReadTab(tabName) {
  try {
    const values = await readSheetRange(tabName);

    return {
      ok: true,
      tabName,
      rows: valuesToObjects(values),
    };
  } catch (error) {
    return {
      ok: false,
      tabName,
      rows: [],
      error,
    };
  }
}

export async function getSheetRmaReportData() {
  // RMA reporting must always come from the dedicated RMA tab.
  // Never fall back to Ticket because the two tabs have different semantics
  // and the RMA TYPE history is row-based.
  const tabResult = await tryReadTab(RMA_TAB);

  if (!tabResult.ok) {
    const message =
      tabResult?.error?.message ||
      `Unable to read Google Sheet tab ${RMA_TAB}.`;

    const error = new Error(
      `RMA report could not read the dedicated "${RMA_TAB}" Sheet tab. ${message}`
    );

    error.code = "RMA_SHEET_TAB_READ_FAILED";
    throw error;
  }

  const normalizedRows = normalizeRmaRows(
    tabResult.rows.map((row) => ({
      ...row,
      source: "google_sheet_rma_tab",
    }))
  );

  // Reporting is unique by Ticket Number, matching the Ticket report.
  // When the RMA Sheet contains multiple history rows for one ticket, the
  // latest row wins and blank fields are backfilled from the older duplicate.
  const reportRows = deduplicateRmaRows(normalizedRows);

  return {
    ok: true,
    source: "google_sheet_rma_tab",
    sheetId: SHEET_ID,
    tab: RMA_TAB,
    rows: reportRows,
    summary: {
      totalRows: reportRows.length,
      rawRows: normalizedRows.length,
      duplicateRows: Math.max(normalizedRows.length - reportRows.length, 0),
      sourceRows: tabResult.rows.length,
      sourceTab: RMA_TAB,
      generatedAt: new Date().toISOString(),
    },
    analytics: buildRmaAnalytics(reportRows),
  };
}
