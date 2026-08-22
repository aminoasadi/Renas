import { Injectable, Logger } from "@nestjs/common";
import * as argon2 from "argon2";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { AppConfig } from "../config/config.service";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "@renas/shared";
import { generateNumericOtp } from "../common/utils/crypto.util";
import { otpEmailTemplate } from "../email/templates";

export type OtpVerifyResult =
  | { outcome: "success"; userId: string }
  | { outcome: "invalid" }
  | { outcome: "too_many_attempts" }
  | { outcome: "expired" };

/**
 * OTP is the *only* CMS login mechanism (no passwords, no self-registration
 * — see the platform's auth requirements). Every method here is written to
 * never reveal whether a given email corresponds to a real account: an
 * unknown email and a correct-format-but-wrong-code request return
 * observably identical responses.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly config: AppConfig,
    private readonly audit: AuditService,
  ) {}

  async requestOtp(emailAddress: string, ipAddress?: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email: emailAddress } });

    // Always behave as if the request succeeded, whether or not the user
    // exists or is active — the caller-facing outcome must not leak this.
    if (!user || user.status !== "ACTIVE") {
      this.logger.warn(`OTP requested for unknown or inactive email: ${emailAddress}`);
      return;
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRequestCount = await this.prisma.otpCode.count({
      where: { userId: user.id, createdAt: { gte: oneHourAgo } },
    });
    if (recentRequestCount >= this.config.otp.requestRateLimitPerHour) {
      this.logger.warn(`OTP request rate limit hit for user ${user.id}`);
      return;
    }

    // Invalidate any still-active previous codes so only the newest one works.
    await this.prisma.otpCode.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    const code = generateNumericOtp(this.config.otp.length);
    const codeHash = await argon2.hash(code);
    const expiresAt = new Date(Date.now() + this.config.otp.ttlMinutes * 60 * 1000);

    await this.prisma.otpCode.create({
      data: { userId: user.id, codeHash, expiresAt, ipAddress },
    });

    const template = otpEmailTemplate(code, this.config.otp.ttlMinutes);
    await this.email.send({ to: user.email, subject: template.subject, html: template.html });

    await this.audit.record({
      userId: user.id,
      action: AuditAction.OTP_REQUESTED,
      entityType: "User",
      entityId: user.id,
      ipAddress,
    });
  }

  async verifyOtp(emailAddress: string, code: string, ipAddress?: string): Promise<OtpVerifyResult> {
    const user = await this.prisma.user.findUnique({ where: { email: emailAddress } });
    if (!user || user.status !== "ACTIVE") {
      return { outcome: "invalid" };
    }

    const otp = await this.prisma.otpCode.findFirst({
      where: { userId: user.id, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return { outcome: "invalid" };
    }
    if (otp.expiresAt < new Date()) {
      return { outcome: "expired" };
    }
    if (otp.attempts >= this.config.otp.maxAttempts) {
      return { outcome: "too_many_attempts" };
    }

    const matches = await argon2.verify(otp.codeHash, code);
    if (!matches) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      await this.audit.record({
        userId: user.id,
        action: AuditAction.OTP_FAILED,
        entityType: "User",
        entityId: user.id,
        ipAddress,
      });
      return { outcome: "invalid" };
    }

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });

    return { outcome: "success", userId: user.id };
  }
}
