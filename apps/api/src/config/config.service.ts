import { Injectable } from "@nestjs/common";
import { validateEnv, type Env } from "@renas/config";

/**
 * Thin typed wrapper around the validated environment. Validation itself
 * (and the "fail fast on startup" behavior) lives in `@renas/config`, which
 * is shared with any other Node process that needs the same guarantees.
 */
@Injectable()
export class AppConfig {
  private readonly env: Env;

  constructor() {
    this.env = validateEnv(process.env);
  }

  get appEnv() {
    return this.env.APP_ENV;
  }
  get webUrl() {
    return this.env.WEB_URL;
  }
  get adminUrl() {
    return this.env.ADMIN_URL;
  }
  get apiUrl() {
    return this.env.API_URL;
  }
  get databaseUrl() {
    return this.env.DATABASE_URL;
  }
  get sessionSecret() {
    return this.env.SESSION_SECRET;
  }
  get sessionCookieName() {
    return this.env.SESSION_COOKIE_NAME;
  }
  get sessionTtlHours() {
    return this.env.SESSION_TTL_HOURS;
  }
  get s3() {
    return {
      endpoint: this.env.S3_ENDPOINT,
      region: this.env.S3_REGION,
      bucket: this.env.S3_BUCKET,
      accessKeyId: this.env.S3_ACCESS_KEY_ID,
      secretAccessKey: this.env.S3_SECRET_ACCESS_KEY,
      publicUrl: this.env.S3_PUBLIC_URL,
      forcePathStyle: this.env.S3_FORCE_PATH_STYLE,
    };
  }
  get turnstileSecretKey() {
    return this.env.TURNSTILE_SECRET_KEY;
  }
  get seedAdminEmail() {
    return this.env.SEED_ADMIN_EMAIL;
  }
  get previewSecret() {
    return this.env.PREVIEW_SECRET;
  }
  get revalidateSecret() {
    return this.env.REVALIDATE_SECRET;
  }
}
