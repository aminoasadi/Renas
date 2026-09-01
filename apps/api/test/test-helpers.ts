import { PrismaClient } from "@renas/database";
import * as argon2 from "argon2";
import { AppConfig } from "../src/config/config.service";
import { AuditService } from "../src/audit/audit.service";

export const testPrisma = new PrismaClient();

export function makeTestConfig(): AppConfig {
  // AppConfig's constructor reads process.env directly via @renas/config's
  // validateEnv — test/setup.ts loads the same .env dev uses, so this just
  // works without a separate test-only config object.
  return new AppConfig();
}

export function makeTestAuditService(): AuditService {
  return new AuditService(testPrisma as never);
}

export async function createTestUser(overrides: Partial<{ email: string; name: string; role: "SUPER_ADMIN" | "EDITOR"; status: "ACTIVE" | "DISABLED"; username: string; password: string }> = {}) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return testPrisma.user.create({
    data: {
      email: overrides.email ?? `test-${suffix}@example.com`,
      name: overrides.name ?? "Test User",
      role: overrides.role ?? "EDITOR",
      status: overrides.status ?? "ACTIVE",
      username: overrides.username ?? `test-${suffix}`,
      passwordHash: await argon2.hash(overrides.password ?? "test-password"),
    },
  });
}

export async function cleanupUser(userId: string) {
  await testPrisma.session.deleteMany({ where: { userId } });
  await testPrisma.auditLog.deleteMany({ where: { userId } });
  await testPrisma.user.delete({ where: { id: userId } }).catch(() => undefined);
}

export async function cleanupPage(pageId: string) {
  await testPrisma.contentRevision.deleteMany({ where: { entityType: "PAGE", entityId: pageId } });
  await testPrisma.pageSection.deleteMany({ where: { pageId } });
  await testPrisma.page.delete({ where: { id: pageId } }).catch(() => undefined);
}
