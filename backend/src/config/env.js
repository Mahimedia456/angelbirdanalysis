import "dotenv/config";
import { z } from "zod";

function cleanEnvValue(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return undefined;
  }

  const cleaned = String(value).trim();

  return cleaned || undefined;
}

function parseBoolean(value) {
  return [
    "true",
    "1",
    "yes",
    "y",
    "on",
  ].includes(
    String(value || "")
      .trim()
      .toLowerCase()
  );
}

function parseFrontendUrls(value) {
  const raw = String(
    value ||
      "http://localhost:5173"
  );

  return raw
    .split(",")
    .map((item) =>
      item.trim()
    )
    .filter(Boolean);
}

const envSchema = z.object({
  NODE_ENV: z
    .enum([
      "development",
      "test",
      "production",
    ])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(5000),

  /*
   * Supports one URL:
   * https://reportangelbird.mahimediasolutions.com
   *
   * Or multiple comma-separated URLs:
   * http://localhost:5173,https://reportangelbird.mahimediasolutions.com
   */
  FRONTEND_URL: z
    .string()
    .default(
      "http://localhost:5173"
    ),

  SUPABASE_URL: z
    .string()
    .default(""),

  SUPABASE_ANON_KEY: z
    .string()
    .default(""),

  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .default(""),

  SUPABASE_STORAGE_BUCKET: z
    .string()
    .min(1)
    .default("csv"),

  DATABASE_URL: z
    .string()
    .default(""),

  DATABASE_REQUIRED: z
    .union([
      z.string(),
      z.boolean(),
    ])
    .optional()
    .transform(
      parseBoolean
    ),

  JWT_SECRET: z
    .string()
    .default(""),

  JWT_ACCESS_EXPIRES_IN: z
    .string()
    .default("15m"),

  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .default("30d"),

  OPENAI_API_KEY: z
    .string()
    .default(""),

  OPENAI_MODEL: z
    .string()
    .default(
      "gpt-4.1-mini"
    ),

  VERCEL: z
    .string()
    .optional(),

  VERCEL_ENV: z
    .string()
    .optional(),

  VERCEL_URL: z
    .string()
    .optional(),
});

const normalizedProcessEnv = {
  ...process.env,

  NODE_ENV:
    cleanEnvValue(
      process.env.NODE_ENV
    ) || "development",

  PORT:
    cleanEnvValue(
      process.env.PORT
    ) || "5000",

  FRONTEND_URL:
    cleanEnvValue(
      process.env.FRONTEND_URL
    ) ||
    "http://localhost:5173",

  SUPABASE_URL:
    cleanEnvValue(
      process.env.SUPABASE_URL
    ) || "",

  SUPABASE_ANON_KEY:
    cleanEnvValue(
      process.env
        .SUPABASE_ANON_KEY
    ) || "",

  SUPABASE_SERVICE_ROLE_KEY:
    cleanEnvValue(
      process.env
        .SUPABASE_SERVICE_ROLE_KEY
    ) || "",

  SUPABASE_STORAGE_BUCKET:
    cleanEnvValue(
      process.env
        .SUPABASE_STORAGE_BUCKET
    ) || "csv",

  DATABASE_URL:
    cleanEnvValue(
      process.env.DATABASE_URL
    ) || "",

  DATABASE_REQUIRED:
    cleanEnvValue(
      process.env
        .DATABASE_REQUIRED
    ) || "false",

  JWT_SECRET:
    cleanEnvValue(
      process.env.JWT_SECRET
    ) || "",

  JWT_ACCESS_EXPIRES_IN:
    cleanEnvValue(
      process.env
        .JWT_ACCESS_EXPIRES_IN
    ) || "15m",

  JWT_REFRESH_EXPIRES_IN:
    cleanEnvValue(
      process.env
        .JWT_REFRESH_EXPIRES_IN
    ) || "30d",

  OPENAI_API_KEY:
    cleanEnvValue(
      process.env
        .OPENAI_API_KEY
    ) || "",

  OPENAI_MODEL:
    cleanEnvValue(
      process.env.OPENAI_MODEL
    ) || "gpt-4.1-mini",
};

const parsed =
  envSchema.safeParse(
    normalizedProcessEnv
  );

let parsedEnv;

if (!parsed.success) {
  /*
   * Do not call process.exit() here.
   *
   * Vercel imports this module while starting
   * the serverless function. process.exit()
   * causes FUNCTION_INVOCATION_FAILED.
   */
  console.error(
    "Invalid backend environment variables:"
  );

  parsed.error.issues.forEach(
    (issue) => {
      console.error(
        `- ${issue.path.join(
          "."
        )}: ${issue.message}`
      );
    }
  );

  /*
   * Safe fallback lets the API boot so that
   * the health/root route can expose a useful
   * configuration error instead of crashing.
   */
  parsedEnv = {
    NODE_ENV:
      normalizedProcessEnv.NODE_ENV,

    PORT: Number(
      normalizedProcessEnv.PORT
    ) || 5000,

    FRONTEND_URL:
      normalizedProcessEnv
        .FRONTEND_URL,

    SUPABASE_URL:
      normalizedProcessEnv
        .SUPABASE_URL,

    SUPABASE_ANON_KEY:
      normalizedProcessEnv
        .SUPABASE_ANON_KEY,

    SUPABASE_SERVICE_ROLE_KEY:
      normalizedProcessEnv
        .SUPABASE_SERVICE_ROLE_KEY,

    SUPABASE_STORAGE_BUCKET:
      normalizedProcessEnv
        .SUPABASE_STORAGE_BUCKET,

    DATABASE_URL:
      normalizedProcessEnv
        .DATABASE_URL,

    DATABASE_REQUIRED:
      parseBoolean(
        normalizedProcessEnv
          .DATABASE_REQUIRED
      ),

    JWT_SECRET:
      normalizedProcessEnv
        .JWT_SECRET,

    JWT_ACCESS_EXPIRES_IN:
      normalizedProcessEnv
        .JWT_ACCESS_EXPIRES_IN,

    JWT_REFRESH_EXPIRES_IN:
      normalizedProcessEnv
        .JWT_REFRESH_EXPIRES_IN,

    OPENAI_API_KEY:
      normalizedProcessEnv
        .OPENAI_API_KEY,

    OPENAI_MODEL:
      normalizedProcessEnv
        .OPENAI_MODEL,

    VERCEL:
      process.env.VERCEL,

    VERCEL_ENV:
      process.env.VERCEL_ENV,

    VERCEL_URL:
      process.env.VERCEL_URL,
  };
} else {
  parsedEnv =
    parsed.data;
}

export const env = {
  ...parsedEnv,

  /*
   * Convenient array for CORS.
   */
  FRONTEND_URLS:
    parseFrontendUrls(
      parsedEnv.FRONTEND_URL
    ),

  IS_PRODUCTION:
    parsedEnv.NODE_ENV ===
    "production",

  IS_DEVELOPMENT:
    parsedEnv.NODE_ENV ===
    "development",

  IS_TEST:
    parsedEnv.NODE_ENV ===
    "test",

  IS_VERCEL:
    Boolean(
      parsedEnv.VERCEL
    ),
};

export function getMissingRequiredEnv() {
  const missing = [];

  if (!env.SUPABASE_URL) {
    missing.push(
      "SUPABASE_URL"
    );
  }

  if (
    !env.SUPABASE_ANON_KEY
  ) {
    missing.push(
      "SUPABASE_ANON_KEY"
    );
  }

  if (
    !env
      .SUPABASE_SERVICE_ROLE_KEY
  ) {
    missing.push(
      "SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  if (
    env.DATABASE_REQUIRED &&
    !env.DATABASE_URL
  ) {
    missing.push(
      "DATABASE_URL"
    );
  }

  return missing;
}

export function assertSupabaseEnv() {
  const missing = [];

  if (!env.SUPABASE_URL) {
    missing.push(
      "SUPABASE_URL"
    );
  }

  if (
    !env.SUPABASE_ANON_KEY
  ) {
    missing.push(
      "SUPABASE_ANON_KEY"
    );
  }

  if (
    !env
      .SUPABASE_SERVICE_ROLE_KEY
  ) {
    missing.push(
      "SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  if (missing.length) {
    const error = new Error(
      `Missing Supabase environment variables: ${missing.join(
        ", "
      )}`
    );

    error.statusCode = 500;
    error.code =
      "MISSING_SUPABASE_ENV";

    throw error;
  }
}

export function assertDatabaseEnv() {
  if (!env.DATABASE_URL) {
    const error = new Error(
      "DATABASE_URL is not configured."
    );

    error.statusCode = 500;
    error.code =
      "MISSING_DATABASE_URL";

    throw error;
  }
}

export function assertJwtEnv() {
  if (!env.JWT_SECRET) {
    const error = new Error(
      "JWT_SECRET is not configured."
    );

    error.statusCode = 500;
    error.code =
      "MISSING_JWT_SECRET";

    throw error;
  }
}

export function assertOpenAiEnv() {
  if (!env.OPENAI_API_KEY) {
    const error = new Error(
      "OPENAI_API_KEY is not configured."
    );

    error.statusCode = 503;
    error.code =
      "MISSING_OPENAI_API_KEY";

    throw error;
  }
}

const missingRequiredEnv =
  getMissingRequiredEnv();

if (
  missingRequiredEnv.length
) {
  console.warn(
    `Backend started with missing environment variables: ${missingRequiredEnv.join(
      ", "
    )}`
  );
}