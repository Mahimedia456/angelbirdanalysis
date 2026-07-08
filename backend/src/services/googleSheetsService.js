import { google } from "googleapis";

const DEFAULT_SHEET_ID = "1LM5A2NrX4O0M8aOwx29tLMXnTiRG5kAAYQiYxwDXIJc";

const SHEET_ID = process.env.GOOGLE_SHEET_ID || DEFAULT_SHEET_ID;
const TICKET_TAB = process.env.GOOGLE_SHEET_TICKET_TAB || "Ticket";
const SATISFACTION_TAB =
  process.env.GOOGLE_SHEET_SATISFACTION_TAB || "Satisfaction";

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

  if (!rawKey) {
    return "";
  }

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
      "Google Sheets credentials missing. Add GOOGLE_SHEETS_API_KEY or service account credentials in backend .env."
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

async function readSheetRange({ tabName, range = "A:ZZ" }) {
  const sheets = await getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${tabName}'!${range}`,
    valueRenderOption: "FORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
  });

  return response?.data?.values || [];
}

export async function fetchGoogleSheetDataset() {
  const [ticketValues, satisfactionValues] = await Promise.all([
    readSheetRange({
      tabName: TICKET_TAB,
    }),
    readSheetRange({
      tabName: SATISFACTION_TAB,
    }),
  ]);

  const tickets = valuesToObjects(ticketValues);
  const satisfaction = valuesToObjects(satisfactionValues);

  return {
    sheetId: SHEET_ID,
    tabs: {
      tickets: TICKET_TAB,
      satisfaction: SATISFACTION_TAB,
    },
    tickets,
    satisfaction,
    summary: {
      ticketCount: tickets.length,
      satisfactionCount: satisfaction.length,
      totalRows: tickets.length + satisfaction.length,
      updatedAt: new Date().toISOString(),
    },
  };
}

export async function fetchGoogleSheetOverview() {
  const data = await fetchGoogleSheetDataset();

  return {
    ok: true,
    source: "google_sheet",
    sheetId: data.sheetId,
    tabs: data.tabs,
    periodSummary: {
      ticketCount: data.summary.ticketCount,
      satisfactionCount: data.summary.satisfactionCount,
      importBatchCount: 0,
      productCount: 0,
    },
    summary: data.summary,
  };
}