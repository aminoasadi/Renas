import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { BlogService } from "./blog.service";

/**
 * Runs every minute and publishes any post whose `scheduledAt` has passed.
 * Idempotent by construction: the query only matches posts still in DRAFT,
 * and publishing immediately flips status to PUBLISHED, so a post can never
 * be double-published even if two ticks somehow overlapped.
 */
@Injectable()
export class BlogSchedulerService {
  private readonly logger = new Logger(BlogSchedulerService.name);

  constructor(private readonly blog: BlogService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledPublishing() {
    const count = await this.blog.publishDueScheduledPosts();
    if (count > 0) {
      this.logger.log(`Published ${count} scheduled blog post(s)`);
    }
  }
}
