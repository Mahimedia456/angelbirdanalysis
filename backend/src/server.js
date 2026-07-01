import app from "./app.js";
import { env } from "./config/env.js";

import {
  closeDatabasePool,
  testDatabaseConnection,
} from "./config/database.js";

import {
  testSupabaseConnection,
} from "./config/supabase.js";

async function startServer() {
  try {
    console.log("Starting Angelbird Analytics API...");

    const supabaseStatus =
      await testSupabaseConnection();

    if (!supabaseStatus.connected) {
      throw new Error(
        `Supabase connection failed: ${supabaseStatus.message}`
      );
    }

    console.log(
      `Supabase connected. Reporting periods: ${supabaseStatus.reportingPeriods}`
    );

    const databaseStatus =
      await testDatabaseConnection();

    if (databaseStatus.connected) {
      console.log(
        `PostgreSQL connected: ${databaseStatus.database_name}`
      );
    } else {
      console.warn(
        `PostgreSQL connection unavailable: ${databaseStatus.message}`
      );

      if (env.DATABASE_REQUIRED) {
        throw new Error(
          `PostgreSQL is required but unavailable: ${databaseStatus.message}`
        );
      }

      console.warn(
        "API will continue using Supabase Data API."
      );
    }

    const server = app.listen(env.PORT, () => {
      console.log("");
      console.log(
        `Angelbird API running on http://localhost:${env.PORT}`
      );

      console.log(
        `Health check: http://localhost:${env.PORT}/api/health`
      );
    });

    async function shutdown(signal) {
      console.log(
        `${signal} received. Closing server...`
      );

      server.close(async () => {
        await closeDatabasePool();
        process.exit(0);
      });
    }

    process.on("SIGINT", () => {
      shutdown("SIGINT");
    });

    process.on("SIGTERM", () => {
      shutdown("SIGTERM");
    });
  } catch (error) {
    console.error(
      "Failed to start Angelbird API:",
      error.message
    );

    await closeDatabasePool();

    process.exit(1);
  }
}

startServer();