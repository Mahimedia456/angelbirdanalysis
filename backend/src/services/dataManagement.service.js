import { getDatabasePool } from "../config/database.js";
import { supabaseAdmin } from "../config/supabase.js";

export async function deleteReportingPeriodData({
  periodKey,
  userId,
}) {
  const pool = getDatabasePool();
  const client = await pool.connect();

  let storageFiles = [];

  try {
    await client.query("begin");

    const periodResult = await client.query(
      `
        select
          id,
          period_key,
          period_name
        from public.reporting_periods
        where period_key = $1
        limit 1
      `,
      [periodKey]
    );

    const period = periodResult.rows[0];

    if (!period) {
      const error = new Error(
        "Reporting period was not found."
      );

      error.statusCode = 404;
      throw error;
    }

    const batchesResult = await client.query(
      `
        select
          id,
          storage_bucket,
          storage_path
        from public.import_batches
        where period_id = $1
      `,
      [period.id]
    );

    storageFiles = batchesResult.rows
      .filter(
        (row) =>
          row.storage_bucket &&
          row.storage_path
      )
      .map((row) => ({
        bucket: row.storage_bucket,
        path: row.storage_path,
      }));

    const ticketResult = await client.query(
      `
        delete from public.ticket_records
        where period_id = $1
      `,
      [period.id]
    );

    const productResult = await client.query(
      `
        delete from public.product_records
        where period_id = $1
      `,
      [period.id]
    );

    const satisfactionResult =
      await client.query(
        `
          delete from public.satisfaction_records
          where period_id = $1
        `,
        [period.id]
      );

    const batchResult = await client.query(
      `
        delete from public.import_batches
        where period_id = $1
      `,
      [period.id]
    );

    await client.query(
      `
        insert into public.audit_logs (
          user_id,
          action,
          entity_type,
          entity_id,
          metadata
        )
        values (
          $1,
          'reporting_period.data_deleted',
          'reporting_period',
          $2,
          $3::jsonb
        )
      `,
      [
        userId,
        period.id,
        JSON.stringify({
          periodKey:
            period.period_key,
          periodName:
            period.period_name,
          deletedTickets:
            ticketResult.rowCount,
          deletedProducts:
            productResult.rowCount,
          deletedSatisfaction:
            satisfactionResult.rowCount,
          deletedImportBatches:
            batchResult.rowCount,
        }),
      ]
    );

    await client.query("commit");

    for (const file of storageFiles) {
      await supabaseAdmin.storage
        .from(file.bucket)
        .remove([file.path]);
    }

    return {
      period,

      deleted: {
        tickets:
          ticketResult.rowCount,

        products:
          productResult.rowCount,

        satisfaction:
          satisfactionResult.rowCount,

        importBatches:
          batchResult.rowCount,

        storageFiles:
          storageFiles.length,
      },
    };
  } catch (error) {
    try {
      await client.query("rollback");
    } catch {
      // Ignore rollback failure.
    }

    throw error;
  } finally {
    client.release();
  }
}