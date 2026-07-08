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
  satisfaction: "satisfaction_records",
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

function normalizeColumnKey(value) {
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

function getRowSources(row = {}) {
  const sources = [row];

  [
    row.rawData,
    row.raw_data,
    row.originalData,
    row.original_data,
    row.sourceData,
    row.source_data,
  ].forEach((candidate) => {
    if (
      candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate)
    ) {
      sources.push(candidate);
    }
  });

  return sources;
}

function createNormalizedRowMap(row = {}) {
  const map = new Map();

  getRowSources(row).forEach((source) => {
    Object.entries(source).forEach(([key, value]) => {
      const normalizedKey = normalizeColumnKey(key);

      if (
        normalizedKey &&
        isPresent(value) &&
        !map.has(normalizedKey)
      ) {
        map.set(normalizedKey, value);
      }
    });
  });

  return map;
}

function getRowValue(row, aliases = []) {
  if (!row || typeof row !== "object") {
    return undefined;
  }

  const sources = getRowSources(row);

  for (const source of sources) {
    for (const alias of aliases) {
      if (
        Object.prototype.hasOwnProperty.call(source, alias) &&
        isPresent(source[alias])
      ) {
        return source[alias];
      }
    }
  }

  const normalizedMap = createNormalizedRowMap(row);

  for (const alias of aliases) {
    const normalizedAlias = normalizeColumnKey(alias);

    if (normalizedMap.has(normalizedAlias)) {
      return normalizedMap.get(normalizedAlias);
    }
  }

  return undefined;
}

function cleanText(row, aliases) {
  const value = getRowValue(row, aliases);

  if (!isPresent(value)) {
    return null;
  }

  const text = String(value).trim();

  if (
    !text ||
    text === "-" ||
    text.toLowerCase() === "null" ||
    text.toLowerCase() === "undefined"
  ) {
    return null;
  }

  return text;
}

function normalizeIdentifier(value) {
  if (!isPresent(value)) {
    return null;
  }

  const text = String(value).trim();

  if (/^\d+\.0+$/.test(text)) {
    return text.replace(/\.0+$/, "");
  }

  return text || null;
}

function cleanIdentifier(row, aliases) {
  return normalizeIdentifier(
    getRowValue(row, aliases)
  );
}

function parseBooleanValue(row, aliases) {
  const value = getRowValue(row, aliases);

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  const normalized = String(value || "")
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

function normalizeRatingValue(row) {
  const value = getRowValue(row, [
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

  const normalized = String(value || "")
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

function makeIsoDate(year, month, day) {
  const numericYear = Number(year);
  const numericMonth = Number(month);
  const numericDay = Number(day);

  if (
    !Number.isInteger(numericYear) ||
    !Number.isInteger(numericMonth) ||
    !Number.isInteger(numericDay) ||
    numericYear < 1900 ||
    numericYear > 2200 ||
    numericMonth < 1 ||
    numericMonth > 12 ||
    numericDay < 1 ||
    numericDay > 31
  ) {
    return null;
  }

  const candidate = new Date(
    Date.UTC(
      numericYear,
      numericMonth - 1,
      numericDay
    )
  );

  if (
    candidate.getUTCFullYear() !== numericYear ||
    candidate.getUTCMonth() !== numericMonth - 1 ||
    candidate.getUTCDate() !== numericDay
  ) {
    return null;
  }

  return [
    String(numericYear).padStart(4, "0"),
    String(numericMonth).padStart(2, "0"),
    String(numericDay).padStart(2, "0"),
  ].join("-");
}

function normalizeYear(year) {
  let numericYear = Number(year);

  if (!Number.isFinite(numericYear)) {
    return null;
  }

  if (numericYear < 100) {
    numericYear += numericYear >= 70 ? 1900 : 2000;
  }

  return numericYear;
}

function parseDateValue(value, { monthFirst = false } = {}) {
  if (!isPresent(value)) {
    return null;
  }

  if (
    value instanceof Date &&
    !Number.isNaN(value.getTime())
  ) {
    return value.toISOString().slice(0, 10);
  }

  const raw = String(value)
    .trim()
    .replace(/\s+/g, " ");

  const yearFirstMatch = raw.match(
    /^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})(?:\s|T|$)/
  );

  if (yearFirstMatch) {
    return makeIsoDate(
      yearFirstMatch[1],
      yearFirstMatch[2],
      yearFirstMatch[3]
    );
  }

  const dayNamedMonthMatch = raw.match(
    /^(\d{1,2})[\s\/.-]+([A-Za-z]+)[\s\/.-]+(\d{2,4})$/
  );

  if (dayNamedMonthMatch) {
    const month = MONTHS[dayNamedMonthMatch[2].toLowerCase()];
    const year = normalizeYear(dayNamedMonthMatch[3]);

    if (month && year) {
      return makeIsoDate(year, month, dayNamedMonthMatch[1]);
    }
  }

  const namedMonthDayMatch = raw.match(
    /^([A-Za-z]+)[\s\/.-]+(\d{1,2}),?[\s\/.-]+(\d{2,4})$/
  );

  if (namedMonthDayMatch) {
    const month = MONTHS[namedMonthDayMatch[1].toLowerCase()];
    const year = normalizeYear(namedMonthDayMatch[3]);

    if (month && year) {
      return makeIsoDate(year, month, namedMonthDayMatch[2]);
    }
  }

  const numericMatch = raw.match(
    /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/
  );

  if (numericMatch) {
    const first = Number(numericMatch[1]);
    const second = Number(numericMatch[2]);
    const year = normalizeYear(numericMatch[3]);

    if (!year) {
      return null;
    }

    if (first > 12) {
      return makeIsoDate(year, second, first);
    }

    if (second > 12) {
      return makeIsoDate(year, first, second);
    }

    if (monthFirst) {
      return makeIsoDate(year, first, second);
    }

    return makeIsoDate(year, second, first);
  }

  if (/^\d+(\.\d+)?$/.test(raw)) {
    const serial = Number(raw);

    if (serial > 20000 && serial < 100000) {
      const milliseconds = Math.round(
        (serial - 25569) * 86400 * 1000
      );

      const excelDate = new Date(milliseconds);

      if (!Number.isNaN(excelDate.getTime())) {
        return excelDate.toISOString().slice(0, 10);
      }
    }
  }

  if (/[A-Za-z]/.test(raw)) {
    const parsed = new Date(raw);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
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

function getSatisfactionDate(row) {
  return parseDateValue(
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
      monthFirst: true,
    }
  );
}

function getPeriodPartsFromIsoDate(isoDate) {
  const match = String(isoDate || "").match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) {
    return null;
  }

  const reportYear = Number(match[1]);
  const reportMonth = Number(match[2]);
  const periodKey = `${reportYear}-${String(reportMonth).padStart(2, "0")}`;

  return {
    reportYear,
    reportMonth,
    periodKey,
  };
}

function isSummaryTicketRow({
  ticketNumber,
  ticketDate,
  tse,
}) {
  if (!ticketNumber || !ticketDate || !tse) {
    return true;
  }

  const normalizedTicket = String(ticketNumber)
    .trim()
    .toLowerCase();

  const normalizedTse = String(tse)
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
    summaryLabels.includes(normalizedTicket) ||
    summaryLabels.includes(normalizedTse)
  ) {
    return true;
  }

  if (
    /^(grand\s+)?total/i.test(normalizedTicket) ||
    /^\d{1,2}[-/\s][A-Za-z]{3,9}$/i.test(normalizedTicket)
  ) {
    return true;
  }

  return false;
}

function createTicketDedupKey(value) {
  return [
    value.ticket_number,
    value.ticket_date,
    value.region,
    value.tse,
    value.product_1,
    value.product_2,
    value.ticket_subject,
    value.support_category,
    value.product_category,
    value.procedure,
  ]
    .map((item) =>
      String(item || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase()
    )
    .join("|");
}

function createSatisfactionDedupKey(value) {
  return [
    value.ticket_id,
    value.updated_date,
    value.rating,
    value.comment,
    value.reason,
    value.is_solved,
  ]
    .map((item) =>
      String(item || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase()
    )
    .join("|");
}


function normalizeTicket(row, context) {
  const ticketDate = getTicketDate(row);

  const ticketNumber = cleanIdentifier(row, [
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

  const tse = cleanText(row, [
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
      reason: "Summary or invalid ticket row skipped.",
    };
  }

  const value = {
    period_id: context.periodId,
    import_batch_id: context.batchId,
    tse,
    ticket_number: ticketNumber,
    region: cleanText(row, [
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
    submitted: cleanText(row, [
      "Submitted",
      "submitted",
      "Submitted By",
      "submitted by",
      "submittedBy",
      "submitted_by",
      "Submitter",
      "submitter",
    ]),
    ticket_date: ticketDate,
    product_1: cleanText(row, [
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
    product_2: cleanText(row, [
      "Product 2",
      "product 2",
      "product2",
      "product_2",
      "Secondary Product",
      "secondary product",
      "secondaryProduct",
      "secondary_product",
    ]),
    ticket_subject: cleanText(row, [
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
    support_category: cleanText(row, [
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
    product_category: cleanText(row, [
      "Product Category",
      "product category",
      "productCategory",
      "product_category",
      "Product Type",
      "product type",
      "productType",
      "product_type",
    ]),
    procedure: cleanText(row, [
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
    source_row_number: context.rowNumber,
    raw_data: row,
    created_by: context.userId,
  };

value.row_hash = createRowHash("tickets", {
  dedup_key: createTicketDedupKey(value),
});
  return {
    valid: true,
    value,
  };
}

function normalizeSatisfaction(row, context) {
  const ticketId = cleanIdentifier(row, [
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

  const updatedDate = getSatisfactionDate(row);

  if (!ticketId) {
    return {
      valid: false,
      reason: "Satisfaction ticket ID is required.",
    };
  }

  if (!updatedDate) {
    return {
      valid: false,
      reason: "Satisfaction updated date is required.",
    };
  }

  const value = {
    period_id: context.periodId,
    import_batch_id: context.batchId,
    ticket_id: ticketId,
    rating: normalizeRatingValue(row),
    comment: cleanText(row, [
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
    reason: cleanText(row, [
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
    updated_date: updatedDate,
    is_solved: parseBooleanValue(row, [
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
    ]),
    source_row_number: context.rowNumber,
    raw_data: row,
    created_by: context.userId,
  };

value.row_hash = createRowHash("satisfaction", {
  dedup_key: createSatisfactionDedupKey(value),
});
  return {
    valid: true,
    value,
  };
}

function normalizeRow(datasetType, row, context) {
  if (datasetType === "tickets") {
    return normalizeTicket(row, context);
  }

  if (datasetType === "satisfaction") {
    return normalizeSatisfaction(row, context);
  }

  return {
    valid: false,
    reason: "Unsupported dataset type.",
  };
}

function getRowPeriodKey(datasetType, row) {
  const rowDate =
    datasetType === "tickets"
      ? getTicketDate(row)
      : getSatisfactionDate(row);

  const periodParts = getPeriodPartsFromIsoDate(rowDate);

  if (!periodParts) {
    return null;
  }

  return periodParts.periodKey;
}

async function getEnumValue(client, enumName, candidates) {
  const result = await client.query(
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

  const values = result.rows.map((row) => row.enumlabel);

  const exactMatch = candidates.find((candidate) =>
    values.includes(candidate)
  );

  if (exactMatch) {
    return exactMatch;
  }

  const insensitiveMatch = values.find((value) =>
    candidates.some(
      (candidate) =>
        String(candidate).toLowerCase() ===
        String(value).toLowerCase()
    )
  );

  if (insensitiveMatch) {
    return insensitiveMatch;
  }

  throw new Error(
    `No compatible ${enumName} value found. Available values: ${
      values.join(", ") || "none"
    }`
  );
}

function assertSafeTableName(tableName) {
  if (!Object.values(DATASET_TABLES).includes(tableName)) {
    throw new Error("Unsafe database table name.");
  }
}

function buildInsertQuery(tableName, rows) {
  if (!rows.length) {
    return null;
  }

  assertSafeTableName(tableName);

  const columns = Object.keys(rows[0]);
  const values = [];

  const rowPlaceholders = rows.map((row) => {
    const placeholders = columns.map((column) => {
      let value = row[column];

      if (column === "raw_data") {
        value = JSON.stringify(value || {});
      }

      values.push(value);

      return `$${values.length}`;
    });

    return `(${placeholders.join(", ")})`;
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

async function getOrCreateReportingPeriod(client, periodKey, userId) {
  const parts = String(periodKey || "").match(/^(\d{4})-(\d{2})$/);

  if (!parts) {
    throw new Error(`Invalid period key: ${periodKey}`);
  }

  const reportYear = Number(parts[1]);
  const reportMonth = Number(parts[2]);

  const existingResult = await client.query(
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
    [periodKey]
  );

  if (existingResult.rows[0]) {
    return existingResult.rows[0];
  }

  const insertResult = await client.query(
    `
      insert into public.reporting_periods (
        report_year,
        report_month,
        status,
        notes,
        created_by
      )
      values (
        $1,
        $2,
        'open',
        null,
        $3
      )
      on conflict (period_key)
      do update set
        updated_at = now()
      returning
        id,
        report_year,
        report_month,
        period_key,
        period_name,
        status
    `,
    [
      reportYear,
      reportMonth,
      userId || null,
    ]
  );

  return insertResult.rows[0];
}

async function uploadOriginalFile({
  file,
  datasetType,
}) {
  const bucket = env.SUPABASE_STORAGE_BUCKET || "csv";

  if (!file?.buffer) {
    return {
      bucket,
      path: null,
      checksum: null,
    };
  }

  const safeName = String(
    file.originalname || `${datasetType}-full-upload.csv`
  )
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");

  const path = [
    "full-imports",
    datasetType,
    `${Date.now()}-${safeName}`,
  ].join("/");

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file.buffer, {
      contentType: file.mimetype || "text/csv",
      upsert: false,
    });

  if (error) {
    throw new Error(
      `Storage upload failed: ${error.message}`
    );
  }

  return {
    bucket,
    path,
    checksum: createFileChecksum(file.buffer),
  };
}

async function removeUploadedFile(storage) {
  if (!storage?.bucket || !storage?.path) {
    return;
  }

  const { error } = await supabaseAdmin.storage
    .from(storage.bucket)
    .remove([storage.path]);

  if (error) {
    console.error(
      "Unable to remove failed import file:",
      error.message
    );
  }
}

async function getOldStorageFilesForDataset(client, datasetEnum) {
  const result = await client.query(
    `
      select
        storage_bucket,
        storage_path
      from public.import_batches
      where dataset_type = $1
        and storage_bucket is not null
        and storage_path is not null
    `,
    [datasetEnum]
  );

  return result.rows.map((row) => ({
    bucket: row.storage_bucket,
    path: row.storage_path,
  }));
}

async function removeStorageFiles(files) {
  const filesByBucket = new Map();

  files.forEach((file) => {
    if (!file?.bucket || !file?.path) {
      return;
    }

    if (!filesByBucket.has(file.bucket)) {
      filesByBucket.set(file.bucket, []);
    }

    filesByBucket.get(file.bucket).push(file.path);
  });

  for (const [bucket, paths] of filesByBucket) {
    const { error } = await supabaseAdmin.storage
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

async function createImportBatch({
  client,
  period,
  datasetEnum,
  modeEnum,
  processingStatus,
  file,
  uploadedStorage,
  datasetType,
  rawRows,
  columnMapping,
  userId,
}) {
  const result = await client.query(
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
      file?.originalname || `${datasetType}-full-upload.csv`,
      file?.size || 0,
      file?.mimetype || "text/csv",
      uploadedStorage?.checksum || null,
      uploadedStorage?.bucket || env.SUPABASE_STORAGE_BUCKET || "csv",
      uploadedStorage?.path || null,
      rawRows.length,
      JSON.stringify(columnMapping || {}),
      JSON.stringify(Object.keys(rawRows[0] || {})),
      userId || null,
    ]
  );

  return result.rows[0].id;
}

async function completeImportBatch({
  client,
  batchId,
  completedStatus,
  validRows,
  invalidRows,
  duplicateRows,
  insertedRows,
}) {
  const validationSummary = {
    invalidRows: invalidRows.slice(0, 100),
    invalidRowCount: invalidRows.length,
    duplicateRowCount: duplicateRows,
    insertedRowCount: insertedRows,
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
      validRows,
      invalidRows.length,
      duplicateRows,
      insertedRows,
      JSON.stringify(validationSummary),
      batchId,
    ]
  );

  return validationSummary;
}

export async function importMonthlyDataset({
  datasetType,
  rows,
  file,
  userId,
  columnMapping = {},
}) {
  const normalizedDatasetType = String(datasetType || "")
    .trim()
    .toLowerCase();

  const tableName = DATASET_TABLES[normalizedDatasetType];

  if (!tableName) {
    const error = new Error(
      "Invalid dataset type. Only tickets and satisfaction are allowed."
    );

    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    const error = new Error(
      "No CSV records were provided."
    );

    error.statusCode = 400;
    throw error;
  }

  const pool = getDatabasePool();
  const client = await pool.connect();

  let uploadedStorage = null;
  let transactionStarted = false;
  let oldStorageFiles = [];

  try {
    uploadedStorage = await uploadOriginalFile({
      file,
      datasetType: normalizedDatasetType,
    });

    await client.query("begin");
    transactionStarted = true;

    const datasetEnum = await getEnumValue(
      client,
      "dataset_type",
      normalizedDatasetType === "tickets"
        ? ["tickets", "ticket"]
        : ["satisfaction"]
    );

    const modeEnum = await getEnumValue(
      client,
      "import_mode",
      ["replace", "append"]
    );

    const processingStatus = await getEnumValue(
      client,
      "import_status",
      ["processing", "pending"]
    );

    const completedStatus = await getEnumValue(
      client,
      "import_status",
      ["completed", "success"]
    );

    oldStorageFiles = await getOldStorageFilesForDataset(
      client,
      datasetEnum
    );

    /*
     * Full upload means replacing the whole dataset,
     * not just one selected month.
     */
    await client.query(
      `
        delete from public.${tableName}
      `
    );

    await client.query(
      `
        delete from public.import_batches
        where dataset_type = $1
      `,
      [datasetEnum]
    );

    const rowsByPeriod = new Map();
    const invalidRows = [];

    rows.forEach((row, index) => {
      const periodKey = getRowPeriodKey(
        normalizedDatasetType,
        row
      );

      if (!periodKey) {
        invalidRows.push({
          rowNumber: index + 2,
          reason:
            normalizedDatasetType === "tickets"
              ? "Ticket date is missing or invalid."
              : "Satisfaction updated date is missing or invalid.",
        });

        return;
      }

      if (!rowsByPeriod.has(periodKey)) {
        rowsByPeriod.set(periodKey, []);
      }

      rowsByPeriod.get(periodKey).push({
        row,
        rowNumber: index + 2,
      });
    });

    const hashes = new Set();
    const allValidationSummaries = [];
    const createdPeriods = [];

    let totalValidRows = 0;
    let totalDuplicateRows = 0;
    let totalInsertedRows = 0;

    for (const [periodKey, periodRows] of rowsByPeriod) {
      const period = await getOrCreateReportingPeriod(
        client,
        periodKey,
        userId
      );

      if (
        String(period.status).toLowerCase() !== "open"
      ) {
        throw new Error(
          `${period.period_name} is not open for imports.`
        );
      }

      createdPeriods.push(period);

      const batchId = await createImportBatch({
        client,
        period,
        datasetEnum,
        modeEnum,
        processingStatus,
        file,
        uploadedStorage,
        datasetType: normalizedDatasetType,
        rawRows: periodRows.map((item) => item.row),
        columnMapping,
        userId,
      });

      const validRows = [];
      const periodInvalidRows = [];

      let periodDuplicateRows = 0;

      periodRows.forEach(({ row, rowNumber }) => {
        const result = normalizeRow(
          normalizedDatasetType,
          row,
          {
            periodId: period.id,
            batchId,
            userId: userId || null,
            rowNumber,
          }
        );

        if (!result.valid) {
          periodInvalidRows.push({
            rowNumber,
            reason: result.reason,
          });

          return;
        }

        if (hashes.has(result.value.row_hash)) {
          periodDuplicateRows += 1;
          return;
        }

        hashes.add(result.value.row_hash);
        validRows.push(result.value);
      });

      const chunkSize = 250;
      let insertedRows = 0;

      for (
        let index = 0;
        index < validRows.length;
        index += chunkSize
      ) {
        const chunk = validRows.slice(
          index,
          index + chunkSize
        );

        const insertQuery = buildInsertQuery(
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

        insertedRows += chunk.length;
      }

      const validationSummary =
        await completeImportBatch({
          client,
          batchId,
          completedStatus,
          validRows: validRows.length,
          invalidRows: periodInvalidRows,
          duplicateRows: periodDuplicateRows,
          insertedRows,
        });

      allValidationSummaries.push({
        periodKey,
        periodName: period.period_name,
        batchId,
        validationSummary,
      });

      totalValidRows += validRows.length;
      totalDuplicateRows += periodDuplicateRows;
      totalInsertedRows += insertedRows;
    }

    if (totalInsertedRows === 0) {
      const sampleReasons = invalidRows
        .slice(0, 10)
        .map(
          (item) =>
            `Row ${item.rowNumber}: ${item.reason}`
        )
        .join("; ");

      throw new Error(
        `No valid records remained after validation.${
          sampleReasons ? ` ${sampleReasons}` : ""
        }`
      );
    }

    await client.query("commit");
    transactionStarted = false;

    await removeStorageFiles(oldStorageFiles);

    return {
      datasetType: normalizedDatasetType,
      storage: uploadedStorage,

      periods: createdPeriods,

      summary: {
        rawRows: rows.length,
        validRows: totalValidRows,
        invalidRows: invalidRows.length,
        duplicateRows: totalDuplicateRows,
        insertedRows: totalInsertedRows,
        periodCount: createdPeriods.length,
      },

      validationSummary: {
        invalidRows: invalidRows.slice(0, 100),
        invalidRowCount: invalidRows.length,
        duplicateRowCount: totalDuplicateRows,
        insertedRowCount: totalInsertedRows,
        periods: allValidationSummaries,
      },
    };
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query("rollback");
      } catch (rollbackError) {
        console.error(
          "Import rollback failed:",
          rollbackError.message
        );
      }
    }

    await removeUploadedFile(uploadedStorage);

    throw error;
  } finally {
    client.release();
  }
}