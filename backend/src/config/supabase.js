import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

const commonAuthOptions = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
};

export const supabasePublic = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: commonAuthOptions,
  }
);

export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: commonAuthOptions,
    db: {
      schema: "public",
    },
  }
);

export function createUserScopedSupabase(accessToken) {
  return createClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },

      auth: commonAuthOptions,

      db: {
        schema: "public",
      },
    }
  );
}

export async function testSupabaseConnection() {
  const { count, error } = await supabaseAdmin
    .from("reporting_periods")
    .select("*", {
      count: "exact",
      head: true,
    });

  if (error) {
    return {
      connected: false,
      message: error.message,
      code: error.code || null,
    };
  }

  return {
    connected: true,
    reportingPeriods: count || 0,
  };
}