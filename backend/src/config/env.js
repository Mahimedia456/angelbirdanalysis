import "dotenv/config";
import { z } from "zod";

const booleanFromEnv = z
  .string()
  .optional()
  .transform((value) => {
    return String(value || "").toLowerCase() === "true";
  });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(5000),

  FRONTEND_URL: z
    .string()
    .url()
    .default("http://localhost:5173"),

  SUPABASE_URL: z.string().url(),

  SUPABASE_ANON_KEY: z.string().min(1),

  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  SUPABASE_STORAGE_BUCKET: z
    .string()
    .min(1)
    .default("csv"),

  DATABASE_URL: z.string().optional(),

  DATABASE_REQUIRED: booleanFromEnv,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid backend environment variables:");

  parsed.error.issues.forEach((issue) => {
    console.error(
      `- ${issue.path.join(".")}: ${issue.message}`
    );
  });

  process.exit(1);
}

export const env = parsed.data;