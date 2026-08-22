import { PrismaClient } from "@renas/database";
import { AppConfig } from "../src/config/config.service";
import { EmailService } from "../src/email/email.service";
import { AuditService } from "../src/audit/audit.service";

export const testPrisma = new PrismaClient();

export function makeTestConfig(): AppConfig {
  // AppConfig's constructor reads process.env directly via @renas/config's
  // validateEnv — test/setup.ts loads the same .env dev uses, so this just
  // works without a separate test-only config object.
  return new AppConfig();
}

/** A real EmailService instance still sends through Mailpit in local dev — tests that need it to FAIL use `throwingEmailService` instead. */
export function makeTestEmailService(config: AppConfig): EmailService {
  return new EmailService(config);
}

export function makeThrowingEmailService(): EmailService {
  return { send: async () => { throw new Error("Simulated SMTP failure"); } } as unknown as EmailService;
}

export function makeTestAuditService(): AuditService {
  return new AuditService(testPrisma as never);
}

export async function createTestUser(overrides: Partial<{ email: string; name: string; role: "SUPER_ADMIN" | "EDITOR"; status: "ACTIVE" | "DISABLED" }> = {}) {
  return testPrisma.user.create({
    data: {
      email: overrides.email ?? `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      name: overrides.name ?? "Test User",
      role: overrides.role ?? "EDITOR",
      status: overrides.status ?? "ACTIVE",
    },
  });
}

export async function cleanupUser(userId: string) {
  await testPrisma.session.deleteMany({ where: { userId } });
  await testPrisma.otpCode.deleteMany({ where: { userId } });
  await testPrisma.auditLog.deleteMany({ where: { userId } });
  await testPrisma.user.delete({ where: { id: userId } }).catch(() => undefined);
}

export async function cleanupPage(pageId: string) {
  await testPrisma.contentRevision.deleteMany({ where: { entityType: "PAGE", entityId: pageId } });
  await testPrisma.pageSection.deleteMany({ where: { pageId } });
  await testPrisma.page.delete({ where: { id: pageId } }).catch(() => undefined);
}
