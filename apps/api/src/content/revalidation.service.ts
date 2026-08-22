import { Injectable, Logger } from "@nestjs/common";
import { AppConfig } from "../config/config.service";

/**
 * The bridge between "CMS published something" and "the live website shows
 * it" — without a redeploy. This calls the Next.js web app's own
 * `/api/revalidate` route, which in turn calls Next's `revalidateTag()`.
 * If the web app is briefly unreachable, publishing still succeeds (the
 * database write already happened) — the tag just goes stale until the
 * next natural revalidation or a manual retry, which is preferable to
 * failing the whole publish action over a transient network blip.
 */
@Injectable()
export class RevalidationService {
  private readonly logger = new Logger(RevalidationService.name);

  constructor(private readonly config: AppConfig) {}

  async revalidateTags(tags: string[]): Promise<void> {
    try {
      const response = await fetch(`${this.config.webUrl}/api/revalidate`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-revalidate-secret": this.config.revalidateSecret,
        },
        body: JSON.stringify({ tags }),
      });
      if (!response.ok) {
        this.logger.warn(`Revalidation request returned ${response.status} for tags: ${tags.join(", ")}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to reach web app for revalidation (tags: ${tags.join(", ")}): ${(error as Error).message}`);
    }
  }
}
