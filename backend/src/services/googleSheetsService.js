import { google } from "googleapis";

const DEFAULT_SHEET_ID =
  "1LM5A2NrX4O0M8aOwx29tLMXnTiRG5kAAYQiYxwDXIJc";

const SHEET_ID =
  process.env.GOOGLE_SHEET_ID ||
  DEFAULT_SHEET_ID;

const TICKET_TAB =
  process.env.GOOGLE_SHEET_TICKET_TAB ||
  "Ticket";

const SATISFACTION_TAB =
  process.env.GOOGLE_SHEET_SATISFACTION_TAB ||
  "Satisfaction";

function cleanText(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeHeader(value) {
  return cleanText(value)
    .replace(/^\uFEFF/, "")
    .toLowerCase()

    // Convert special separators into underscore.
    .replace(/[\s\-\/]+/g, "_")

    // Remove anything remaining that should not be part of a key.
    .replace(/[^\w]/g, "_")

    // Collapse repeated underscores.
    .replace(/_+/g, "_")

    // Remove underscores from start/end.
    .replace(/^_+|_+$/g, "");
}

function makeUniqueHeader(
  baseKey,
  existingKeys
) {
  let key =
    baseKey || "column";

  if (!existingKeys.has(key)) {
    existingKeys.add(key);
    return key;
  }

  let counter = 2;

  while (
    existingKeys.has(
      `${key}_${counter}`
    )
  ) {
    counter += 1;
  }

  const uniqueKey =
    `${key}_${counter}`;

  existingKeys.add(uniqueKey);

  return uniqueKey;
}

function valuesToObjects(
  values = []
) {
  if (
    !Array.isArray(values) ||
    values.length < 2
  ) {
    return [];
  }

  const headerRow =
    values[0] || [];

  const existingKeys =
    new Set();

  const headers =
    headerRow.map((header) =>
      makeUniqueHeader(
        normalizeHeader(header),
        existingKeys
      )
    );

  return values
    .slice(1)
    .map(
      (
        row,
        rowIndex
      ) => {
        const item = {
          sheet_row_number:
            rowIndex + 2,
        };

        headers.forEach(
          (key, index) => {
            item[key] =
              cleanText(
                row[index]
              );
          }
        );

        return item;
      }
    )
    .filter((row) =>
      Object.entries(row).some(
        ([key, value]) => {
          if (
            key ===
            "sheet_row_number"
          ) {
            return false;
          }

          return (
            cleanText(value) !== ""
          );
        }
      )
    );
}

function pick(
  row,
  keys = []
) {
  for (const key of keys) {
    const value =
      row?.[key];

    if (
      value !== undefined &&
      value !== null &&
      cleanText(value) !== ""
    ) {
      return cleanText(value);
    }
  }

  return "";
}

function normalizeDate(value) {
  const raw =
    cleanText(value);

  if (!raw) {
    return "";
  }

  // Already ISO.
  const iso = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})/
  );

  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }

  // Example:
  // 6/21/2026
  // 06/21/2026
  const slash = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/
  );

  if (slash) {
    const month =
      Number(slash[1]);

    const day =
      Number(slash[2]);

    let year =
      Number(slash[3]);

    if (year < 100) {
      year += 2000;
    }

    if (
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      return [
        String(year).padStart(
          4,
          "0"
        ),

        String(month).padStart(
          2,
          "0"
        ),

        String(day).padStart(
          2,
          "0"
        ),
      ].join("-");
    }
  }

  const parsed =
    new Date(raw);

  if (
    !Number.isNaN(
      parsed.getTime()
    )
  ) {
    return parsed
      .toISOString()
      .slice(0, 10);
  }

  return "";
}

/*
 * ---------------------------------------------------------
 * TICKET NORMALIZATION
 * ---------------------------------------------------------
 */

function normalizeTicketRow(
  row
) {
  const ticketNumber =
    pick(row, [
      "ticket_id",
      "ticket_number",
      "ticket_no",
      "ticket",
    ]);

  const date =
    normalizeDate(
      pick(row, [
        "date",
        "ticket_date",
        "submitted",
        "submitted_date",
        "ticket_updated_date",
      ])
    );

  const tse =
    pick(row, [
      "tse",
      "agent",
      "engineer",
    ]);

  const region =
    pick(row, [
      "region",
    ]);

  const product1 =
    pick(row, [
      "product_1",
      "product1",
      "product",
    ]);

  const product2 =
    pick(row, [
      "product_2",
      "product2",
    ]);

  const ticketSubject =
    pick(row, [
      "ticket_subject",
      "subject",
    ]);

  const supportCategory =
    pick(row, [
      "support_category",
      "supportcategory",
      "ticket_support_category",
      "ticket_supportcategory",
      "category",
    ]);

  const productCategory =
    pick(row, [
      "product_category",
    ]);

  const procedure =
    pick(row, [
      "procedure",
    ]);

  const rmaType =
    pick(row, [
      "rma_type",
      "rmatype",
      "rma type",
    ]);

  // If the Ticket sheet has an RMA classification but Support Category is
  // blank, expose it as RMA so the Support Category filter/chart does not
  // silently lose RMA tickets.
  const effectiveSupportCategory =
    supportCategory || (rmaType ? "RMA" : "");

  return {
    ...row,

    ticketNumber,
    ticket_number:
      ticketNumber,

    ticketId:
      ticketNumber,
    ticket_id:
      ticketNumber,

    date,
    date_display:
      date,

    ticketDate:
      date,
    ticket_date:
      date,

    tse,
    region,

    product1,
    product_1:
      product1,

    product2,
    product_2:
      product2,

    ticketSubject,
    ticket_subject:
      ticketSubject,

    supportCategory: effectiveSupportCategory,
    support_category:
      effectiveSupportCategory,

    productCategory,
    product_category:
      productCategory,

    procedure,

    rmaType,
    rma_type:
      rmaType,
  };
}

/*
 * ---------------------------------------------------------
 * SATISFACTION NORMALIZATION
 * ---------------------------------------------------------
 *
 * Sheet headers:
 *
 * Ticket ID
 * Ticket satisfaction rating
 * Ticket satisfaction comment
 * Ticket updated - Date
 *
 * become:
 *
 * ticket_id
 * ticket_satisfaction_rating
 * ticket_satisfaction_comment
 * ticket_updated_date
 *
 * Then we map them to the field names the frontend already uses.
 */

function normalizeSatisfactionRow(
  row
) {
  const ticketNumber =
    pick(row, [
      "ticket_id",
      "ticket_number",
      "ticket_no",
      "ticket",
    ]);

  const rating =
    pick(row, [
      "ticket_satisfaction_rating",
      "satisfaction_rating",
      "rating",
    ]);

  const comment =
    pick(row, [
      "ticket_satisfaction_comment",
      "satisfaction_comment",
      "comment",
      "comments",
      "feedback",
    ]);

  const updatedDate =
    normalizeDate(
      pick(row, [
        "ticket_updated_date",
        "updated_date",
        "updated",
        "date",
        "response_date",
      ])
    );

  const internalNote =
    pick(row, [
      "internal_note",
      "internal_team_note",
      "internal_notes",
    ]);

  const externalTeamNote =
    pick(row, [
      "external_team_note",
      "external_note",
      "external_team_notes",
    ]);

  return {
    ...row,

    /*
     * Ticket aliases used throughout existing frontend.
     */
    ticketNumber,
    ticket_number:
      ticketNumber,

    ticketId:
      ticketNumber,
    ticket_id:
      ticketNumber,

    /*
     * Rating aliases.
     */
    rating,

    satisfactionRating:
      rating,

    satisfaction_rating:
      rating,

    /*
     * Comment aliases.
     */
    comment,

    comments:
      comment,

    feedback:
      comment,

    satisfactionComment:
      comment,

    satisfaction_comment:
      comment,

    /*
     * Date aliases.
     */
    updatedDate,

    updated_date:
      updatedDate,

    date:
      updatedDate,

    date_display:
      updatedDate,

    responseDate:
      updatedDate,

    response_date:
      updatedDate,

    /*
     * Team-note aliases used by the web reporting UI and AI summary.
     */
    internalNote,
    internal_note:
      internalNote,

    externalTeamNote,
    external_team_note:
      externalTeamNote,
  };
}

function normalizeTicketRows(
  rows = []
) {
  return rows.map(
    normalizeTicketRow
  );
}

function normalizeSatisfactionRows(
  rows = []
) {
  return rows.map(
    normalizeSatisfactionRow
  );
}

function getPrivateKey() {
  const rawKey =
    process.env
      .GOOGLE_PRIVATE_KEY ||
    "";

  if (!rawKey) {
    return "";
  }

  return rawKey.replace(
    /\\n/g,
    "\n"
  );
}

async function getSheetsClient() {
  const apiKey =
    process.env
      .GOOGLE_SHEETS_API_KEY;

  if (apiKey) {
    return google.sheets({
      version: "v4",
      auth: apiKey,
    });
  }

  const serviceAccountEmail =
    process.env
      .GOOGLE_SERVICE_ACCOUNT_EMAIL;

  const privateKey =
    getPrivateKey();

  if (
    !serviceAccountEmail ||
    !privateKey
  ) {
    throw new Error(
      "Google Sheets credentials missing. Add GOOGLE_SHEETS_API_KEY or service account credentials in backend .env."
    );
  }

  const auth =
    new google.auth.JWT({
      email:
        serviceAccountEmail,

      key:
        privateKey,

      scopes: [
        "https://www.googleapis.com/auth/spreadsheets.readonly",
      ],
    });

  return google.sheets({
    version: "v4",
    auth,
  });
}

async function readSheetRange({
  tabName,
  range = "A:ZZ",
}) {
  const sheets =
    await getSheetsClient();

  const response =
    await sheets
      .spreadsheets
      .values
      .get({
        spreadsheetId:
          SHEET_ID,

        range:
          `'${tabName}'!${range}`,

        valueRenderOption:
          "FORMATTED_VALUE",

        dateTimeRenderOption:
          "FORMATTED_STRING",
      });

  return (
    response?.data
      ?.values || []
  );
}

export async function fetchGoogleSheetDataset() {
  const [
    ticketValues,
    satisfactionValues,
  ] = await Promise.all([
    readSheetRange({
      tabName:
        TICKET_TAB,
    }),

    readSheetRange({
      tabName:
        SATISFACTION_TAB,
    }),
  ]);

  const rawTickets =
    valuesToObjects(
      ticketValues
    );

  const rawSatisfaction =
    valuesToObjects(
      satisfactionValues
    );

  const tickets =
    normalizeTicketRows(
      rawTickets
    );

  const satisfaction =
    normalizeSatisfactionRows(
      rawSatisfaction
    );

  return {
    sheetId:
      SHEET_ID,

    tabs: {
      tickets:
        TICKET_TAB,

      satisfaction:
        SATISFACTION_TAB,
    },

    tickets,

    satisfaction,

    summary: {
      ticketCount:
        tickets.length,

      satisfactionCount:
        satisfaction.length,

      totalRows:
        tickets.length +
        satisfaction.length,

      updatedAt:
        new Date()
          .toISOString(),
    },
  };
}


function columnNumberToLetters(columnNumber) {
  let number = Number(columnNumber || 0);
  let letters = "";

  while (number > 0) {
    const remainder = (number - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    number = Math.floor((number - 1) / 26);
  }

  return letters || "A";
}

function normalizeAppsScriptWebAppUrl(value) {
  const raw = String(value || "").trim();

  if (!raw) return "";

  // Allow storing just the deployment id in .env.
  if (/^[A-Za-z0-9_-]{20,}$/.test(raw) && !raw.includes("/")) {
    return `https://script.google.com/macros/s/${raw}/exec`;
  }

  let parsed;

  try {
    parsed = new URL(raw);
  } catch {
    return raw;
  }

  const deploymentMatch = parsed.pathname.match(/\/macros\/s\/([^/]+)\/(?:exec|dev)\/?$/i);

  if (deploymentMatch?.[1]) {
    return `https://script.google.com/macros/s/${deploymentMatch[1]}/exec`;
  }

  return raw.replace(/\/$/, "");
}

function getAppsScriptNotesConfig() {
  const url = normalizeAppsScriptWebAppUrl(
    process.env.GOOGLE_APPS_SCRIPT_NOTES_URL ||
      process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL
  );

  const token = String(
    process.env.GOOGLE_APPS_SCRIPT_NOTES_TOKEN || ""
  ).trim();

  return { url, token };
}

function describeAppsScriptUrlProblem(url) {
  const value = String(url || "");

  if (/docs\.google\.com\/spreadsheets/i.test(value)) {
    return "GOOGLE_APPS_SCRIPT_NOTES_URL is a Google Sheet URL. Use the Apps Script Web app deployment URL ending in /exec.";
  }

  if (/script\.google\.com\/(?:home|d)\//i.test(value)) {
    return "GOOGLE_APPS_SCRIPT_NOTES_URL points to the Apps Script editor/project, not a Web app deployment. Use Deploy -> Manage deployments -> Web app and copy the URL ending in /exec.";
  }

  if (!/script\.google\.com\/macros\/s\/[^/]+\/exec/i.test(value)) {
    return "Use the Apps Script Web app deployment URL in this format: https://script.google.com/macros/s/DEPLOYMENT_ID/exec";
  }

  return "The Apps Script Web app deployment could not be found. Create/redeploy it as Web app (Execute as: Me, Who has access: Anyone) and copy the latest /exec URL.";
}

async function updateSatisfactionNotesViaAppsScript({
  ticketId,
  internalNote,
  externalTeamNote,
  updateInternalNote = false,
  updateExternalTeamNote = false,
}) {
  const { url, token } = getAppsScriptNotesConfig();

  if (!url || !token) {
    return null;
  }

  const cleanTicketId = cleanText(ticketId);

  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/i.test(url)) {
    const error = new Error(describeAppsScriptUrlProblem(url));
    error.statusCode = 503;
    error.code = "GOOGLE_APPS_SCRIPT_NOTES_URL_INVALID";
    throw error;
  }

  if (!cleanTicketId) {
    const error = new Error(
      "Ticket ID is required to update satisfaction notes through Google Apps Script."
    );

    error.statusCode = 400;
    error.code = "SATISFACTION_TICKET_ID_REQUIRED";
    throw error;
  }

  const payload = {
    token,
    action: "updateNotes",
    ticketId: cleanTicketId,
  };

  if (updateInternalNote) {
    payload.internalNote = cleanText(internalNote);
  }

  if (updateExternalTeamNote) {
    payload.externalTeamNote = cleanText(externalTeamNote);
  }

  let response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      redirect: "follow",
    });
  } catch (cause) {
    const error = new Error(
      "Unable to reach the Google Apps Script notes writer. Check GOOGLE_APPS_SCRIPT_NOTES_URL and the deployment status."
    );

    error.statusCode = 502;
    error.code = "GOOGLE_APPS_SCRIPT_NOTES_UNREACHABLE";
    error.cause = cause;
    throw error;
  }

  const responseText = await response.text();
  let result = null;

  try {
    result = responseText
      ? JSON.parse(responseText)
      : null;
  } catch {
    result = null;
  }

  if (!response.ok || !result?.ok) {
    let message = result?.error ||
      `Google Apps Script notes writer failed with HTTP ${response.status}.`;

    if (response.status === 404) {
      message = `${describeAppsScriptUrlProblem(url)} Current deployment returned HTTP 404.`;
    } else if (response.status === 401 || response.status === 403) {
      message = "Google Apps Script refused the request. Confirm the Web app is deployed with Execute as: Me and Who has access: Anyone, then redeploy and use the latest /exec URL.";
    }

    const error = new Error(message);
    error.statusCode = 502;
    error.code = response.status === 404
      ? "GOOGLE_APPS_SCRIPT_DEPLOYMENT_NOT_FOUND"
      : "GOOGLE_APPS_SCRIPT_NOTES_WRITE_FAILED";
    error.details = {
      httpStatus: response.status,
      response: result || responseText || null,
    };
    throw error;
  }

  return {
    ok: true,
    writer: "apps_script",
    ticketId: cleanTicketId,
    sheetRowNumber: result.row || null,
    internalNote: updateInternalNote
      ? cleanText(internalNote)
      : undefined,
    externalTeamNote: updateExternalTeamNote
      ? cleanText(externalTeamNote)
      : undefined,
    updatedAt: new Date().toISOString(),
  };
}

export async function getSatisfactionNotesWriterHealth() {
  const { url, token } = getAppsScriptNotesConfig();

  if (!url || !token) {
    return {
      ok: false,
      configured: false,
      writer: "apps_script",
      message: "Set GOOGLE_APPS_SCRIPT_NOTES_URL and GOOGLE_APPS_SCRIPT_NOTES_TOKEN.",
    };
  }

  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/i.test(url)) {
    return {
      ok: false,
      configured: true,
      writer: "apps_script",
      message: describeAppsScriptUrlProblem(url),
    };
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { Accept: "application/json" },
    });

    const text = await response.text();
    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      return {
        ok: false,
        configured: true,
        writer: "apps_script",
        httpStatus: response.status,
        message: response.status === 404
          ? describeAppsScriptUrlProblem(url)
          : `Apps Script health check returned HTTP ${response.status}.`,
      };
    }

    return {
      ok: Boolean(data?.ok),
      configured: true,
      writer: "apps_script",
      httpStatus: response.status,
      version: data?.version || null,
      scriptConfigured: data?.configured !== false,
      tab: data?.tab || SATISFACTION_TAB,
      message: data?.ok
        ? "Apps Script notes writer is reachable."
        : "Apps Script responded but did not report ok=true.",
    };
  } catch (error) {
    return {
      ok: false,
      configured: true,
      writer: "apps_script",
      message: error?.message || "Unable to reach Apps Script notes writer.",
    };
  }
}

async function getWritableSheetsClient() {
  const serviceAccountEmail =
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "";

  const privateKey = getPrivateKey();

  if (!serviceAccountEmail || !privateKey) {
    const error = new Error(
      "Google Sheets note writing is not configured. Preferred: set GOOGLE_APPS_SCRIPT_NOTES_URL and GOOGLE_APPS_SCRIPT_NOTES_TOKEN. Alternative: configure GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY."
    );

    error.statusCode = 503;
    error.code = "GOOGLE_SHEETS_WRITE_CREDENTIALS_MISSING";
    throw error;
  }

  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });

  return google.sheets({
    version: "v4",
    auth,
  });
}

function findHeaderIndex(headers = [], candidateKeys = []) {
  const normalizedCandidates = new Set(
    candidateKeys.map((value) => normalizeHeader(value))
  );

  return headers.findIndex((header) =>
    normalizedCandidates.has(normalizeHeader(header))
  );
}

async function ensureSatisfactionNoteColumns(sheets) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${SATISFACTION_TAB}'!1:1`,
    valueRenderOption: "FORMATTED_VALUE",
  });

  const headers = [
    ...(response?.data?.values?.[0] || []),
  ];

  const required = [
    {
      key: "internalNote",
      label: "Internal Note",
      candidates: [
        "Internal Note",
        "internal_note",
        "Internal Team Note",
      ],
    },
    {
      key: "externalTeamNote",
      label: "External Team Note",
      candidates: [
        "External Team Note",
        "external_team_note",
        "External Note",
      ],
    },
  ];

  let headerChanged = false;
  const indexes = {};

  required.forEach((field) => {
    let index = findHeaderIndex(headers, field.candidates);

    if (index < 0) {
      headers.push(field.label);
      index = headers.length - 1;
      headerChanged = true;
    }

    indexes[field.key] = index;
  });

  if (headerChanged) {
    const endColumn = columnNumberToLetters(headers.length);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `'${SATISFACTION_TAB}'!A1:${endColumn}1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [headers],
      },
    });
  }

  return {
    headers,
    indexes,
  };
}

async function resolveSatisfactionRowNumber({
  sheets,
  sheetRowNumber,
  ticketId,
  headers,
}) {
  const numericRow = Number(sheetRowNumber);

  if (Number.isInteger(numericRow) && numericRow >= 2) {
    return numericRow;
  }

  const cleanTicketId = cleanText(ticketId);

  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/i.test(url)) {
    const error = new Error(describeAppsScriptUrlProblem(url));
    error.statusCode = 503;
    error.code = "GOOGLE_APPS_SCRIPT_NOTES_URL_INVALID";
    throw error;
  }

  if (!cleanTicketId) {
    return null;
  }

  const ticketColumnIndex = findHeaderIndex(headers, [
    "Ticket ID",
    "ticket_id",
    "Ticket Number",
    "ticket_number",
    "Ticket",
  ]);

  if (ticketColumnIndex < 0) {
    return null;
  }

  const ticketColumnLetter = columnNumberToLetters(
    ticketColumnIndex + 1
  );

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${SATISFACTION_TAB}'!${ticketColumnLetter}2:${ticketColumnLetter}`,
    valueRenderOption: "FORMATTED_VALUE",
  });

  const values = response?.data?.values || [];

  const rowIndex = values.findIndex(
    (row) => cleanText(row?.[0]) === cleanTicketId
  );

  return rowIndex >= 0 ? rowIndex + 2 : null;
}

export async function updateSatisfactionNotes({
  sheetRowNumber,
  ticketId,
  internalNote,
  externalTeamNote,
  updateInternalNote = false,
  updateExternalTeamNote = false,
}) {
  if (!updateInternalNote && !updateExternalTeamNote) {
    const error = new Error(
      "Provide Internal Note or External Team Note to update."
    );

    error.statusCode = 400;
    throw error;
  }

  const appsScriptResult =
    await updateSatisfactionNotesViaAppsScript({
      ticketId,
      internalNote,
      externalTeamNote,
      updateInternalNote,
      updateExternalTeamNote,
    });

  if (appsScriptResult) {
    return appsScriptResult;
  }

  const sheets = await getWritableSheetsClient();
  const { headers, indexes } =
    await ensureSatisfactionNoteColumns(sheets);

  const rowNumber = await resolveSatisfactionRowNumber({
    sheets,
    sheetRowNumber,
    ticketId,
    headers,
  });

  if (!rowNumber) {
    const error = new Error(
      "Unable to locate the satisfaction row in Google Sheets."
    );

    error.statusCode = 404;
    error.code = "SATISFACTION_ROW_NOT_FOUND";
    throw error;
  }

  const data = [];

  if (updateInternalNote) {
    const column = columnNumberToLetters(
      Number(indexes.internalNote) + 1
    );

    data.push({
      range: `'${SATISFACTION_TAB}'!${column}${rowNumber}`,
      values: [[cleanText(internalNote)]],
    });
  }

  if (updateExternalTeamNote) {
    const column = columnNumberToLetters(
      Number(indexes.externalTeamNote) + 1
    );

    data.push({
      range: `'${SATISFACTION_TAB}'!${column}${rowNumber}`,
      values: [[cleanText(externalTeamNote)]],
    });
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: "RAW",
      data,
    },
  });

  return {
    ok: true,
    ticketId: cleanText(ticketId),
    sheetRowNumber: rowNumber,
    internalNote: updateInternalNote
      ? cleanText(internalNote)
      : undefined,
    externalTeamNote: updateExternalTeamNote
      ? cleanText(externalTeamNote)
      : undefined,
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchGoogleSheetOverview() {
  const data =
    await fetchGoogleSheetDataset();

  return {
    ok: true,

    source:
      "google_sheet",

    sheetId:
      data.sheetId,

    tabs:
      data.tabs,

    periodSummary: {
      ticketCount:
        data.summary
          .ticketCount,

      satisfactionCount:
        data.summary
          .satisfactionCount,

      importBatchCount: 0,

      productCount: 0,
    },

    summary:
      data.summary,
  };
}