const ALLOWED_REGIONS = new Set([
  "APAC",
  "AUS",
  "EMEA",
  "NA",
  "UAE",
  "UK",
  "US",
]);

function cleanText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeKey(value) {
  return cleanText(value).toLowerCase();
}

function normalizeDate(value) {
  const raw = cleanText(value);

  if (!raw) return "";

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }

  const textDate = raw.match(/^(\d{1,2})-([A-Za-z]{3,})-(\d{2,4})$/);

  if (textDate) {
    const day = Number(textDate[1]);
    const monthName = textDate[2].slice(0, 3).toLowerCase();
    let year = Number(textDate[3]);

    if (year < 100) year += 2000;

    const monthMap = {
      jan: 1,
      feb: 2,
      mar: 3,
      apr: 4,
      may: 5,
      jun: 6,
      jul: 7,
      aug: 8,
      sep: 9,
      oct: 10,
      nov: 11,
      dec: 12,
    };

    const month = monthMap[monthName];

    if (month) {
      return [
        String(year).padStart(4, "0"),
        String(month).padStart(2, "0"),
        String(day).padStart(2, "0"),
      ].join("-");
    }
  }

  const slash = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);

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

    return [
      String(year).padStart(4, "0"),
      String(month).padStart(2, "0"),
      String(day).padStart(2, "0"),
    ].join("-");
  }

  const parsed = new Date(raw);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return "";
}

function pick(row, keys) {
  for (const key of keys) {
    const value = row?.[key];

    if (value !== undefined && value !== null && cleanText(value) !== "") {
      return cleanText(value);
    }
  }

  return "";
}

function normalizeRegion(value) {
  const raw = cleanText(value).toUpperCase();

  if (!raw) return "";

  // AngelBird reporting treats legacy NA values as UAE.
  if (raw === "NA" || raw === "NORTH AMERICA") return "UAE";
  if (raw === "UNITED STATES") return "US";
  if (raw === "USA") return "US";
  if (raw === "U.K.") return "UK";
  if (raw === "UNITED KINGDOM") return "UK";

  // Preserve any non-empty sheet region instead of dropping the row.
  return ALLOWED_REGIONS.has(raw) ? raw : cleanText(value);
}

function normalizeRmaType(value) {
  const raw = cleanText(value);
  const key = normalizeKey(raw);

  if (!key) return "";

  // Keep RMA TYPE as the source of truth. Only obvious aliases/typos are
  // canonicalized; every other non-empty sheet value is preserved.
  if (key === "dr") return "Data Recovery";
  if (key === "data recovery") return "Data Recovery";

  if (key === "dr rma") return "Data Recovery RMA";
  if (key === "data recovery rma") return "Data Recovery RMA";
  if (key === "date recovery rma") return "Data Recovery RMA";

  // "Date Recovery" is intentionally kept as its own sheet category.
  if (key === "date recovery") return "Date Recovery";

  if (key === "rma") return "RMA";

  if ([
    "faulty",
    "fault",
    "defective",
    "defect",
    "faulty unit",
    "faulty product",
  ].includes(key)) return "Faulty";

  if (key === "broken plastic" || key === "broken plastics") {
    return "Broken Plastic";
  }

  if ([
    "repair & replaced",
    "repair and replaced",
    "repaired & replaced",
    "repair replaced",
  ].includes(key)) {
    return "Repair & Replaced";
  }

  return raw;
}

function normalizeWarrantyStatus(value) {
  const raw = cleanText(value);
  const key = normalizeKey(raw)
    .replace(/[\/_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!key) return "";

  if ([
    "in warranty",
    "within warranty",
    "under warranty",
    "warranty",
    "yes",
  ].includes(key)) {
    return "In Warranty";
  }

  if ([
    "out of warranty",
    "out warranty",
    "oow",
    "expired warranty",
    "warranty expired",
    "no warranty",
    "no",
  ].includes(key)) {
    return "Out of Warranty";
  }

  return raw;
}

export function normalizeRmaRows(rows = []) {
  return rows
    .map((row, index) => {
      const ticketSubject = pick(row, [
        "ticketSubject",
        "ticket_subject",
        "subject",
        "Ticket Subject",
        "ticket subject",
      ]);

      const region = normalizeRegion(
        pick(row, [
          "region",
          "Region",
        ])
      );

      const rawRmaType = pick(row, [
        "rmaType",
        "rma_type",
        "RMA TYPE",
        "rma type",
        "RMA Type",
        "procedure",
        "Procedure",
      ]);

      const rmaType = normalizeRmaType(rawRmaType);

      const issues = pick(row, [
        "issues",
        "issue",
        "rma_issues",
        "rma_issue",
        "RMA Issues",
        "RMA Issue",
        "Issues",
        "Issue",
        "problem",
        "problem_type",
        "issue_type",
      ]);

      const warrantyStatus = normalizeWarrantyStatus(
        pick(row, [
          "warrantyStatus",
          "warranty_status",
          "Warranty Status",
          "warranty status",
          "WARRANTY STATUS",
          "warranty",
          "Warranty",
        ])
      );

      return {
        id: row.id || row.sheet_row_number || index + 1,

        tse: pick(row, [
          "tse",
          "TSE",
          "agent",
          "engineer",
          "Tse",
        ]),

        ticketNumber: pick(row, [
          "ticketNumber",
          "ticket_number",
          "ticketNo",
          "ticket_no",
          "ticketId",
          "ticket_id",
          "Ticket number",
          "ticket number",
          "Ticket Number",
        ]),

        region,

        date: normalizeDate(
          pick(row, [
            "date",
            "Date",
            "ticketDate",
            "ticket_date",
            "date_display",
            "createdDate",
            "submittedDate",
          ])
        ),

        product1: pick(row, [
          "product1",
          "product_1",
          "Product 1",
          "product 1",
          "product",
          "productName",
          "product_name",
        ]),

        product2: pick(row, [
          "product2",
          "product_2",
          "Product 2",
          "product 2",
        ]),

        ticketSubject,

        issues,
        issue: issues,

        rmaType,

        warrantyStatus,
        warranty_status: warrantyStatus,

        source: row.source || "",
      };
    })
    // The RMA tab is row-based history. Do not discard repeated ticket
    // numbers: the same ticket can legitimately appear on multiple dates
    // and with different RMA TYPE / Issues values.
    .filter((row) => row.rmaType);
}

function isBlankValue(value) {
  return value === undefined || value === null || cleanText(value) === "";
}

function mergeDuplicateRmaRows(primary, fallback) {
  const merged = {
    ...fallback,
    ...primary,
  };

  Object.keys({ ...fallback, ...primary }).forEach((key) => {
    if (isBlankValue(primary?.[key]) && !isBlankValue(fallback?.[key])) {
      merged[key] = fallback[key];
    }
  });

  return merged;
}

function compareRmaRowFreshness(a, b) {
  const aDate = Date.parse(cleanText(a?.date) || "1970-01-01");
  const bDate = Date.parse(cleanText(b?.date) || "1970-01-01");

  if (aDate !== bDate) {
    return aDate - bDate;
  }

  const aId = Number(a?.id || 0);
  const bId = Number(b?.id || 0);

  if (Number.isFinite(aId) && Number.isFinite(bId) && aId !== bId) {
    return aId - bId;
  }

  return 0;
}

export function deduplicateRmaRows(rows = []) {
  const sourceRows = Array.isArray(rows) ? rows : [];
  const byTicket = new Map();
  const rowsWithoutTicket = [];

  sourceRows.forEach((row) => {
    const ticketNumber = cleanText(row?.ticketNumber);

    // A row without a ticket number cannot be safely merged with another row.
    if (!ticketNumber) {
      rowsWithoutTicket.push(row);
      return;
    }

    const key = normalizeKey(ticketNumber);
    const existing = byTicket.get(key);

    if (!existing) {
      byTicket.set(key, row);
      return;
    }

    // One RMA record per Ticket #. Prefer the latest dated/sheet row as the
    // current state, but backfill blank fields from the older duplicate.
    if (compareRmaRowFreshness(row, existing) >= 0) {
      byTicket.set(key, mergeDuplicateRmaRows(row, existing));
    } else {
      byTicket.set(key, mergeDuplicateRmaRows(existing, row));
    }
  });

  return [...byTicket.values(), ...rowsWithoutTicket].sort((a, b) => {
    const aId = Number(a?.id || 0);
    const bId = Number(b?.id || 0);

    if (Number.isFinite(aId) && Number.isFinite(bId)) {
      return aId - bId;
    }

    return String(a?.date || "").localeCompare(String(b?.date || ""));
  });
}

function makeSummary(rows, getter) {
  const map = new Map();

  rows.forEach((row) => {
    const name = cleanText(getter(row));

    if (!name) return;

    const key = normalizeKey(name);

    if (!map.has(key)) {
      map.set(key, {
        name,
        value: 0,
      });
    }

    map.get(key).value += 1;
  });

  return Array.from(map.values()).sort(
    (a, b) => Number(b.value || 0) - Number(a.value || 0)
  );
}

function makeDateSummary(rows) {
  return makeSummary(rows, (row) => row.date).sort((a, b) =>
    String(a.name).localeCompare(String(b.name))
  );
}

function makeMonthSummary(rows) {
  return makeSummary(rows, (row) => {
    const date = cleanText(row.date);

    if (!date || date.length < 7) return "";

    return date.slice(0, 7);
  }).sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

export function buildRmaAnalytics(rows = []) {
  return {
    totalRma: rows.length,

    uniqueTickets: new Set(
      rows.map((row) => cleanText(row.ticketNumber)).filter(Boolean)
    ).size,

    byRegion: makeSummary(rows, (row) => row.region),

    byTse: makeSummary(rows, (row) => row.tse),

    byRmaType: makeSummary(rows, (row) => row.rmaType),

    byIssue: makeSummary(rows, (row) => row.issues || row.issue),

    byWarrantyStatus: makeSummary(rows, (row) => row.warrantyStatus || row.warranty_status),

    byDate: makeDateSummary(rows),

    byMonth: makeMonthSummary(rows),

    byProduct: makeSummary(rows, (row) => row.product1 || row.product2),
  };
}