import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import { AppConfig } from "../../config/config.service";
import { hashToken } from "../utils/crypto.util";

/**
 * Validates the session cookie against the database on every request
 * (rather than trusting a signed-but-unverified token) so that revoking a
 * session or disabling a user takes effect immediately, not just after the
 * token would otherwise have expired.
 */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.[this.config.sessionCookieName];

    if (!token) {
      throw new UnauthorizedException("No active session");
    }

    const tokenHash = hashToken(token);
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException("Session expired or invalid");
    }

    if (session.user.status !== "ACTIVE") {
      throw new UnauthorizedException("Account disabled");
    }

    (request as Request & { user: typeof session.user; sessionId: string }).user = session.user;
    (request as Request & { user: typeof session.user; sessionId: string }).sessionId = session.id;
    return true;
  }
}
