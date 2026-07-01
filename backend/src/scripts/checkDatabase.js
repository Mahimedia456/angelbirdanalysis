import {
  closeDatabasePool,
  testDatabaseConnection,
} from "../config/database.js";

import {
  testSupabaseConnection,
} from "../config/supabase.js";

async function runChecks() {
  try {
    console.log("Checking Supabase connection...");

    const supabase =
      await testSupabaseConnection();

    console.table([supabase]);

    console.log("");
    console.log(
      "Checking PostgreSQL pooler connection..."
    );

    const database =
      await testDatabaseConnection();

    console.table([database]);

    if (!supabase.connected) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(
      "Connection check failed:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await closeDatabasePool();
  }
}

runChecks();