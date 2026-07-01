import { env } from "../config/env.js";
import {
  getDatabasePool,
} from "../config/database.js";
import {
  supabaseAdmin,
} from "../config/supabase.js";

import {
  createFileChecksum,
  createRowHash,
} from "../utils/rowHash.js";

const DATASET_TABLES = {
  tickets: "ticket_records",
  products: "product_records",
  satisfaction:
    "satisfaction_records",
};

const MONTHS = {
  jan: 1,
  january: 1,

  feb: 2,
  february: 2,

  mar: 3,
  march: 3,

  apr: 4,
  april: 4,

  may: 5,

  jun: 6,
  june: 6,

  jul: 7,
  july: 7,

  aug: 8,
  august: 8,

  sep: 9,
  sept: 9,
  september: 9,

  oct: 10,
  october: 10,

  nov: 11,
  november: 11,

  dec: 12,
  december: 12,
};

function normalizeColumnKey(
  value
) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function isPresent(value) {
  return (
    value !== undefined &&
    value !== null &&
    String(value).trim() !== ""
  );
}

function getRowSources(
  row = {}
) {
  const sources = [row];

  const nestedCandidates = [
    row.rawData,
    row.raw_data,
    row.originalData,
    row.original_data,
    row.sourceData,
    row.source_data,
  ];

  nestedCandidates.forEach(
    (candidate) => {
      if (
        candidate &&
        typeof candidate ===
          "object" &&
        !Array.isArray(candidate)
      ) {
        sources.push(candidate);
      }
    }
  );

  return sources;
}

function createNormalizedRowMap(
  row = {}
) {
  const map = new Map();

  getRowSources(row).forEach(
    (source) => {
      Object.entries(
        source
      ).forEach(
        ([key, value]) => {
          const normalizedKey =
            normalizeColumnKey(
              key
            );

          if (
            normalizedKey &&
            isPresent(value) &&
            !map.has(
              normalizedKey
            )
          ) {
            map.set(
              normalizedKey,
              value
            );
          }
        }
      );
    }
  );

  return map;
}

function getRowValue(
  row,
  aliases = []
) {
  if (
    !row ||
    typeof row !== "object"
  ) {
    return undefined;
  }

  const sources =
    getRowSources(row);

  /*
   * Exact key lookup first.
   */
  for (const source of sources) {
    for (const alias of aliases) {
      if (
        Object.prototype.hasOwnProperty.call(
          source,
          alias
        ) &&
        isPresent(
          source[alias]
        )
      ) {
        return source[alias];
      }
    }
  }

  /*
   * Normalized lookup:
   * "Ticket updated - Date"
   * and "ticket_updated_date"
   * both become ticketupdateddate.
   */
  const normalizedMap =
    createNormalizedRowMap(
      row
    );

  for (const alias of aliases) {
    const normalizedAlias =
      normalizeColumnKey(
        alias
      );

    if (
      normalizedMap.has(
        normalizedAlias
      )
    ) {
      return normalizedMap.get(
        normalizedAlias
      );
    }
  }

  return undefined;
}

function cleanText(
  row,
  aliases
) {
  const value =
    getRowValue(
      row,
      aliases
    );

  if (!isPresent(value)) {
    return null;
  }

  const text =
    String(value).trim();

  if (
    !text ||
    text === "-" ||
    text.toLowerCase() ===
      "null" ||
    text.toLowerCase() ===
      "undefined"
  ) {
    return null;
  }

  return text;
}

function normalizeIdentifier(
  value
) {
  if (!isPresent(value)) {
    return null;
  }

  const text =
    String(value).trim();

  /*
   * Excel sometimes converts identifiers
   * such as 3953 to "3953.0".
   */
  if (
    /^\d+\.0+$/.test(text)
  ) {
    return text.replace(
      /\.0+$/,
      ""
    );
  }

  return text || null;
}

function cleanIdentifier(
  row,
  aliases
) {
  return normalizeIdentifier(
    getRowValue(
      row,
      aliases
    )
  );
}

function parseBooleanValue(
  row,
  aliases
) {
  const value =
    getRowValue(
      row,
      aliases
    );

  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  if (
    typeof value ===
    "number"
  ) {
    return value === 1;
  }

  const normalized =
    String(value || "")
      .trim()
      .toLowerCase();

  return [
    "1",
    "true",
    "yes",
    "y",
    "solved",
    "closed",
    "resolved",
    "complete",
    "completed",
    "done",
  ].includes(normalized);
}

function normalizeRatingValue(
  row
) {
  const value =
    getRowValue(row, [
      "Ticket satisfaction rating",
      "ticket satisfaction rating",
      "Satisfaction Rating",
      "satisfaction rating",
      "satisfactionRating",
      "satisfaction_rating",
      "Customer Rating",
      "customer rating",
      "customerRating",
      "customer_rating",
      "Rating",
      "rating",
      "Score",
      "score",
      "Result",
      "result",
    ]);

  const normalized =
    String(value || "")
      .trim()
      .toLowerCase();

  if (
    [
      "good",
      "positive",
      "satisfied",
      "very satisfied",
      "excellent",
      "happy",
      "4",
      "5",
    ].includes(normalized)
  ) {
    return "Good";
  }

  if (
    [
      "bad",
      "negative",
      "unsatisfied",
      "dissatisfied",
      "very dissatisfied",
      "poor",
      "unhappy",
      "1",
      "2",
    ].includes(normalized)
  ) {
    return "Bad";
  }

  return "Unknown";
}

function makeIsoDate(
  year,
  month,
  day
) {
  const numericYear =
    Number(year);

  const numericMonth =
    Number(month);

  const numericDay =
    Number(day);

  if (
    !Number.isInteger(
      numericYear
    ) ||
    !Number.isInteger(
      numericMonth
    ) ||
    !Number.isInteger(
      numericDay
    ) ||
    numericYear < 1900 ||
    numericYear > 2200 ||
    numericMonth < 1 ||
    numericMonth > 12 ||
    numericDay < 1 ||
    numericDay > 31
  ) {
    return null;
  }

  const candidate =
    new Date(
      Date.UTC(
        numericYear,
        numericMonth - 1,
        numericDay
      )
    );

  if (
    candidate.getUTCFullYear() !==
      numericYear ||
    candidate.getUTCMonth() !==
      numericMonth - 1 ||
    candidate.getUTCDate() !==
      numericDay
  ) {
    return null;
  }

  return [
    String(
      numericYear
    ).padStart(4, "0"),

    String(
      numericMonth
    ).padStart(2, "0"),

    String(
      numericDay
    ).padStart(2, "0"),
  ].join("-");
}

function normalizeYear(
  year
) {
  let numericYear =
    Number(year);

  if (
    !Number.isFinite(
      numericYear
    )
  ) {
    return null;
  }

  if (numericYear < 100) {
    numericYear +=
      numericYear >= 70
        ? 1900
        : 2000;
  }

  return numericYear;
}

/*
 * options.monthFirst:
 *
 * false:
 * 01/06/2026 = 1 June 2026
 *
 * true:
 * 6/21/2026 = 21 June 2026
 */
function parseDateValue(
  value,
  {
    monthFirst = false,
  } = {}
) {
  if (!isPresent(value)) {
    return null;
  }

  if (
    value instanceof Date &&
    !Number.isNaN(
      value.getTime()
    )
  ) {
    return value
      .toISOString()
      .slice(0, 10);
  }

  const raw =
    String(value)
      .trim()
      .replace(/\s+/g, " ");

  /*
   * ISO:
   * 2026-06-21
   * 2026/06/21
   * 2026.06.21
   */
  const yearFirstMatch =
    raw.match(
      /^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})(?:\s|T|$)/
    );

  if (yearFirstMatch) {
    return makeIsoDate(
      yearFirstMatch[1],
      yearFirstMatch[2],
      yearFirstMatch[3]
    );
  }

  /*
   * Named month:
   * 1-Jun-26
   * 21 June 2026
   */
  const dayNamedMonthMatch =
    raw.match(
      /^(\d{1,2})[\s\/.-]+([A-Za-z]+)[\s\/.-]+(\d{2,4})$/
    );

  if (
    dayNamedMonthMatch
  ) {
    const month =
      MONTHS[
        dayNamedMonthMatch[2]
          .toLowerCase()
      ];

    const year =
      normalizeYear(
        dayNamedMonthMatch[3]
      );

    if (
      month &&
      year
    ) {
      return makeIsoDate(
        year,
        month,
        dayNamedMonthMatch[1]
      );
    }
  }

  /*
   * June 21, 2026
   * Jun 21 2026
   */
  const namedMonthDayMatch =
    raw.match(
      /^([A-Za-z]+)[\s\/.-]+(\d{1,2}),?[\s\/.-]+(\d{2,4})$/
    );

  if (
    namedMonthDayMatch
  ) {
    const month =
      MONTHS[
        namedMonthDayMatch[1]
          .toLowerCase()
      ];

    const year =
      normalizeYear(
        namedMonthDayMatch[3]
      );

    if (
      month &&
      year
    ) {
      return makeIsoDate(
        year,
        month,
        namedMonthDayMatch[2]
      );
    }
  }

  /*
   * Numeric:
   * Ticket CSV may use DD/MM/YYYY.
   * Satisfaction CSV uses M/D/YYYY,
   * for example 6/21/2026.
   */
  const numericMatch =
    raw.match(
      /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/
    );

  if (numericMatch) {
    const first =
      Number(
        numericMatch[1]
      );

    const second =
      Number(
        numericMatch[2]
      );

    const year =
      normalizeYear(
        numericMatch[3]
      );

    if (!year) {
      return null;
    }

    /*
     * Unambiguous:
     * first > 12 means DD/MM.
     */
    if (first > 12) {
      return makeIsoDate(
        year,
        second,
        first
      );
    }

    /*
     * Unambiguous:
     * second > 12 means MM/DD.
     */
    if (second > 12) {
      return makeIsoDate(
        year,
        first,
        second
      );
    }

    /*
     * Ambiguous values use dataset-specific rule.
     */
    if (monthFirst) {
      return makeIsoDate(
        year,
        first,
        second
      );
    }

    return makeIsoDate(
      year,
      second,
      first
    );
  }

  /*
   * Excel serial date.
   * Example: 45828.
   */
  if (
    /^\d+(\.\d+)?$/.test(
      raw
    )
  ) {
    const serial =
      Number(raw);

    if (
      serial > 20000 &&
      serial < 100000
    ) {
      const milliseconds =
        Math.round(
          (serial - 25569) *
            86400 *
            1000
        );

      const excelDate =
        new Date(
          milliseconds
        );

      if (
        !Number.isNaN(
          excelDate.getTime()
        )
      ) {
        return excelDate
          .toISOString()
          .slice(0, 10);
      }
    }
  }

  /*
   * Safe fallback for complete
   * textual date strings.
   */
  if (
    /[A-Za-z]/.test(raw)
  ) {
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
  }

  return null;
}

function getTicketDate(row) {
  return parseDateValue(
    getRowValue(row, [
      "Date",
      "date",
      "Ticket Date",
      "ticket date",
      "ticketDate",
      "ticket_date",
      "Created Date",
      "created date",
      "createdDate",
      "created_date",
      "Submitted Date",
      "submitted date",
      "submittedDate",
      "submitted_date",
      "Created At",
      "createdAt",
      "created_at",
    ]),
    {
      monthFirst: false,
    }
  );
}

function isSummaryTicketRow({
  ticketNumber,
  ticketDate,
  tse,
}) {
  if (
    !ticketNumber ||
    !ticketDate ||
    !tse
  ) {
    return true;
  }

  const normalizedTicket =
    String(ticketNumber)
      .trim()
      .toLowerCase();

  const normalizedTse =
    String(tse)
      .trim()
      .toLowerCase();

  const summaryLabels = [
    "total",
    "grand total",
    "subtotal",
    "total no. of queries",
    "total number of queries",
    "total queries",
    "count",
    "average",
    "unknown",
    "na",
    "n/a",
  ];

  if (
    summaryLabels.includes(
      normalizedTicket
    ) ||
    summaryLabels.includes(
      normalizedTse
    )
  ) {
    return true;
  }

  /*
   * Summary rows often contain labels or
   * dates such as "7-Apr" in ticket number.
   */
  if (
    /^(grand\s+)?total/i.test(
      normalizedTicket
    ) ||
    /^\d{1,2}[-/\s][A-Za-z]{3,9}$/i.test(
      normalizedTicket
    )
  ) {
    return true;
  }

  return false;
}

function normalizeTicket(
  row,
  context
) {
  const ticketDate =
    getTicketDate(row);

  const ticketNumber =
    cleanIdentifier(row, [
      "Ticket number",
      "ticket number",
      "Ticket Number",
      "ticketNumber",
      "ticket_number",
      "Ticket No",
      "ticket no",
      "ticketNo",
      "ticket_no",
      "Ticket #",
      "ticket #",
      "ticket#",
      "Ticket ID",
      "ticket id",
      "ticketId",
      "ticket_id",
    ]);

  const tse =
    cleanText(row, [
      "TSE",
      "tse",
      "Agent",
      "agent",
      "Engineer",
      "engineer",
      "Assigned To",
      "assigned to",
      "assignedTo",
      "assigned_to",
      "Technician",
      "technician",
      "Assignee",
      "assignee",
    ]);

  if (
    isSummaryTicketRow({
      ticketNumber,
      ticketDate,
      tse,
    })
  ) {
    return {
      valid: false,
      reason:
        "Summary or invalid ticket row skipped.",
    };
  }

  const value = {
    period_id:
      context.periodId,

    import_batch_id:
      context.batchId,

    tse,

    ticket_number:
      ticketNumber,

    region:
      cleanText(row, [
        "Region",
        "region",
        "Country Region",
        "country region",
        "countryRegion",
        "country_region",
        "Market",
        "market",
        "Location",
        "location",
      ]),

    submitted:
      cleanText(row, [
        "Submitted",
        "submitted",
        "Submitted By",
        "submitted by",
        "submittedBy",
        "submitted_by",
        "Submitter",
        "submitter",
      ]),

    ticket_date:
      ticketDate,

    product_1:
      cleanText(row, [
        "Product 1",
        "product 1",
        "product1",
        "product_1",
        "Primary Product",
        "primary product",
        "primaryProduct",
        "primary_product",
        "Product",
        "product",
        "Product Name",
        "product name",
        "productName",
        "product_name",
      ]),

    product_2:
      cleanText(row, [
        "Product 2",
        "product 2",
        "product2",
        "product_2",
        "Secondary Product",
        "secondary product",
        "secondaryProduct",
        "secondary_product",
      ]),

    ticket_subject:
      cleanText(row, [
        "Ticket Subject",
        "ticket subject",
        "ticketSubject",
        "ticket_subject",
        "Subject",
        "subject",
        "Title",
        "title",
        "Issue",
        "issue",
      ]),

    support_category:
      cleanText(row, [
        "Support Category",
        "support category",
        "supportCategory",
        "support_category",
        "Issue Category",
        "issue category",
        "issueCategory",
        "issue_category",
        "Category",
        "category",
      ]),

    product_category:
      cleanText(row, [
        "Product Category",
        "product category",
        "productCategory",
        "product_category",
        "Product Type",
        "product type",
        "productType",
        "product_type",
      ]),

    procedure:
      cleanText(row, [
        "Procedure",
        "procedure",
        "Resolution",
        "resolution",
        "Process",
        "process",
        "Action",
        "action",
        "Solution",
        "solution",
      ]),

    source_row_number:
      context.rowNumber,

    raw_data: row,

    created_by:
      context.userId,
  };

  value.row_hash =
    createRowHash(
      "tickets",
      value
    );

  return {
    valid: true,
    value,
  };
}

function normalizeProduct(
  row,
  context
) {
  const productName =
    cleanText(row, [
      "Product Name",
      "product name",
      "productName",
      "product_name",
      "Product",
      "product",
      "Name",
      "name",
      "Item Name",
      "item name",
      "itemName",
      "item_name",
      "Model",
      "model",
    ]);

  if (!productName) {
    return {
      valid: false,
      reason:
        "Product name is required.",
    };
  }

  const value = {
    period_id:
      context.periodId,

    import_batch_id:
      context.batchId,

    product_name:
      productName,

    category:
      cleanText(row, [
        "Category",
        "category",
        "Product Category",
        "product category",
        "productCategory",
        "product_category",
        "Product Type",
        "product type",
        "productType",
        "product_type",
      ]),

    sku:
      cleanIdentifier(row, [
        "SKU",
        "sku",
        "Product SKU",
        "product sku",
        "productSku",
        "product_sku",
        "Article Number",
        "article number",
        "articleNumber",
        "article_number",
        "Part Number",
        "part number",
        "partNumber",
        "part_number",
      ]),

    ean:
      cleanIdentifier(row, [
        "EAN",
        "ean",
        "EAN Code",
        "ean code",
        "eanCode",
        "ean_code",
        "Barcode",
        "barcode",
      ]),

    upc:
      cleanIdentifier(row, [
        "UPC",
        "upc",
        "UPC Code",
        "upc code",
        "upcCode",
        "upc_code",
      ]),

    source_row_number:
      context.rowNumber,

    raw_data: row,

    created_by:
      context.userId,
  };

  value.row_hash =
    createRowHash(
      "products",
      value
    );

  return {
    valid: true,
    value,
  };
}

function normalizeSatisfaction(
  row,
  context
) {
  const ticketId =
    cleanIdentifier(row, [
      "Ticket ID",
      "ticket id",
      "ticketId",
      "ticket_id",
      "Ticket Number",
      "ticket number",
      "ticketNumber",
      "ticket_number",
      "Ticket No",
      "ticket no",
      "ticketNo",
      "ticket_no",
      "Ticket #",
      "ticket #",
    ]);

  if (!ticketId) {
    return {
      valid: false,
      reason:
        "Satisfaction ticket ID is required.",
    };
  }

  const updatedDate =
    parseDateValue(
      getRowValue(row, [
        "Ticket updated - Date",
        "ticket updated - date",
        "Ticket updated Date",
        "ticket updated date",
        "ticketUpdatedDate",
        "ticket_updated_date",
        "Updated Date",
        "updated date",
        "updatedDate",
        "updated_date",
        "Response Date",
        "response date",
        "responseDate",
        "response_date",
        "Date",
        "date",
      ]),
      {
        /*
         * Satisfaction CSV uses M/D/YYYY:
         * 6/21/2026.
         */
        monthFirst: true,
      }
    );

  const value = {
    period_id:
      context.periodId,

    import_batch_id:
      context.batchId,

    ticket_id:
      ticketId,

    /*
     * PostgreSQL enum is case-sensitive:
     * Good
     * Bad
     * Unknown
     */
    rating:
      normalizeRatingValue(
        row
      ),

    comment:
      cleanText(row, [
        "Ticket satisfaction comment",
        "ticket satisfaction comment",
        "Satisfaction Comment",
        "satisfaction comment",
        "satisfactionComment",
        "satisfaction_comment",
        "Customer Comment",
        "customer comment",
        "customerComment",
        "customer_comment",
        "Comment",
        "comment",
        "Comments",
        "comments",
        "Feedback",
        "feedback",
      ]),

    reason:
      cleanText(row, [
        "Ticket satisfaction reason",
        "ticket satisfaction reason",
        "Satisfaction Reason",
        "satisfaction reason",
        "satisfactionReason",
        "satisfaction_reason",
        "Rating Reason",
        "rating reason",
        "ratingReason",
        "rating_reason",
        "Reason",
        "reason",
      ]),

    updated_date:
      updatedDate,

    is_solved:
      parseBooleanValue(
        row,
        [
          "Solved tickets",
          "solved tickets",
          "Solved Tickets",
          "Solved",
          "solved",
          "Is Solved",
          "is solved",
          "isSolved",
          "is_solved",
          "Solved Status",
          "solved status",
          "solvedStatus",
          "solved_status",
          "Status",
          "status",
        ]
      ),

    source_row_number:
      context.rowNumber,

    raw_data: row,

    created_by:
      context.userId,
  };

  value.row_hash =
    createRowHash(
      "satisfaction",
      value
    );

  return {
    valid: true,
    value,
  };
}

function normalizeRow(
  datasetType,
  row,
  context
) {
  if (
    datasetType ===
    "tickets"
  ) {
    return normalizeTicket(
      row,
      context
    );
  }

  if (
    datasetType ===
    "products"
  ) {
    return normalizeProduct(
      row,
      context
    );
  }

  if (
    datasetType ===
    "satisfaction"
  ) {
    return normalizeSatisfaction(
      row,
      context
    );
  }

  return {
    valid: false,
    reason:
      "Unsupported dataset type.",
  };
}

async function getEnumValue(
  client,
  enumName,
  candidates
) {
  const result =
    await client.query(
      `
        select
          e.enumlabel
        from pg_type t
        join pg_enum e
          on e.enumtypid = t.oid
        where t.typname = $1
        order by e.enumsortorder
      `,
      [enumName]
    );

  const values =
    result.rows.map(
      (row) =>
        row.enumlabel
    );

  const exactMatch =
    candidates.find(
      (candidate) =>
        values.includes(
          candidate
        )
    );

  if (exactMatch) {
    return exactMatch;
  }

  const insensitiveMatch =
    values.find((value) =>
      candidates.some(
        (candidate) =>
          String(candidate)
            .toLowerCase() ===
          String(value)
            .toLowerCase()
      )
    );

  if (insensitiveMatch) {
    return insensitiveMatch;
  }

  throw new Error(
    `No compatible ${enumName} value found. Available values: ${
      values.join(", ") ||
      "none"
    }`
  );
}

function assertSafeTableName(
  tableName
) {
  if (
    !Object.values(
      DATASET_TABLES
    ).includes(tableName)
  ) {
    throw new Error(
      "Unsafe database table name."
    );
  }
}

function buildInsertQuery(
  tableName,
  rows
) {
  if (!rows.length) {
    return null;
  }

  assertSafeTableName(
    tableName
  );

  const columns =
    Object.keys(
      rows[0]
    );

  const values = [];

  const rowPlaceholders =
    rows.map((row) => {
      const placeholders =
        columns.map(
          (column) => {
            let value =
              row[column];

            if (
              column ===
              "raw_data"
            ) {
              value =
                JSON.stringify(
                  value || {}
                );
            }

            values.push(value);

            return `$${values.length}`;
          }
        );

      return `(${placeholders.join(
        ", "
      )})`;
    });

  return {
    text: `
      insert into public.${tableName}
      (
        ${columns.join(", ")}
      )
      values
        ${rowPlaceholders.join(", ")}
    `,

    values,
  };
}

async function uploadOriginalFile({
  file,
  period,
  datasetType,
}) {
  const bucket =
    env.SUPABASE_STORAGE_BUCKET ||
    "csv";

  if (!file?.buffer) {
    return {
      bucket,
      path: null,
      checksum: null,
    };
  }

  const safeName =
    String(
      file.originalname ||
        `${datasetType}-${period.period_key}.csv`
    )
      .replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      )
      .replace(
        /_+/g,
        "_"
      );

  const path = [
    String(
      period.report_year
    ),

    String(
      period.report_month
    ).padStart(2, "0"),

    datasetType,

    `${Date.now()}-${safeName}`,
  ].join("/");

  const {
    error,
  } =
    await supabaseAdmin.storage
      .from(bucket)
      .upload(
        path,
        file.buffer,
        {
          contentType:
            file.mimetype ||
            "text/csv",

          upsert: false,
        }
      );

  if (error) {
    throw new Error(
      `Storage upload failed: ${error.message}`
    );
  }

  return {
    bucket,
    path,

    checksum:
      createFileChecksum(
        file.buffer
      ),
  };
}

async function removeUploadedFile(
  storage
) {
  if (
    !storage?.bucket ||
    !storage?.path
  ) {
    return;
  }

  const {
    error,
  } =
    await supabaseAdmin.storage
      .from(
        storage.bucket
      )
      .remove([
        storage.path,
      ]);

  if (error) {
    console.error(
      "Unable to remove failed import file:",
      error.message
    );
  }
}

async function getOldStorageFiles(
  client,
  periodId,
  datasetEnum
) {
  const result =
    await client.query(
      `
        select
          storage_bucket,
          storage_path
        from public.import_batches
        where period_id = $1
          and dataset_type = $2
          and storage_bucket is not null
          and storage_path is not null
      `,
      [
        periodId,
        datasetEnum,
      ]
    );

  return result.rows.map(
    (row) => ({
      bucket:
        row.storage_bucket,

      path:
        row.storage_path,
    })
  );
}

async function removeStorageFiles(
  files
) {
  const filesByBucket =
    new Map();

  files.forEach((file) => {
    if (
      !file?.bucket ||
      !file?.path
    ) {
      return;
    }

    if (
      !filesByBucket.has(
        file.bucket
      )
    ) {
      filesByBucket.set(
        file.bucket,
        []
      );
    }

    filesByBucket
      .get(file.bucket)
      .push(file.path);
  });

  for (
    const [
      bucket,
      paths,
    ] of filesByBucket
  ) {
    const {
      error,
    } =
      await supabaseAdmin.storage
        .from(bucket)
        .remove(paths);

    if (error) {
      console.error(
        `Unable to remove old ${bucket} files:`,
        error.message
      );
    }
  }
}

export async function importMonthlyDataset({
  datasetType,
  periodKey,
  rows,
  file,
  userId,
  columnMapping = {},
}) {
  const normalizedDatasetType =
    String(
      datasetType || ""
    )
      .trim()
      .toLowerCase();

  const tableName =
    DATASET_TABLES[
      normalizedDatasetType
    ];

  if (!tableName) {
    const error =
      new Error(
        "Invalid dataset type."
      );

    error.statusCode = 400;

    throw error;
  }

  const normalizedPeriodKey =
    String(
      periodKey || ""
    ).trim();

  if (!normalizedPeriodKey) {
    const error =
      new Error(
        "Reporting period is required."
      );

    error.statusCode = 400;

    throw error;
  }

  if (
    !Array.isArray(rows) ||
    rows.length === 0
  ) {
    const error =
      new Error(
        "No CSV records were provided."
      );

    error.statusCode = 400;

    throw error;
  }

  const pool =
    getDatabasePool();

  const client =
    await pool.connect();

  let uploadedStorage = null;
  let transactionStarted =
    false;

  let oldStorageFiles = [];

  try {
    const periodResult =
      await client.query(
        `
          select
            id,
            report_year,
            report_month,
            period_key,
            period_name,
            status
          from public.reporting_periods
          where period_key = $1
          limit 1
        `,
        [
          normalizedPeriodKey,
        ]
      );

    const period =
      periodResult.rows[0];

    if (!period) {
      const error =
        new Error(
          "Selected reporting period was not found."
        );

      error.statusCode = 404;

      throw error;
    }

    if (
      String(
        period.status
      ).toLowerCase() !==
      "open"
    ) {
      const error =
        new Error(
          `${period.period_name} is not open for imports.`
        );

      error.statusCode = 409;

      throw error;
    }

    uploadedStorage =
      await uploadOriginalFile({
        file,
        period,
        datasetType:
          normalizedDatasetType,
      });

    await client.query(
      "begin"
    );

    transactionStarted =
      true;

    const datasetEnum =
      await getEnumValue(
        client,
        "dataset_type",
        normalizedDatasetType ===
          "tickets"
          ? [
              "tickets",
              "ticket",
            ]
          : normalizedDatasetType ===
            "products"
          ? [
              "products",
              "product",
            ]
          : [
              "satisfaction",
            ]
      );

    const modeEnum =
      await getEnumValue(
        client,
        "import_mode",
        [
          "replace",
          "append",
        ]
      );

    const processingStatus =
      await getEnumValue(
        client,
        "import_status",
        [
          "processing",
          "pending",
        ]
      );

    oldStorageFiles =
      await getOldStorageFiles(
        client,
        period.id,
        datasetEnum
      );

    const batchResult =
      await client.query(
        `
          insert into public.import_batches (
            period_id,
            dataset_type,
            import_mode,
            status,
            original_file_name,
            file_size_bytes,
            file_mime_type,
            file_checksum,
            storage_bucket,
            storage_path,
            total_raw_rows,
            total_valid_rows,
            total_invalid_rows,
            total_duplicate_rows,
            total_inserted_rows,
            total_updated_rows,
            column_mapping,
            detected_columns,
            validation_summary,
            imported_by,
            started_at
          )
          values (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            0,
            0,
            0,
            0,
            0,
            $12::jsonb,
            $13::jsonb,
            '{}'::jsonb,
            $14,
            now()
          )
          returning id
        `,
        [
          period.id,
          datasetEnum,
          modeEnum,
          processingStatus,

          file?.originalname ||
            `${normalizedDatasetType}-${normalizedPeriodKey}.csv`,

          file?.size || 0,

          file?.mimetype ||
            "text/csv",

          uploadedStorage
            ?.checksum ||
            null,

          uploadedStorage
            ?.bucket ||
            env.SUPABASE_STORAGE_BUCKET ||
            "csv",

          uploadedStorage
            ?.path ||
            null,

          rows.length,

          JSON.stringify(
            columnMapping ||
              {}
          ),

          JSON.stringify(
            Object.keys(
              rows[0] || {}
            )
          ),

          userId || null,
        ]
      );

    const batchId =
      batchResult.rows[0].id;

    const validRows = [];
    const invalidRows = [];

    const hashes =
      new Set();

    let duplicateRows = 0;

    rows.forEach(
      (row, index) => {
        const result =
          normalizeRow(
            normalizedDatasetType,
            row,
            {
              periodId:
                period.id,

              batchId,

              userId:
                userId ||
                null,

              /*
               * Header is row 1.
               */
              rowNumber:
                index + 2,
            }
          );

        if (!result.valid) {
          invalidRows.push({
            rowNumber:
              index + 2,

            reason:
              result.reason,
          });

          return;
        }

        if (
          hashes.has(
            result.value
              .row_hash
          )
        ) {
          duplicateRows += 1;

          return;
        }

        hashes.add(
          result.value
            .row_hash
        );

        validRows.push(
          result.value
        );
      }
    );

    if (
      validRows.length === 0
    ) {
      const sampleReasons =
        invalidRows
          .slice(0, 10)
          .map(
            (item) =>
              `Row ${item.rowNumber}: ${item.reason}`
          )
          .join("; ");

      throw new Error(
        `No valid records remained after validation.${
          sampleReasons
            ? ` ${sampleReasons}`
            : ""
        }`
      );
    }

    /*
     * Replace only this dataset
     * inside the selected month.
     */
    await client.query(
      `
        delete from public.${tableName}
        where period_id = $1
      `,
      [
        period.id,
      ]
    );

    /*
     * Remove older import batch records
     * for the same month and dataset.
     */
    await client.query(
      `
        delete from public.import_batches
        where period_id = $1
          and dataset_type = $2
          and id <> $3
      `,
      [
        period.id,
        datasetEnum,
        batchId,
      ]
    );

    const chunkSize = 250;

    let insertedRows = 0;

    for (
      let index = 0;
      index <
      validRows.length;
      index += chunkSize
    ) {
      const chunk =
        validRows.slice(
          index,
          index +
            chunkSize
        );

      const insertQuery =
        buildInsertQuery(
          tableName,
          chunk
        );

      if (!insertQuery) {
        continue;
      }

      await client.query(
        insertQuery.text,
        insertQuery.values
      );

      insertedRows +=
        chunk.length;
    }

    const completedStatus =
      await getEnumValue(
        client,
        "import_status",
        [
          "completed",
          "success",
        ]
      );

    const validationSummary = {
      invalidRows:
        invalidRows
          .slice(0, 100),

      invalidRowCount:
        invalidRows.length,

      duplicateRowCount:
        duplicateRows,

      insertedRowCount:
        insertedRows,
    };

    await client.query(
      `
        update public.import_batches
        set
          status = $1,
          total_valid_rows = $2,
          total_invalid_rows = $3,
          total_duplicate_rows = $4,
          total_inserted_rows = $5,
          total_updated_rows = 0,
          validation_summary = $6::jsonb,
          error_message = null,
          completed_at = now()
        where id = $7
      `,
      [
        completedStatus,
        validRows.length,
        invalidRows.length,
        duplicateRows,
        insertedRows,

        JSON.stringify(
          validationSummary
        ),

        batchId,
      ]
    );

    await client.query(
      "commit"
    );

    transactionStarted =
      false;

    /*
     * New import succeeded.
     * Old source CSV files can now be removed.
     */
    await removeStorageFiles(
      oldStorageFiles
    );

    return {
      batchId,

      datasetType:
        normalizedDatasetType,

      period,

      storage:
        uploadedStorage,

      summary: {
        rawRows:
          rows.length,

        validRows:
          validRows.length,

        invalidRows:
          invalidRows.length,

        duplicateRows,

        insertedRows,
      },

      validationSummary,
    };
  } catch (error) {
    if (
      transactionStarted
    ) {
      try {
        await client.query(
          "rollback"
        );
      } catch (
        rollbackError
      ) {
        console.error(
          "Import rollback failed:",
          rollbackError
            .message
        );
      }
    }

    /*
     * Database import failed,
     * therefore do not leave the newly
     * uploaded CSV in Storage.
     */
    await removeUploadedFile(
      uploadedStorage
    );

    throw error;
  } finally {
    client.release();
  }
}