import { Router } from "express";

import { env } from "../config/env.js";

import {
  testDatabaseConnection,
} from "../config/database.js";

import {
  testSupabaseConnection,
} from "../config/supabase.js";

const router = Router();

router.get("/", async (request, response) => {
  const [database, supabase] = await Promise.all([
    testDatabaseConnection(),
    testSupabaseConnection(),
  ]);

  const operational = supabase.connected;

  response
    .status(operational ? 200 : 503)
    .json({
      success: operational,

      message: operational
        ? "Angelbird Analytics API is operational."
        : "Angelbird Analytics API has a connection problem.",

      environment: env.NODE_ENV,

      api: {
        connected: true,
        port: env.PORT,
      },

      supabase: {
        ...supabase,
        url: env.SUPABASE_URL,
        storageBucket:
          env.SUPABASE_STORAGE_BUCKET,
      },

      postgres: database,

      timestamp: new Date().toISOString(),
    });
});

export default router;