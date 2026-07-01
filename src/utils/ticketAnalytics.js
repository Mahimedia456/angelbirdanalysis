function safeText(
  ...values
) {
  const value =
    values.find(
      (item) =>
        item !== undefined &&
        item !== null &&
        String(item).trim() !== ""
    );

  return value === undefined
    ? ""
    : String(value).trim();
}

function getTicketDate(
  ticket
) {
  return safeText(
    ticket.date_key,
    ticket.date,
    ticket.ticketDate,
    ticket.ticket_date,
    ticket.createdDate,
    ticket.submittedDate
  );
}

function getProduct1(
  ticket
) {
  return safeText(
    ticket.product_1,
    ticket.product1,
    ticket.product,
    ticket.productName,
    ticket.product_name
  );
}

function getProduct2(
  ticket
) {
  return safeText(
    ticket.product_2,
    ticket.product2
  );
}

function getField(
  ticket,
  key
) {
  const aliases = {
    support_category: [
      ticket.support_category,
      ticket.supportCategory,
      ticket.category,
    ],

    product_category: [
      ticket.product_category,
      ticket.productCategory,
    ],

    ticket_subject: [
      ticket.ticket_subject,
      ticket.ticketSubject,
      ticket.subject,
    ],

    procedure: [
      ticket.procedure,
    ],

    region: [
      ticket.region,
    ],

    tse: [
      ticket.tse,
    ],
  };

  return safeText(
    ...(aliases[key] || [
      ticket[key],
    ])
  );
}

function normalizeIsoDate(
  value
) {
  const text =
    safeText(value);

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      text
    )
  ) {
    return text;
  }

  return "";
}

function groupCount(
  rows,
  key
) {
  const counts =
    new Map();

  rows.forEach((row) => {
    const label =
      getField(
        row,
        key
      ) || "Unknown";

    counts.set(
      label,
      (counts.get(label) || 0) +
        1
    );
  });

  return Array.from(
    counts.entries()
  )
    .map(
      ([name, value]) => ({
        name,
        value,
      })
    )
    .sort(
      (a, b) =>
        b.value - a.value
    );
}

function productCount(rows) {
  const counts =
    new Map();

  rows.forEach((row) => {
    [
      getProduct1(row),
      getProduct2(row),
    ].forEach((product) => {
      const cleanProduct =
        safeText(product);

      if (
        !cleanProduct ||
        ["unknown", "na", "-"].includes(
          cleanProduct.toLowerCase()
        )
      ) {
        return;
      }

      counts.set(
        cleanProduct,
        (counts.get(
          cleanProduct
        ) || 0) + 1
      );
    });
  });

  return Array.from(
    counts.entries()
  )
    .map(
      ([name, value]) => ({
        name,
        value,
      })
    )
    .sort(
      (a, b) =>
        b.value - a.value
    );
}

function dailyTrend(rows) {
  const counts =
    new Map();

  rows.forEach((row) => {
    const date =
      normalizeIsoDate(
        getTicketDate(row)
      );

    if (!date) {
      return;
    }

    counts.set(
      date,
      (counts.get(date) || 0) +
        1
    );
  });

  return Array.from(
    counts.entries()
  )
    .map(
      ([name, value]) => ({
        name,
        value,
      })
    )
    .sort(
      (a, b) =>
        a.name.localeCompare(
          b.name
        )
    );
}

function includesText(
  value,
  search
) {
  return safeText(value)
    .toLowerCase()
    .includes(
      String(search)
        .toLowerCase()
    );
}

function matrixCount(
  rows,
  rowKey,
  columnKey
) {
  const rowLabels =
    Array.from(
      new Set(
        rows.map(
          (row) =>
            getField(
              row,
              rowKey
            ) || "Unknown"
        )
      )
    ).sort();

  const columnLabels =
    Array.from(
      new Set(
        rows.map(
          (row) =>
            getField(
              row,
              columnKey
            ) || "Unknown"
        )
      )
    ).sort();

  const matrixRows =
    rowLabels.map(
      (rowLabel) => {
        const item = {
          name:
            rowLabel,
          total: 0,
        };

        columnLabels.forEach(
          (columnLabel) => {
            const count =
              rows.filter(
                (row) =>
                  (getField(
                    row,
                    rowKey
                  ) ||
                    "Unknown") ===
                    rowLabel &&
                  (getField(
                    row,
                    columnKey
                  ) ||
                    "Unknown") ===
                    columnLabel
              ).length;

            item[
              columnLabel
            ] = count;

            item.total +=
              count;
          }
        );

        return item;
      }
    );

  return {
    columns:
      columnLabels,

    rows:
      matrixRows.sort(
        (a, b) =>
          b.total - a.total
      ),
  };
}

export function buildTicketAnalytics(
  tickets = []
) {
  const safeTickets =
    Array.isArray(tickets)
      ? tickets
      : [];

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

  const procedureSummary =
    groupCount(
      safeTickets,
      "procedure"
    );

  const regionSummary =
    groupCount(
      safeTickets,
      "region"
    );

  const tseSummary =
    groupCount(
      safeTickets,
      "tse"
    );

  const productSummary =
    productCount(
      safeTickets
    );

  const dailySummary =
    dailyTrend(
      safeTickets
    );

  const dataRecoveryTickets =
    safeTickets.filter(
      (ticket) =>
        includesText(
          getField(
            ticket,
            "support_category"
          ),
          "data recovery"
        ) ||
        includesText(
          getField(
            ticket,
            "procedure"
          ),
          "dr"
        )
    );

  const rmaTickets =
    safeTickets.filter(
      (ticket) =>
        includesText(
          getField(
            ticket,
            "procedure"
          ),
          "rma"
        ) ||
        includesText(
          getField(
            ticket,
            "ticket_subject"
          ),
          "rma"
        )
    );

  const troubleshootTickets =
    safeTickets.filter(
      (ticket) =>
        includesText(
          getField(
            ticket,
            "support_category"
          ),
          "troubleshoot"
        ) ||
        includesText(
          getField(
            ticket,
            "procedure"
          ),
          "troubleshoot"
        )
    );

  const registrationTickets =
    safeTickets.filter(
      (ticket) =>
        includesText(
          getField(
            ticket,
            "support_category"
          ),
          "registration"
        )
    );

  const hardwareTickets =
    safeTickets.filter(
      (ticket) =>
        includesText(
          getField(
            ticket,
            "support_category"
          ),
          "hardware"
        )
    );

  const informationTickets =
    safeTickets.filter(
      (ticket) =>
        includesText(
          getField(
            ticket,
            "support_category"
          ),
          "information"
        )
    );

  const compatibilityTickets =
    safeTickets.filter(
      (ticket) =>
        includesText(
          getField(
            ticket,
            "support_category"
          ),
          "compatibility"
        )
    );

  const firmwareTickets =
    safeTickets.filter(
      (ticket) =>
        includesText(
          getField(
            ticket,
            "support_category"
          ),
          "firmware"
        ) ||
        includesText(
          getField(
            ticket,
            "procedure"
          ),
          "firmware"
        ) ||
        includesText(
          getField(
            ticket,
            "ticket_subject"
          ),
          "firmware"
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

    /*
     * Selected period already represents one month,
     * therefore only daily trend is required.
     */
    dailySummary,

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

    supportByProductMatrix:
      matrixCount(
        safeTickets,
        "product_category",
        "support_category"
      ),

    procedureByProductMatrix:
      matrixCount(
        safeTickets,
        "product_category",
        "procedure"
      ),
  };
}