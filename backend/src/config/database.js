import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

let pool = null;

function getSafeDatabaseInfo(connectionString) {
  try {
    const url = new URL(connectionString);

    return {
      host: url.hostname,
      port: url.port,
      database: url.pathname.replace("/", ""),
      username: decodeURIComponent(url.username),
    };
  } catch {
    return {
      host: "Invalid DATABASE_URL",
      port: "",
      database: "",
      username: "",
    };
  }
}

function createPool() {
  if (!env.DATABASE_URL) {
    return null;
  }

  const connectionInfo = getSafeDatabaseInfo(
    env.DATABASE_URL
  );

  console.log("PostgreSQL configuration:", {
    host: connectionInfo.host,
    port: connectionInfo.port,
    database: connectionInfo.database,
    username: connectionInfo.username,
  });

  return new Pool({
    connectionString: env.DATABASE_URL,

    /*
     * Supabase Pooler uses SSL.
     *
     * Local development accepts the certificate chain without
     * strict certificate verification.
     *
     * Do not add sslmode=require to DATABASE_URL because it can
     * override this ssl configuration.
     */
    ssl: {
      rejectUnauthorized: false,
    },

    /*
     * Transaction pooler should use a small connection pool.
     */
    max: 5,
    min: 0,

    connectionTimeoutMillis: 20_000,
    idleTimeoutMillis: 30_000,

    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,

    application_name: "angelbird-analytics-api",
  });
}

export function getDatabasePool() {
  if (!pool) {
    pool = createPool();

    if (pool) {
      pool.on("error", (error) => {
        console.error(
          "Unexpected PostgreSQL pool error:",
          error.message
        );
      });
    }
  }

  return pool;
}

export async function testDatabaseConnection() {
  const databasePool = getDatabasePool();

  if (!databasePool) {
    return {
      connected: false,
      configured: false,
      message: "DATABASE_URL is not configured.",
    };
  }

  let client;

  try {
    client = await databasePool.connect();

    /*
     * Transaction pooler-compatible query.
     * No prepared statement name is used.
     */
    const result = await client.query(`
      select
        current_database() as database_name,
        current_user as database_user,
        current_setting('server_version') as server_version,
        now() as server_time
    `);

    return {
      connected: true,
      configured: true,
      ...result.rows[0],
    };
  } catch (error) {
    return {
      connected: false,
      configured: true,
      message: error.message,
      code: error.code || null,
    };
  } finally {
    client?.release();
  }
}

export async function queryDatabase(
  text,
  values = []
) {
  const databasePool = getDatabasePool();

  if (!databasePool) {
    throw new Error(
      "PostgreSQL connection is not configured."
    );
  }

  return databasePool.query(text, values);
}

export async function closeDatabasePool() {
  if (!pool) return;

  await pool.end();
  pool = null;
}