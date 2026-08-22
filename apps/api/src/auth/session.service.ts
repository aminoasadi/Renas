import { Injectable } from "@nestjs/common";
import type { Response } from "express";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfig } from "../config/config.service";
import { generateSessionToken, hashToken } from "../common/utils/crypto.util";

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfig,
  ) {}

  async createSession(userId: string, meta: { userAgent?: string; ipAddress?: string }) {
    const token = generateSessionToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + this.config.sessionTtlHours * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
      },
    });

    return { token, expiresAt };
  }

  setSessionCookie(response: Response, token: string, expiresAt: Date): void {
    response.cookie(this.config.sessionCookieName, token, {
      httpOnly: true,
      secure: this.config.appEnv === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });
  }

  clearSessionCookie(response: Response): void {
    response.clearCookie(this.config.sessionCookieName, { path: "/" });
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllSessionsForUser(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeByToken(token: string): Promise<void> {
    const tokenHash = hashToken(token);
    await this.prisma.session.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }
}
