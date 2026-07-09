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

function normalizeRmaType(value, subject = "") {
  const text = normalizeKey(value);
  const subjectText = normalizeKey(subject);
  const combined = `${text} ${subjectText}`;

  if (combined.includes("data recovery")) return "Data Recovery RMA";
  if (combined.includes("broken plastic")) return "Broken Plastic";
  if (combined.includes("warranty")) return "RMA";
  if (combined === "dr" || combined.includes(" dr ")) return "Data Recovery RMA";
  if (combined.includes("rma")) return cleanText(value) || "RMA";

  return cleanText(value);
}

function isRmaRow(row) {
  const rmaType = normalizeKey(row.rmaType);
  const subject = normalizeKey(row.ticketSubject);

  return (
    rmaType.includes("rma") ||
    rmaType.includes("data recovery") ||
    rmaType.includes("broken plastic") ||
    subject.includes("rma") ||
    subject.includes("data recovery") ||
    subject.includes("warranty claim") ||
    subject.includes("broken plastic")
  );
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
        "ticket_subject",
      ]);

      const rawRmaType = pick(row, [
        "rmaType",
        "rma_type",
        "RMA TYPE",
        "rma type",
        "rma",
        "procedure",
        "Procedure",
        "supportCategory",
        "support_category",
        "category",
      ]);

      const item = {
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
        ]),

        region: pick(row, [
          "region",
          "Region",
        ]),

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

        rmaType: normalizeRmaType(rawRmaType, ticketSubject),

        source: row.source || "",
      };

      return item;
    })
    .filter((row) => row.ticketNumber || row.rmaType || row.ticketSubject)
    .filter(isRmaRow);
}

export function deduplicateRmaRows(rows = []) {
  const seen = new Set();

  return rows.filter((row) => {
    const identity = cleanText(row.ticketNumber).toLowerCase();

    if (!identity) return true;

    if (seen.has(identity)) return false;

    seen.add(identity);
    return true;
  });
}

function makeSummary(rows, getter) {
  const map = new Map();

  rows.forEach((row) => {
    const name = cleanText(getter(row)) || "Unknown";
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

    if (!date || date.length < 7) return "Unknown";

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

    byDate: makeDateSummary(rows),

    byMonth: makeMonthSummary(rows),

    byProduct: makeSummary(rows, (row) => row.product1 || row.product2),
  };
}