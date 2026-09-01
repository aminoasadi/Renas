import { z } from "zod";

/**
 * `z.coerce.boolean()` is a footgun for env vars: it coerces via `Boolean(x)`,
 * so the STRING "false" (truthy, being non-empty) becomes `true`. This
 * preprocessor treats the literal strings "false"/"0"/"" as false and
 * everything else as boolean-coerced, which matches how a human actually
 * expects `SOME_FLAG=false` in a .env file to behave.
 */
const booleanFromEnv = (defaultValue: boolean) =>
  z.preprocess((val) => {
    if (typeof val === "string") return !["false", "0", ""].includes(val.toLowerCase());
    return val;
  }, z.boolean().default(defaultValue));

/**
 * Every environment variable the platform depends on, validated eagerly at
 * process startup. A missing or malformed value throws immediately instead
 * of surfacing as a confusing runtime error three requests later — "fail
 * fast" per the project's configuration requirements.
 */
export const envSchema = z.object({
  APP_ENV: z.enum(["development", "test", "production"]).default("development"),

  WEB_URL: z.string().url(),
  ADMIN_URL: z.string().url(),
  API_URL: z.string().url(),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 characters"),
  SESSION_COOKIE_NAME: z.string().default("renas_session"),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(12),

  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_PUBLIC_URL: z.string().url(),
  S3_FORCE_PATH_STYLE: booleanFromEnv(true),

  TURNSTILE_SECRET_KEY: z.string().optional().default(""),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional().default(""),

  NEXT_PUBLIC_GA_ID: z.string().optional().default(""),
  NEXT_PUBLIC_CLARITY_ID: z.string().optional().default(""),

  SEED_ADMIN_EMAIL: z.string().email(),

  PREVIEW_SECRET: z.string().min(16),
  REVALIDATE_SECRET: z.string().min(16),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Throws with a readable, aggregated message (every missing/invalid var at
 * once, not one-at-a-time) if the environment is incomplete.
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}
