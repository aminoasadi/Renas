import { Injectable, UnauthorizedException } from "@nestjs/common";
import { signPreviewToken, verifyPreviewToken, type PreviewPayload } from "@renas/shared";
import { AppConfig } from "../config/config.service";

/**
 * Thin DI wrapper around the pure sign/verify functions in `@renas/shared`
 * — see that module for why the crypto lives there instead of here (so the
 * Next.js web app can verify without a round-trip to this API).
 */
@Injectable()
export class PreviewService {
  constructor(private readonly config: AppConfig) {}

  buildPreviewUrl(type: PreviewPayload["type"], slug: string): string {
    const token = signPreviewToken(this.config.previewSecret, type, slug);
    return `${this.config.webUrl}/api/preview?token=${encodeURIComponent(token)}`;
  }

  verifyToken(token: string): PreviewPayload {
    const payload = verifyPreviewToken(this.config.previewSecret, token);
    if (!payload) throw new UnauthorizedException("Invalid or expired preview token");
    return payload;
  }
}
