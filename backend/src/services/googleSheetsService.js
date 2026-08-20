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
      "ticket_support_category",
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
    ]);

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

    supportCategory,
    support_category:
      supportCategory,

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