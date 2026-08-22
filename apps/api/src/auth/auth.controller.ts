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
import { requestOtpSchema, verifyOtpSchema } from "@renas/validation";
import { AuditAction } from "@renas/shared";
import { OtpService } from "./otp.service";
import { SessionService } from "./session.service";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { SessionAuthGuard } from "../common/guards/session-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { User } from "@renas/database";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly otp: OtpService,
    private readonly sessions: SessionService,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  @Post("otp/request")
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async requestOtp(@Body() body: unknown, @Req() req: Request) {
    const input = requestOtpSchema.parse(body);
    await this.otp.requestOtp(input.email, req.ip);
    // Always the same generic response — see OtpService for why.
    return { message: "If that email is authorized, a login code has been sent." };
  }

  @Post("otp/verify")
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async verifyOtp(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const input = verifyOtpSchema.parse(body);
    const result = await this.otp.verifyOtp(input.email, input.code, req.ip);

    if (result.outcome !== "success") {
      const messages: Record<string, string> = {
        invalid: "Invalid or expired code",
        expired: "This code has expired, request a new one",
        too_many_attempts: "Too many attempts, request a new code",
      };
      throw new UnauthorizedException(messages[result.outcome]);
    }

    const { token, expiresAt } = await this.sessions.createSession(result.userId, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });
    this.sessions.setSessionCookie(res, token, expiresAt);

    await this.prisma.user.update({
      where: { id: result.userId },
      data: { lastLoginAt: new Date() },
    });
    await this.audit.record({
      userId: result.userId,
      action: AuditAction.LOGIN,
      entityType: "User",
      entityId: result.userId,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: result.userId } });
    return { user: toPublicUser(user) };
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
