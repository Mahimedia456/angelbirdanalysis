export const ALLOWED_REGIONS = ["APAC", "AUS", "EMEA", "NA", "UK", "US"];

export const TICKET_FIELDS = [
  {
    key: "tse",
    label: "TSE",
    required: false,
    aliases: ["tse", "support_agent", "agent", "assignee"],
  },
  {
    key: "ticket_number",
    label: "Ticket Number",
    required: false,
    aliases: [
      "ticket_number",
      "ticket_num",
      "ticket",
      "ticket_id",
      "id",
    ],
  },
  {
    key: "region",
    label: "Region",
    required: true,
    aliases: ["region", "market", "area", "country"],
  },
  {
    key: "submitted",
    label: "Submitted",
    required: false,
    aliases: [
      "submitted",
      "submitted_by",
      "requester",
      "customer",
    ],
  },
  {
    key: "date",
    label: "Date",
    required: true,
    aliases: [
      "date",
      "submitted_date",
      "created_at",
      "created",
      "ticket_date",
    ],
  },
  {
    key: "product_1",
    label: "Product 1",
    required: false,
    aliases: [
      "product_1",
      "product1",
      "product",
      "main_product",
    ],
  },
  {
    key: "product_2",
    label: "Product 2",
    required: false,
    aliases: [
      "product_2",
      "product2",
      "secondary_product",
    ],
  },
  {
    key: "ticket_subject",
    label: "Ticket Subject",
    required: false,
    aliases: [
      "ticket_subject",
      "subject",
      "title",
      "ticket_title",
    ],
  },
  {
    key: "support_category",
    label: "Support Category",
    required: true,
    aliases: [
      "support_category",
      "support_cat",
      "issue_category",
    ],
  },
  {
    key: "product_category",
    label: "Product Category",
    required: false,
    aliases: [
      "product_category",
      "product_cat",
      "product_type",
      "type",
    ],
  },
  {
    key: "procedure",
    label: "Procedure",
    required: false,
    aliases: [
      "procedure",
      "action",
      "resolution",
      "process",
    ],
  },
];

const MONTHS = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

export function normalizeColumnName(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\uFEFF/g, "")
    .replace(/\s+/g, "_")
    .replace(/-/g, "_")
    .replace(/[^\w]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export function cleanText(value = "") {
  return String(value ?? "")
    .replace(/â„¢/g, "™")
    .replace(/â€™/g, "’")
    .replace(/â€“/g, "–")
    .replace(/â€”/g, "—")
    .replace(/â€˜/g, "‘")
    .replace(/â€œ/g, "“")
    .replace(/â€/g, "”")
    .replace(/Ã¤/g, "ä")
    .replace(/Ã¶/g, "ö")
    .replace(/Ã¼/g, "ü")
    .replace(/ÃŸ/g, "ß")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeRegion(value = "") {
  const clean = cleanText(value).toUpperCase();

  if (ALLOWED_REGIONS.includes(clean)) {
    return clean;
  }

  return "Unknown";
}

function normalizeYear(value) {
  const year = Number(value);

  if (!Number.isInteger(year)) {
    return null;
  }

  /*
   * Excel sheet:
   * 26 = 2026
   * 25 = 2025
   */
  if (year >= 0 && year <= 69) {
    return 2000 + year;
  }

  if (year >= 70 && year <= 99) {
    return 1900 + year;
  }

  return year;
}

function createValidatedDate(yearValue, monthValue, dayValue) {
  const year = normalizeYear(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);

  if (year === null) return null;

  if (!Number.isInteger(month) || month < 0 || month > 11) {
    return null;
  }

  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return null;
  }

  /*
   * Reject incorrect browser-generated future years.
   * Change upper limit later only if future reports need it.
   */
  if (year < 2000 || year > 2030) {
    return null;
  }

  const date = new Date(year, month, day);
  date.setHours(0, 0, 0, 0);

  /*
   * Reject invalid dates such as 31-Feb.
   */
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function parseTicketDate(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return createValidatedDate(
      value.getFullYear(),
      value.getMonth(),
      value.getDate()
    );
  }

  const raw = cleanText(value);

  if (!raw) {
    return null;
  }

  /*
   * Main CSV format:
   * 1-Apr-26
   * 01-Apr-26
   * 1-Apr-2026
   * 1 Apr 26
   */
  const namedMonthMatch = raw.match(
    /^(\d{1,2})[-./\s]([A-Za-z]{3,9})[-./\s](\d{2}|\d{4})$/
  );

  if (namedMonthMatch) {
    const day = Number(namedMonthMatch[1]);

    const monthName = namedMonthMatch[2]
      .trim()
      .toLowerCase();

    const month = MONTHS[monthName];

    const year = normalizeYear(namedMonthMatch[3]);

    if (month === undefined || year === null) {
      return null;
    }

    return createValidatedDate(year, month, day);
  }

  /*
   * ISO:
   * 2026-04-01
   */
  const isoMatch = raw.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/
  );

  if (isoMatch) {
    return createValidatedDate(
      isoMatch[1],
      Number(isoMatch[2]) - 1,
      isoMatch[3]
    );
  }

  /*
   * Excel/US format:
   * 4/1/2026 = April 1, 2026
   * 4/1/26 = April 1, 2026
   */
  const slashMatch = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/
  );

  if (slashMatch) {
    const month = Number(slashMatch[1]);
    const day = Number(slashMatch[2]);
    const year = normalizeYear(slashMatch[3]);

    if (year === null) {
      return null;
    }

    return createValidatedDate(
      year,
      month - 1,
      day
    );
  }

  /*
   * Excel serial date.
   * Example values around 2026 are approximately 46000.
   */
  if (/^\d{5}(?:\.\d+)?$/.test(raw)) {
    const serial = Number(raw);

    if (serial >= 36526 && serial <= 47849) {
      const excelEpoch = Date.UTC(1899, 11, 30);

      const date = new Date(
        excelEpoch + Math.round(serial * 86400000)
      );

      return createValidatedDate(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
      );
    }
  }

  /*
   * Never use:
   * new Date(raw)
   *
   * Browser-dependent parsing caused invalid years.
   */
  return null;
}

export function formatDateKey(value) {
  const date = parseTicketDate(value);

  if (!date) {
    return "Unknown";
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(value) {
  const date = parseTicketDate(value);

  if (!date) {
    return cleanText(value) || "Unknown";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMonthKey(value) {
  const date = parseTicketDate(value);

  if (!date) {
    return "Unknown";
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  return `${year}-${month}`;
}

export function detectTicketMapping(columns = []) {
  const mapping = {};

  const normalizedColumns = columns.map((column) => ({
    original: column,
    normalized: normalizeColumnName(column),
  }));

  TICKET_FIELDS.forEach((field) => {
    const match = normalizedColumns.find((column) =>
      field.aliases.includes(column.normalized)
    );

    mapping[field.key] = match?.original || "";
  });

  return mapping;
}

export function applyTicketMapping(
  rows = [],
  mapping = {}
) {
  return rows
    .map((row, index) => {
      const ticket = {
        id: index + 1,
        tse: "",
        ticket_number: "",
        region: "",
        submitted: "",
        date: "",
        date_display: "",
        date_key: "",
        month_key: "",
        product_1: "",
        product_2: "",
        ticket_subject: "",
        support_category: "",
        product_category: "",
        procedure: "",
        raw: row,
      };

      TICKET_FIELDS.forEach((field) => {
        const sourceColumn = mapping[field.key];

        if (
          sourceColumn &&
          row[sourceColumn] !== undefined
        ) {
          ticket[field.key] = row[sourceColumn];
        }
      });

      ticket.tse = cleanText(ticket.tse);

      ticket.ticket_number = cleanText(
        ticket.ticket_number
      );

      ticket.region = normalizeRegion(
        ticket.region
      );

      ticket.submitted = cleanText(
        ticket.submitted
      );

      ticket.date = cleanText(ticket.date);

      /*
       * All chart date values are created here.
       */
      ticket.date_key = formatDateKey(
        ticket.date
      );

      ticket.date_display = formatDisplayDate(
        ticket.date
      );

      ticket.month_key = formatMonthKey(
        ticket.date
      );

      ticket.product_1 =
        cleanText(ticket.product_1) || "Unknown";

      ticket.product_2 = cleanText(
        ticket.product_2
      );

      ticket.ticket_subject = cleanText(
        ticket.ticket_subject
      );

      ticket.support_category =
        cleanText(ticket.support_category) ||
        "Unknown";

      ticket.product_category =
        cleanText(ticket.product_category) ||
        "Unknown";

      ticket.procedure =
        cleanText(ticket.procedure) || "NA";

      return ticket;
    })
    .filter((ticket) => {
      return (
        ticket.ticket_number ||
        ticket.date ||
        ticket.product_1 !== "Unknown" ||
        ticket.ticket_subject ||
        ticket.support_category !== "Unknown"
      );
    });
}

export function getUniqueValues(
  rows = [],
  key
) {
  return Array.from(
    new Set(
      rows
        .map((row) =>
          String(row[key] || "").trim()
        )
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
}

export function filterTickets(
  tickets = [],
  filters = {}
) {
  const search = String(
    filters.search || ""
  )
    .toLowerCase()
    .trim();

  return tickets.filter((ticket) => {
    const matchesSearch =
      !search ||
      String(ticket.ticket_number || "")
        .toLowerCase()
        .includes(search) ||
      String(ticket.ticket_subject || "")
        .toLowerCase()
        .includes(search) ||
      String(ticket.product_1 || "")
        .toLowerCase()
        .includes(search) ||
      String(ticket.product_2 || "")
        .toLowerCase()
        .includes(search) ||
      String(ticket.support_category || "")
        .toLowerCase()
        .includes(search) ||
      String(ticket.product_category || "")
        .toLowerCase()
        .includes(search) ||
      String(ticket.procedure || "")
        .toLowerCase()
        .includes(search);

    const matchesRegion =
      !filters.region ||
      ticket.region === filters.region;

    const matchesSupportCategory =
      !filters.supportCategory ||
      ticket.support_category ===
        filters.supportCategory;

    const matchesProductCategory =
      !filters.productCategory ||
      ticket.product_category ===
        filters.productCategory;

    const matchesProcedure =
      !filters.procedure ||
      ticket.procedure === filters.procedure;

    const hasValidDate =
      ticket.date_key &&
      ticket.date_key !== "Unknown";

    const matchesFrom =
      !filters.dateFrom ||
      (hasValidDate &&
        ticket.date_key >= filters.dateFrom);

    const matchesTo =
      !filters.dateTo ||
      (hasValidDate &&
        ticket.date_key <= filters.dateTo);

    return (
      matchesSearch &&
      matchesRegion &&
      matchesSupportCategory &&
      matchesProductCategory &&
      matchesProcedure &&
      matchesFrom &&
      matchesTo
    );
  });
}