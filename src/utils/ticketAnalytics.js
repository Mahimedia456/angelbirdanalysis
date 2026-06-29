function safeText(value = "") {
  return String(value ?? "").trim();
}

function groupCount(rows = [], key) {
  const map = {};

  rows.forEach((row) => {
    const label = safeText(row?.[key]) || "Unknown";
    map[label] = (map[label] || 0) + 1;
  });

  return Object.entries(map)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value);
}

function productCount(rows = []) {
  const map = {};

  rows.forEach((row) => {
    const product1 = safeText(row?.product_1);
    const product2 = safeText(row?.product_2);

    if (product1 && product1 !== "Unknown" && product1 !== "NA") {
      map[product1] = (map[product1] || 0) + 1;
    }

    if (product2 && product2 !== "Unknown" && product2 !== "NA") {
      map[product2] = (map[product2] || 0) + 1;
    }
  });

  return Object.entries(map)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value);
}

function isValidDateKey(value = "") {
  const text = safeText(value);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return false;
  }

  const [yearText, monthText, dayText] = text.split("-");

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!Number.isInteger(year) || year < 2000 || year > 2030) {
    return false;
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return false;
  }

  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function dailyTrend(rows = []) {
  const map = {};

  rows.forEach((row) => {
    const dateKey = safeText(row?.date_key);

    if (!isValidDateKey(dateKey)) {
      return;
    }

    map[dateKey] = (map[dateKey] || 0) + 1;
  });

  return Object.entries(map)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function monthlyTrend(rows = []) {
  const map = {};

  rows.forEach((row) => {
    const dateKey = safeText(row?.date_key);

    if (!isValidDateKey(dateKey)) {
      return;
    }

    /*
     * Month is always derived from the validated date_key.
     *
     * Example:
     * 2026-04-01 -> 2026-04
     *
     * Do not trust row.month_key because old localStorage records
     * may contain invalid values such as 2034-01 or 2036-01.
     */
    const monthKey = dateKey.slice(0, 7);

    map[monthKey] = (map[monthKey] || 0) + 1;
  });

  return Object.entries(map)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function changePercent(current, previous) {
  const currentValue = Number(current || 0);
  const previousValue = Number(previous || 0);

  if (previousValue === 0 && currentValue === 0) {
    return 0;
  }

  if (previousValue === 0 && currentValue > 0) {
    return 100;
  }

  return ((currentValue - previousValue) / previousValue) * 100;
}

function splitCurrentPreviousByDate(rows = []) {
  const validRows = rows
    .filter((row) => isValidDateKey(row?.date_key))
    .sort((a, b) =>
      safeText(a?.date_key).localeCompare(safeText(b?.date_key))
    );

  if (!validRows.length) {
    return {
      current: [],
      previous: [],
      currentLabel: "No valid dates",
      previousLabel: "No valid dates",
    };
  }

  const uniqueDates = Array.from(
    new Set(validRows.map((row) => safeText(row.date_key)))
  );

  if (uniqueDates.length === 1) {
    return {
      current: validRows,
      previous: [],
      currentLabel: uniqueDates[0],
      previousLabel: "No previous period",
    };
  }

  const midpoint = Math.ceil(uniqueDates.length / 2);

  const previousDates = uniqueDates.slice(0, midpoint);
  const currentDates = uniqueDates.slice(midpoint);

  if (!currentDates.length) {
    return {
      current: validRows,
      previous: [],
      currentLabel: uniqueDates[0],
      previousLabel: "No previous period",
    };
  }

  const previousSet = new Set(previousDates);
  const currentSet = new Set(currentDates);

  return {
    current: validRows.filter((row) =>
      currentSet.has(safeText(row.date_key))
    ),

    previous: validRows.filter((row) =>
      previousSet.has(safeText(row.date_key))
    ),

    currentLabel: `${currentDates[0]} to ${
      currentDates[currentDates.length - 1]
    }`,

    previousLabel: `${previousDates[0]} to ${
      previousDates[previousDates.length - 1]
    }`,
  };
}

function categoryValue(rows = [], key, value) {
  const expected = safeText(value);

  return rows.filter(
    (row) => safeText(row?.[key]) === expected
  ).length;
}

function buildComparisonItems(allRows = [], analyticsBuilder) {
  const split = splitCurrentPreviousByDate(allRows);

  const currentAnalytics = analyticsBuilder(split.current);
  const previousAnalytics = analyticsBuilder(split.previous);

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
        changePercent: changePercent(
          split.current.length,
          split.previous.length
        ),
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

function buildTopComparison(rows = [], key) {
  const split = splitCurrentPreviousByDate(rows);

  const currentSummary = groupCount(split.current, key).slice(0, 8);

  return currentSummary.map((item) => {
    const previous = categoryValue(
      split.previous,
      key,
      item.name
    );

    return {
      name: item.name,
      value: item.value,
      previous,
      changePercent: changePercent(item.value, previous),
    };
  });
}

function matrixCount(rows = [], rowKey, columnKey) {
  const rowLabels = Array.from(
    new Set(
      rows.map(
        (row) => safeText(row?.[rowKey]) || "Unknown"
      )
    )
  ).sort((a, b) => a.localeCompare(b));

  const columnLabels = Array.from(
    new Set(
      rows.map(
        (row) => safeText(row?.[columnKey]) || "Unknown"
      )
    )
  ).sort((a, b) => a.localeCompare(b));

  const data = rowLabels.map((rowLabel) => {
    const item = {
      name: rowLabel,
      total: 0,
    };

    columnLabels.forEach((columnLabel) => {
      const count = rows.filter((row) => {
        const currentRowLabel =
          safeText(row?.[rowKey]) || "Unknown";

        const currentColumnLabel =
          safeText(row?.[columnKey]) || "Unknown";

        return (
          currentRowLabel === rowLabel &&
          currentColumnLabel === columnLabel
        );
      }).length;

      item[columnLabel] = count;
      item.total += count;
    });

    return item;
  });

  return {
    columns: columnLabels,
    rows: data.sort((a, b) => b.total - a.total),
  };
}

function contains(value, search) {
  return safeText(value)
    .toLowerCase()
    .includes(String(search || "").toLowerCase());
}

export function buildTicketAnalytics(tickets = []) {
  const safeTickets = Array.isArray(tickets)
    ? tickets
    : [];

  const totalTickets = safeTickets.length;

  const dailySummary = dailyTrend(safeTickets);
  const monthlySummary = monthlyTrend(safeTickets);

  const supportCategorySummary = groupCount(
    safeTickets,
    "support_category"
  );

  const productCategorySummary = groupCount(
    safeTickets,
    "product_category"
  );

  const procedureSummary = groupCount(
    safeTickets,
    "procedure"
  );

  const regionSummary = groupCount(
    safeTickets,
    "region"
  );

  const tseSummary = groupCount(
    safeTickets,
    "tse"
  );

  const productSummary = productCount(
    safeTickets
  );

  const dataRecoveryTickets = safeTickets.filter(
    (ticket) =>
      contains(
        ticket?.support_category,
        "data recovery"
      ) ||
      contains(ticket?.procedure, "dr")
  );

  const rmaTickets = safeTickets.filter(
    (ticket) =>
      contains(ticket?.procedure, "rma") ||
      contains(ticket?.ticket_subject, "rma")
  );

  const troubleshootTickets = safeTickets.filter(
    (ticket) =>
      contains(
        ticket?.support_category,
        "troubleshoot"
      ) ||
      contains(
        ticket?.procedure,
        "troubleshoot"
      )
  );

  const registrationTickets = safeTickets.filter(
    (ticket) =>
      contains(
        ticket?.support_category,
        "registration"
      )
  );

  const hardwareTickets = safeTickets.filter(
    (ticket) =>
      contains(
        ticket?.support_category,
        "hardware"
      )
  );

  const informationTickets = safeTickets.filter(
    (ticket) =>
      contains(
        ticket?.support_category,
        "information"
      )
  );

  const compatibilityTickets = safeTickets.filter(
    (ticket) =>
      contains(
        ticket?.support_category,
        "compatibility"
      )
  );

  const firmwareTickets = safeTickets.filter(
    (ticket) =>
      contains(
        ticket?.support_category,
        "firmware"
      ) ||
      contains(ticket?.procedure, "firmware") ||
      contains(
        ticket?.ticket_subject,
        "firmware"
      )
  );

  const supportByProductMatrix = matrixCount(
    safeTickets,
    "product_category",
    "support_category"
  );

  const procedureByProductMatrix = matrixCount(
    safeTickets,
    "product_category",
    "procedure"
  );

  const result = {
    kpis: {
      totalTickets,

      totalProducts:
        productSummary.length,

      totalSupportCategories:
        supportCategorySummary.length,

      totalProductCategories:
        productCategorySummary.length,

      dataRecoveryCount:
        dataRecoveryTickets.length,

      rmaCount:
        rmaTickets.length,

      troubleshootCount:
        troubleshootTickets.length,

      registrationCount:
        registrationTickets.length,

      hardwareCount:
        hardwareTickets.length,

      informationCount:
        informationTickets.length,

      compatibilityCount:
        compatibilityTickets.length,

      firmwareCount:
        firmwareTickets.length,
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

  result.comparison = buildComparisonItems(
    safeTickets,
    buildTicketAnalyticsCore
  );

  result.supportCategoryComparison =
    buildTopComparison(
      safeTickets,
      "support_category"
    );

  result.productCategoryComparison =
    buildTopComparison(
      safeTickets,
      "product_category"
    );

  result.procedureComparison =
    buildTopComparison(
      safeTickets,
      "procedure"
    );

  result.regionComparison =
    buildTopComparison(
      safeTickets,
      "region"
    );

  return result;
}

function buildTicketAnalyticsCore(tickets = []) {
  const safeTickets = Array.isArray(tickets)
    ? tickets
    : [];

  const productSummary =
    productCount(safeTickets);

  const supportCategorySummary =
    groupCount(
      safeTickets,
      "support_category"
    );

  const productCategorySummary =
    groupCount(
      safeTickets,
      "product_category"
    );

  const dataRecoveryTickets =
    safeTickets.filter(
      (ticket) =>
        contains(
          ticket?.support_category,
          "data recovery"
        ) ||
        contains(ticket?.procedure, "dr")
    );

  const rmaTickets =
    safeTickets.filter(
      (ticket) =>
        contains(ticket?.procedure, "rma") ||
        contains(
          ticket?.ticket_subject,
          "rma"
        )
    );

  const troubleshootTickets =
    safeTickets.filter(
      (ticket) =>
        contains(
          ticket?.support_category,
          "troubleshoot"
        ) ||
        contains(
          ticket?.procedure,
          "troubleshoot"
        )
    );

  return {
    kpis: {
      totalTickets:
        safeTickets.length,

      totalProducts:
        productSummary.length,

      totalSupportCategories:
        supportCategorySummary.length,

      totalProductCategories:
        productCategorySummary.length,

      dataRecoveryCount:
        dataRecoveryTickets.length,

      rmaCount:
        rmaTickets.length,

      troubleshootCount:
        troubleshootTickets.length,
    },
  };
}