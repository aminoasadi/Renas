import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { AppConfig } from "../../config/config.service";

/**
 * Guards endpoints that only the Next.js web app's SERVER should ever call
 * (draft-content fetches during preview) — never the browser directly.
 * Authenticated with a shared secret header rather than the CMS session
 * cookie, because the caller here is a server-to-server request with no
 * user session of its own.
 */
@Injectable()
export class InternalSecretGuard implements CanActivate {
  constructor(private readonly config: AppConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers["x-preview-secret"];
    if (!provided || provided !== this.config.previewSecret) {
      throw new UnauthorizedException("Invalid internal secret");
    }
    return true;
  }
}
