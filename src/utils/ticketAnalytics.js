function groupCount(rows, key) {
  const map = {};

  rows.forEach((row) => {
    const label = String(row[key] || "Unknown").trim() || "Unknown";
    map[label] = (map[label] || 0) + 1;
  });

  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function productCount(rows) {
  const map = {};

  rows.forEach((row) => {
    const product1 = String(row.product_1 || "").trim();
    const product2 = String(row.product_2 || "").trim();

    if (product1 && product1 !== "Unknown" && product1 !== "NA") {
      map[product1] = (map[product1] || 0) + 1;
    }

    if (product2 && product2 !== "Unknown" && product2 !== "NA") {
      map[product2] = (map[product2] || 0) + 1;
    }
  });

  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function dailyTrend(rows) {
  const map = {};

  rows.forEach((row) => {
    const key = row.date_key || "Unknown";
    map[key] = (map[key] || 0) + 1;
  });

  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function monthlyTrend(rows) {
  const map = {};

  rows.forEach((row) => {
    const key = row.month_key || "Unknown";
    map[key] = (map[key] || 0) + 1;
  });

  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function changePercent(current, previous) {
  const c = Number(current || 0);
  const p = Number(previous || 0);

  if (p === 0 && c === 0) return 0;
  if (p === 0 && c > 0) return 100;

  return ((c - p) / p) * 100;
}

function splitCurrentPreviousByDate(rows) {
  const validRows = rows
    .filter((row) => row.date_key && row.date_key !== "Unknown")
    .sort((a, b) => a.date_key.localeCompare(b.date_key));

  if (!validRows.length) {
    return {
      current: rows,
      previous: [],
      currentLabel: "Current",
      previousLabel: "Previous",
    };
  }

  const uniqueDates = Array.from(new Set(validRows.map((row) => row.date_key)));

  const midpoint = Math.ceil(uniqueDates.length / 2);
  const previousDates = uniqueDates.slice(0, midpoint);
  const currentDates = uniqueDates.slice(midpoint);

  if (!currentDates.length) {
    return {
      current: validRows,
      previous: [],
      currentLabel: "Current",
      previousLabel: "Previous",
    };
  }

  const previousSet = new Set(previousDates);
  const currentSet = new Set(currentDates);

  return {
    current: validRows.filter((row) => currentSet.has(row.date_key)),
    previous: validRows.filter((row) => previousSet.has(row.date_key)),
    currentLabel: `${currentDates[0]} to ${currentDates[currentDates.length - 1]}`,
    previousLabel: `${previousDates[0]} to ${previousDates[previousDates.length - 1]}`,
  };
}

function categoryValue(rows, key, value) {
  return rows.filter((row) => String(row[key] || "") === value).length;
}

function buildComparisonItems(allRows, analyticsRows) {
  const split = splitCurrentPreviousByDate(allRows);

  const currentAnalytics = analyticsRows(split.current);
  const previousAnalytics = analyticsRows(split.previous);

  return {
    labels: {
      currentLabel: split.currentLabel,
      previousLabel: split.previousLabel,
    },
    items: [
      {
        label: "Total Tickets",
        current: split.current.length,
        previous: split.previous.length,
        changePercent: changePercent(split.current.length, split.previous.length),
      },
      {
        label: "Data Recovery",
        current: currentAnalytics.kpis.dataRecoveryCount,
        previous: previousAnalytics.kpis.dataRecoveryCount,
        changePercent: changePercent(
          currentAnalytics.kpis.dataRecoveryCount,
          previousAnalytics.kpis.dataRecoveryCount
        ),
      },
      {
        label: "RMA",
        current: currentAnalytics.kpis.rmaCount,
        previous: previousAnalytics.kpis.rmaCount,
        changePercent: changePercent(
          currentAnalytics.kpis.rmaCount,
          previousAnalytics.kpis.rmaCount
        ),
      },
      {
        label: "Troubleshoot",
        current: currentAnalytics.kpis.troubleshootCount,
        previous: previousAnalytics.kpis.troubleshootCount,
        changePercent: changePercent(
          currentAnalytics.kpis.troubleshootCount,
          previousAnalytics.kpis.troubleshootCount
        ),
      },
    ],
  };
}

function buildTopComparison(rows, key) {
  const split = splitCurrentPreviousByDate(rows);
  const currentSummary = groupCount(split.current, key).slice(0, 8);

  return currentSummary.map((item) => {
    const previous = categoryValue(split.previous, key, item.name);

    return {
      name: item.name,
      value: item.value,
      previous,
      changePercent: changePercent(item.value, previous),
    };
  });
}

function matrixCount(rows, rowKey, colKey) {
  const rowLabels = Array.from(
    new Set(rows.map((row) => String(row[rowKey] || "Unknown")))
  ).sort((a, b) => a.localeCompare(b));

  const colLabels = Array.from(
    new Set(rows.map((row) => String(row[colKey] || "Unknown")))
  ).sort((a, b) => a.localeCompare(b));

  const data = rowLabels.map((rowLabel) => {
    const item = {
      name: rowLabel,
      total: 0,
    };

    colLabels.forEach((colLabel) => {
      const count = rows.filter(
        (row) =>
          String(row[rowKey] || "Unknown") === rowLabel &&
          String(row[colKey] || "Unknown") === colLabel
      ).length;

      item[colLabel] = count;
      item.total += count;
    });

    return item;
  });

  return {
    columns: colLabels,
    rows: data.sort((a, b) => b.total - a.total),
  };
}

export function buildTicketAnalytics(tickets = []) {
  const totalTickets = tickets.length;

  const dailySummary = dailyTrend(tickets);
  const monthlySummary = monthlyTrend(tickets);
  const supportCategorySummary = groupCount(tickets, "support_category");
  const productCategorySummary = groupCount(tickets, "product_category");
  const procedureSummary = groupCount(tickets, "procedure");
  const regionSummary = groupCount(tickets, "region");
  const tseSummary = groupCount(tickets, "tse");
  const productSummary = productCount(tickets);

  const dataRecoveryTickets = tickets.filter(
    (ticket) =>
      ticket.support_category.toLowerCase().includes("data recovery") ||
      ticket.procedure.toLowerCase().includes("dr")
  );

  const rmaTickets = tickets.filter(
    (ticket) =>
      ticket.procedure.toLowerCase().includes("rma") ||
      ticket.ticket_subject.toLowerCase().includes("rma")
  );

  const troubleshootTickets = tickets.filter(
    (ticket) =>
      ticket.support_category.toLowerCase().includes("troubleshoot") ||
      ticket.procedure.toLowerCase().includes("troubleshoot")
  );

  const registrationTickets = tickets.filter((ticket) =>
    ticket.support_category.toLowerCase().includes("registration")
  );

  const hardwareTickets = tickets.filter((ticket) =>
    ticket.support_category.toLowerCase().includes("hardware")
  );

  const informationTickets = tickets.filter((ticket) =>
    ticket.support_category.toLowerCase().includes("information")
  );

  const compatibilityTickets = tickets.filter((ticket) =>
    ticket.support_category.toLowerCase().includes("compatibility")
  );

  const firmwareTickets = tickets.filter(
    (ticket) =>
      ticket.support_category.toLowerCase().includes("firmware") ||
      ticket.procedure.toLowerCase().includes("firmware") ||
      ticket.ticket_subject.toLowerCase().includes("firmware")
  );

  const supportByProductMatrix = matrixCount(
    tickets,
    "product_category",
    "support_category"
  );

  const procedureByProductMatrix = matrixCount(
    tickets,
    "product_category",
    "procedure"
  );

  const baseResult = {
    kpis: {
      totalTickets,
      totalProducts: productSummary.length,
      totalSupportCategories: supportCategorySummary.length,
      totalProductCategories: productCategorySummary.length,
      dataRecoveryCount: dataRecoveryTickets.length,
      rmaCount: rmaTickets.length,
      troubleshootCount: troubleshootTickets.length,
      registrationCount: registrationTickets.length,
      hardwareCount: hardwareTickets.length,
      informationCount: informationTickets.length,
      compatibilityCount: compatibilityTickets.length,
      firmwareCount: firmwareTickets.length,
    },
    dailySummary,
    monthlySummary,
    supportCategorySummary,
    productCategorySummary,
    procedureSummary,
    regionSummary,
    tseSummary,
    productSummary,
    dataRecoveryTickets,
    rmaTickets,
    troubleshootTickets,
    registrationTickets,
    hardwareTickets,
    informationTickets,
    compatibilityTickets,
    firmwareTickets,
    supportByProductMatrix,
    procedureByProductMatrix,
  };

  baseResult.comparison = buildComparisonItems(tickets, buildTicketAnalyticsCore);
  baseResult.supportCategoryComparison = buildTopComparison(
    tickets,
    "support_category"
  );
  baseResult.productCategoryComparison = buildTopComparison(
    tickets,
    "product_category"
  );
  baseResult.procedureComparison = buildTopComparison(tickets, "procedure");
  baseResult.regionComparison = buildTopComparison(tickets, "region");

  return baseResult;
}

function buildTicketAnalyticsCore(tickets = []) {
  const productSummary = productCount(tickets);
  const supportCategorySummary = groupCount(tickets, "support_category");
  const productCategorySummary = groupCount(tickets, "product_category");

  const dataRecoveryTickets = tickets.filter(
    (ticket) =>
      ticket.support_category.toLowerCase().includes("data recovery") ||
      ticket.procedure.toLowerCase().includes("dr")
  );

  const rmaTickets = tickets.filter(
    (ticket) =>
      ticket.procedure.toLowerCase().includes("rma") ||
      ticket.ticket_subject.toLowerCase().includes("rma")
  );

  const troubleshootTickets = tickets.filter(
    (ticket) =>
      ticket.support_category.toLowerCase().includes("troubleshoot") ||
      ticket.procedure.toLowerCase().includes("troubleshoot")
  );

  return {
    kpis: {
      totalTickets: tickets.length,
      totalProducts: productSummary.length,
      totalSupportCategories: supportCategorySummary.length,
      totalProductCategories: productCategorySummary.length,
      dataRecoveryCount: dataRecoveryTickets.length,
      rmaCount: rmaTickets.length,
      troubleshootCount: troubleshootTickets.length,
    },
  };
}