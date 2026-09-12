const ALLOWED_RMA_TYPES = new Set([
  "broken plastic",
  "data recovery",
  "data recovery rma",
  "repair & replaced",
  "rma",
]);

function safeText(...values) {
  const value = values.find(
    (item) =>
      item !== undefined &&
      item !== null &&
      String(item).trim() !== ""
  );

  return value === undefined ? "" : String(value).trim();
}

function normalizeText(value) {
  return safeText(value).toLowerCase().replace(/\s+/g, " ");
}

function getField(ticket, key) {
  const aliases = {
    support_category: [
      ticket.support_category,
      ticket.supportCategory,
      ticket.category,
    ],
    product_category: [ticket.product_category, ticket.productCategory],
    ticket_subject: [ticket.ticket_subject, ticket.ticketSubject, ticket.subject],
    procedure: [
      ticket.procedure,
      ticket.Procedure,
      ticket.ticket_procedure,
      ticket.ticketProcedure,
      ticket["Ticket Procedure"],
    ],
    rma_type: [ticket.rma_type, ticket.rmaType, ticket.RMAType, ticket["RMA Type"]],
    region: [ticket.region],
    tse: [ticket.tse, ticket.TSE, ticket.agent, ticket.engineer],
  };

  return safeText(...(aliases[key] || [ticket[key]]));
}

function normalizeProcedure(value) {
  const text = normalizeText(value);

  if (text === "dr") return "data recovery";
  if (text === "data recovery") return "data recovery";

  if (text === "dr rma") return "data recovery rma";
  if (text === "data recovery rma") return "data recovery rma";
  if (text === "date recovery rma") return "data recovery rma";

  if (text === "rma") return "rma";

  if (text === "broken plastic") return "broken plastic";
  if (text === "broken plastics") return "broken plastic";

  if (text === "repair & replaced") return "repair & replaced";
  if (text === "repair and replaced") return "repair & replaced";
  if (text === "repaired & replaced") return "repair & replaced";
  if (text === "repair replaced") return "repair & replaced";

  return text;
}

function getTicketNumber(ticket) {
  return safeText(
    ticket.ticket_number,
    ticket.ticketNumber,
    ticket.ticketNo,
    ticket.ticket_no,
    ticket.ticket_id,
    ticket.ticketId
  )
    .replace(/\.0+$/, "")
    .toLowerCase();
}

function dedupeByTicketNumber(rows = []) {
  const seen = new Set();

  return rows.filter((row) => {
    const key = getTicketNumber(row);

    if (!key) return true;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function getRmaClassificationValues(ticket) {
  return [
    getField(ticket, "procedure"),
    getField(ticket, "rma_type"),
    getField(ticket, "support_category"),
    getField(ticket, "ticket_subject"),
  ]
    .map(normalizeProcedure)
    .filter(Boolean);
}

function isDataRecoveryProcedure(ticket) {
  return getRmaClassificationValues(ticket).some((value) =>
    value === "data recovery" ||
    value === "data recovery rma" ||
    value.includes("data recovery")
  );
}

function isRmaOnlyProcedure(ticket) {
  return getRmaClassificationValues(ticket).some((value) =>
    value === "rma"
  );
}

function isAllowedRmaProcedure(ticket) {
  return getRmaClassificationValues(ticket).some((value) =>
    ALLOWED_RMA_TYPES.has(value) ||
    value.includes("rma") ||
    value.includes("data recovery")
  );
}

function getTicketDate(ticket) {
  return safeText(
    ticket.date_key,
    ticket.date,
    ticket.ticketDate,
    ticket.ticket_date,
    ticket.createdDate,
    ticket.submittedDate
  );
}

function getProduct1(ticket) {
  return safeText(
    ticket.product_1,
    ticket.product1,
    ticket.product,
    ticket.productName,
    ticket.product_name
  );
}

function getProduct2(ticket) {
  return safeText(ticket.product_2, ticket.product2);
}

function normalizeIsoDate(value) {
  const text = safeText(value);

  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function groupCount(rows, key) {
  const counts = new Map();

  rows.forEach((row) => {
    const label = getField(row, key) || "Unknown";

    counts.set(label, (counts.get(label) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function productCount(rows) {
  const counts = new Map();

  rows.forEach((row) => {
    [getProduct1(row), getProduct2(row)].forEach((product) => {
      const cleanProduct = safeText(product);

      if (
        !cleanProduct ||
        ["unknown", "na", "-"].includes(cleanProduct.toLowerCase())
      ) {
        return;
      }

      counts.set(cleanProduct, (counts.get(cleanProduct) || 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function dailyTrend(rows) {
  const counts = new Map();

  rows.forEach((row) => {
    const date = normalizeIsoDate(getTicketDate(row));

    if (!date) return;

    counts.set(date, (counts.get(date) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function includesText(value, search) {
  return safeText(value).toLowerCase().includes(String(search).toLowerCase());
}

function matrixCount(rows, rowKey, columnKey) {
  const rowLabels = Array.from(
    new Set(rows.map((row) => getField(row, rowKey) || "Unknown"))
  ).sort();

  const columnLabels = Array.from(
    new Set(rows.map((row) => getField(row, columnKey) || "Unknown"))
  ).sort();

  const matrixRows = rowLabels.map((rowLabel) => {
    const item = {
      name: rowLabel,
      total: 0,
    };

    columnLabels.forEach((columnLabel) => {
      const count = rows.filter(
        (row) =>
          (getField(row, rowKey) || "Unknown") === rowLabel &&
          (getField(row, columnKey) || "Unknown") === columnLabel
      ).length;

      item[columnLabel] = count;
      item.total += count;
    });

    return item;
  });

  return {
    columns: columnLabels,
    rows: matrixRows.sort((a, b) => b.total - a.total),
  };
}

export function buildTicketAnalytics(tickets = []) {
  const safeTickets = Array.isArray(tickets) ? tickets : [];

  const supportCategorySummary = groupCount(safeTickets, "support_category");
  const productCategorySummary = groupCount(safeTickets, "product_category");
  const procedureSummary = groupCount(safeTickets, "procedure");
  const regionSummary = groupCount(safeTickets, "region");
  const tseSummary = groupCount(safeTickets, "tse");
  const productSummary = productCount(safeTickets);
  const dailySummary = dailyTrend(safeTickets);

  const uniqueTickets = dedupeByTicketNumber(safeTickets);

  const dataRecoveryTickets = uniqueTickets.filter((ticket) =>
    isDataRecoveryProcedure(ticket)
  );

  const rmaTickets = uniqueTickets.filter((ticket) =>
    isAllowedRmaProcedure(ticket)
  );

  const rmaOnlyTickets = uniqueTickets.filter((ticket) =>
    isRmaOnlyProcedure(ticket)
  );

  const troubleshootTickets = safeTickets.filter(
    (ticket) =>
      includesText(getField(ticket, "support_category"), "troubleshoot") ||
      includesText(getField(ticket, "procedure"), "troubleshoot")
  );

  const registrationTickets = safeTickets.filter((ticket) =>
    includesText(getField(ticket, "support_category"), "registration")
  );

  const hardwareTickets = safeTickets.filter((ticket) =>
    includesText(getField(ticket, "support_category"), "hardware")
  );

  const informationTickets = safeTickets.filter((ticket) =>
    includesText(getField(ticket, "support_category"), "information")
  );

  const compatibilityTickets = safeTickets.filter((ticket) =>
    includesText(getField(ticket, "support_category"), "compatibility")
  );

  const firmwareTickets = safeTickets.filter(
    (ticket) =>
      includesText(getField(ticket, "support_category"), "firmware") ||
      includesText(getField(ticket, "procedure"), "firmware") ||
      includesText(getField(ticket, "ticket_subject"), "firmware")
  );

  return {
    kpis: {
      totalTickets: safeTickets.length,
      totalProducts: productSummary.length,
      totalSupportCategories: supportCategorySummary.length,
      totalProductCategories: productCategorySummary.length,

      dataRecoveryCount: dataRecoveryTickets.length,
      rmaCount: rmaTickets.length,
      rmaOnlyCount: rmaOnlyTickets.length,

      troubleshootCount: troubleshootTickets.length,
      registrationCount: registrationTickets.length,
      hardwareCount: hardwareTickets.length,
      informationCount: informationTickets.length,
      compatibilityCount: compatibilityTickets.length,
      firmwareCount: firmwareTickets.length,
    },

    dailySummary,
    supportCategorySummary,
    productCategorySummary,
    procedureSummary,
    regionSummary,
    tseSummary,
    productSummary,

    dataRecoveryTickets,
    rmaTickets,
    rmaOnlyTickets,
    troubleshootTickets,
    registrationTickets,
    hardwareTickets,
    informationTickets,
    compatibilityTickets,
    firmwareTickets,

    supportByProductMatrix: matrixCount(
      safeTickets,
      "product_category",
      "support_category"
    ),

    procedureByProductMatrix: matrixCount(
      safeTickets,
      "product_category",
      "procedure"
    ),
  };
}