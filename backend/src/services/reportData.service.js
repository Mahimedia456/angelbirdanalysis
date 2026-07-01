import {
  supabaseAdmin,
} from "../config/supabase.js";

function safeText(
  ...values
) {
  const value = values.find(
    (item) =>
      item !== undefined &&
      item !== null &&
      String(item).trim() !== ""
  );

  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();
}

function safeObject(value) {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? value
    : {};
}

function normalizeTicket(row) {
  const raw =
    safeObject(
      row.raw_data
    );

  const ticketDate =
    safeText(
      row.ticket_date,
      raw.ticketDate,
      raw.ticket_date,
      raw.date,
      raw.Date,
      raw.createdDate,
      raw.created_date
    );

  const ticketNumber =
    safeText(
      row.ticket_number,
      raw.ticketNumber,
      raw.ticket_number,
      raw.ticketNo,
      raw.ticket_no,
      raw["Ticket #"],
      raw["ticket #"]
    );

  const product1 =
    safeText(
      row.product_1,
      raw.product1,
      raw.product_1,
      raw["Product 1"],
      raw.product,
      raw.productName,
      raw.product_name
    );

  const product2 =
    safeText(
      row.product_2,
      raw.product2,
      raw.product_2,
      raw["Product 2"]
    );

  const products = [
    product1,
    product2,
  ]
    .filter(Boolean)
    .join(", ");

  const supportCategory =
    safeText(
      row.support_category,
      raw.supportCategory,
      raw.support_category,
      raw["Support Category"],
      raw.category
    );

  const productCategory =
    safeText(
      row.product_category,
      raw.productCategory,
      raw.product_category,
      raw["Product Category"]
    );

  const ticketSubject =
    safeText(
      row.ticket_subject,
      raw.ticketSubject,
      raw.ticket_subject,
      raw["Ticket Subject"],
      raw.subject
    );

  return {
    id: row.id,

    /*
     * Date aliases for table,
     * filters and charts.
     */
    date: ticketDate,
    ticketDate,
    ticket_date:
      ticketDate,
    createdDate:
      ticketDate,
    submittedDate:
      ticketDate,

    /*
     * Ticket number aliases.
     */
    ticketNumber,
    ticketNo:
      ticketNumber,
    ticket_number:
      ticketNumber,
    ticketId:
      ticketNumber,

    region:
      safeText(
        row.region,
        raw.region,
        raw.Region
      ),

    tse:
      safeText(
        row.tse,
        raw.tse,
        raw.TSE,
        raw.agent,
        raw.engineer
      ),

    submitted:
      safeText(
        row.submitted,
        raw.submitted
      ),

    /*
     * Product aliases used by
     * tables and analytics.
     */
    product1,
    product_1:
      product1,

    product2,
    product_2:
      product2,

    product:
      product1,

    productName:
      product1,

    product_name:
      product1,

    products,

    ticketSubject,
    ticket_subject:
      ticketSubject,

    supportCategory,
    support_category:
      supportCategory,

    category:
      supportCategory,

    productCategory,
    product_category:
      productCategory,

    procedure:
      safeText(
        row.procedure,
        raw.procedure,
        raw.Procedure
      ),

    status:
      safeText(
        raw.status,
        raw.Status
      ),

    solvedStatus:
      safeText(
        raw.solvedStatus,
        raw.solved_status,
        raw.status
      ),

    periodId:
      row.period_id,

    period_id:
      row.period_id,

    importBatchId:
      row.import_batch_id,

    import_batch_id:
      row.import_batch_id,

    sourceRowNumber:
      row.source_row_number,

    rawData: raw,
    raw_data: raw,

    originalData: raw,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

function normalizeProduct(row) {
  const raw =
    safeObject(
      row.raw_data
    );

  const productName =
    safeText(
      row.product_name,
      raw.productName,
      raw.product_name,
      raw["Product Name"],
      raw.product,
      raw.Product,
      raw.name,
      raw.Name,
      raw.model
    );

  const category =
    safeText(
      row.category,
      raw.category,
      raw.Category,
      raw.productCategory,
      raw.product_category,
      raw["Product Category"]
    );

  return {
    id: row.id,

    productName,
    product_name:
      productName,

    product:
      productName,

    name:
      productName,

    title:
      productName,

    category,

    productCategory:
      category,

    product_category:
      category,

    sku:
      safeText(
        row.sku,
        raw.sku,
        raw.SKU
      ),

    ean:
      safeText(
        row.ean,
        raw.ean,
        raw.EAN
      ),

    upc:
      safeText(
        row.upc,
        raw.upc,
        raw.UPC
      ),

    periodId:
      row.period_id,

    period_id:
      row.period_id,

    importBatchId:
      row.import_batch_id,

    import_batch_id:
      row.import_batch_id,

    sourceRowNumber:
      row.source_row_number,

    rawData: raw,
    raw_data: raw,

    originalData: raw,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

function normalizeSatisfaction(
  row
) {
  const raw =
    safeObject(
      row.raw_data
    );

  const ticketNumber =
    safeText(
      row.ticket_id,
      raw.ticketId,
      raw.ticket_id,
      raw.ticketNumber,
      raw.ticket_number,
      raw["Ticket #"]
    );

  const rating =
    safeText(
      row.rating,
      raw.rating,
      "Unknown"
    );

  const isSolved =
    Boolean(
      row.is_solved
    );

  const updatedDate =
    safeText(
      row.updated_date,
      raw.updatedDate,
      raw.updated_date,
      raw.responseDate,
      raw.response_date,
      raw.date
    );

  return {
    id: row.id,

    ticketId:
      ticketNumber,

    ticket_id:
      ticketNumber,

    ticketNumber,

    ticket_number:
      ticketNumber,

    rating,

    score:
      rating === "Good"
        ? 5
        : rating === "Bad"
          ? 1
          : 0,

    comment:
      safeText(
        row.comment,
        raw.comment,
        raw.comments,
        raw.feedback
      ),

    comments:
      safeText(
        row.comment,
        raw.comment,
        raw.comments,
        raw.feedback
      ),

    reason:
      safeText(
        row.reason,
        raw.reason
      ),

    updatedDate,

    updated_date:
      updatedDate,

    responseDate:
      updatedDate,

    date:
      updatedDate,

    isSolved,

    is_solved:
      isSolved,

    solvedStatus:
      isSolved
        ? "Solved"
        : "Unsolved",

    status:
      isSolved
        ? "Solved"
        : "Unsolved",

    periodId:
      row.period_id,

    period_id:
      row.period_id,

    importBatchId:
      row.import_batch_id,

    import_batch_id:
      row.import_batch_id,

    sourceRowNumber:
      row.source_row_number,

    rawData: raw,
    raw_data: raw,

    originalData: raw,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

async function getAllRows(
  tableName,
  periodId,
  orderColumn
) {
  const pageSize = 1000;
  let from = 0;
  let allRows = [];

  while (true) {
    const query =
      supabaseAdmin
        .from(tableName)
        .select("*")
        .eq(
          "period_id",
          periodId
        )
        .range(
          from,
          from +
            pageSize -
            1
        );

    if (orderColumn) {
      query.order(
        orderColumn,
        {
          ascending: true,
        }
      );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      throw error;
    }

    const rows =
      data || [];

    allRows =
      allRows.concat(rows);

    if (
      rows.length <
      pageSize
    ) {
      break;
    }

    from += pageSize;
  }

  return allRows;
}

export async function fetchMonthlyReportData(
  requestedPeriodKey
) {
  const {
    data: periods,
    error: periodsError,
  } = await supabaseAdmin
    .from(
      "reporting_periods"
    )
    .select(`
      id,
      report_year,
      report_month,
      period_key,
      period_name,
      period_start,
      period_end,
      status
    `)
    .order(
      "report_year",
      {
        ascending: false,
      }
    )
    .order(
      "report_month",
      {
        ascending: false,
      }
    );

  if (periodsError) {
    throw periodsError;
  }

  const safePeriods =
    periods || [];

  const selectedPeriod =
    safePeriods.find(
      (period) =>
        period.period_key ===
        requestedPeriodKey
    ) ||
    safePeriods[0] ||
    null;

  if (!selectedPeriod) {
    return {
      selectedPeriod: null,
      periods: [],
      tickets: [],
      products: [],
      satisfaction: [],

      counts: {
        tickets: 0,
        products: 0,
        satisfaction: 0,
      },
    };
  }

  const [
    ticketRows,
    productRows,
    satisfactionRows,
  ] = await Promise.all([
    getAllRows(
      "ticket_records",
      selectedPeriod.id,
      "ticket_date"
    ),

    getAllRows(
      "product_records",
      selectedPeriod.id,
      "product_name"
    ),

    getAllRows(
      "satisfaction_records",
      selectedPeriod.id,
      "updated_date"
    ),
  ]);

  const tickets =
    ticketRows.map(
      normalizeTicket
    );

  const products =
    productRows.map(
      normalizeProduct
    );

  const satisfaction =
    satisfactionRows.map(
      normalizeSatisfaction
    );

  return {
    selectedPeriod,
    periods:
      safePeriods,

    tickets,
    products,
    satisfaction,

    counts: {
      tickets:
        tickets.length,

      products:
        products.length,

      satisfaction:
        satisfaction.length,
    },
  };
}