import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import * as argon2 from "argon2";
import { passwordLoginSchema } from "@renas/validation";
import { AuditAction } from "@renas/shared";
import { SessionService } from "./session.service";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { SessionAuthGuard } from "../common/guards/session-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { User } from "@renas/database";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly sessions: SessionService,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Username/password is the only CMS login mechanism. Heavily throttled:
   * unlike a one-time code, a password is a fixed, guessable secret.
   */
  @Post("login")
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const input = passwordLoginSchema.parse(body);
    const user = await this.prisma.user.findUnique({ where: { username: input.username } });

    if (!user || !user.passwordHash || user.status !== "ACTIVE") {
      // Same generic error whether the username doesn't exist or the
      // password is wrong — never reveal which one it was.
      throw new UnauthorizedException("Invalid username or password");
    }

    const valid = await argon2.verify(user.passwordHash, input.password);
    if (!valid) throw new UnauthorizedException("Invalid username or password");

    return this.establishSession(user.id, req, res);
  }

  @Post("logout")
  @HttpCode(200)
  @UseGuards(SessionAuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response, @CurrentUser() user: User) {
    const token = req.cookies?.[process.env.SESSION_COOKIE_NAME ?? "renas_session"];
    if (token) {
      await this.sessions.revokeByToken(token);
    }
    this.sessions.clearSessionCookie(res);
    await this.audit.record({ userId: user.id, action: AuditAction.LOGOUT, ipAddress: req.ip });
    return { success: true };
  }

  @Get("me")
  @UseGuards(SessionAuthGuard)
  async me(@CurrentUser() user: User) {
    return { user: toPublicUser(user) };
  }

  private async establishSession(userId: string, req: Request, res: Response) {
    const { token, expiresAt } = await this.sessions.createSession(userId, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });
    this.sessions.setSessionCookie(res, token, expiresAt);

    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
    await this.audit.record({
      userId,
      action: AuditAction.LOGIN,
      entityType: "User",
      entityId: userId,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return { user: toPublicUser(user) };
  }
}

function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
  };
}
