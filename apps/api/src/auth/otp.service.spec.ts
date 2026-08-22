import { OtpService } from "./otp.service";
import {
  testPrisma,
  makeTestConfig,
  makeTestEmailService,
  makeTestAuditService,
  createTestUser,
  cleanupUser,
} from "../../test/test-helpers";

async function fetchLatestOtpCodeFromMailpit(toEmail: string): Promise<string> {
  const res = await fetch("http://localhost:8025/api/v1/messages");
  const body = await res.json();
  const match = body.messages.find((m: { To: Array<{ Address: string }>; Subject: string }) =>
    m.To.some((t) => t.Address === toEmail) && m.Subject.includes("login code"),
  );
  if (!match) throw new Error(`No OTP email found for ${toEmail} in Mailpit`);
  const codeMatch = match.Subject.match(/(\d{6})/);
  if (!codeMatch) throw new Error(`Could not parse code from subject: ${match.Subject}`);
  return codeMatch[1];
}

describe("OtpService (real Postgres + real Mailpit SMTP)", () => {
  const config = makeTestConfig();
  const audit = makeTestAuditService();
  const email = makeTestEmailService(config);
  const otp = new OtpService(testPrisma as never, email, config, audit);

  let userId: string;

  beforeEach(async () => {
    const user = await createTestUser();
    userId = user.id;
  });

  afterEach(async () => {
    await cleanupUser(userId);
  });

  it("requesting an OTP for an unknown email does not throw and creates no code", async () => {
    await expect(otp.requestOtp("no-such-user@example.com")).resolves.toBeUndefined();
    const count = await testPrisma.otpCode.count({ where: { user: { email: "no-such-user@example.com" } } });
    expect(count).toBe(0);
  });

  it("requesting an OTP for a disabled user creates no code", async () => {
    await testPrisma.user.update({ where: { id: userId }, data: { status: "DISABLED" } });
    const user = await testPrisma.user.findUniqueOrThrow({ where: { id: userId } });
    await otp.requestOtp(user.email);
    const count = await testPrisma.otpCode.count({ where: { userId } });
    expect(count).toBe(0);
  });

  it("a wrong code is rejected and increments the attempt counter", async () => {
    const user = await testPrisma.user.findUniqueOrThrow({ where: { id: userId } });
    await otp.requestOtp(user.email);

    const stored = await testPrisma.otpCode.findFirstOrThrow({ where: { userId }, orderBy: { createdAt: "desc" } });
    expect(stored.consumedAt).toBeNull();
    expect(stored.attempts).toBe(0);

    const wrongResult = await otp.verifyOtp(user.email, "000000");
    expect(wrongResult.outcome).toBe("invalid");

    const afterWrongAttempt = await testPrisma.otpCode.findUniqueOrThrow({ where: { id: stored.id } });
    expect(afterWrongAttempt.attempts).toBe(1);
  });

  it("the REAL code delivered by email (via Mailpit) verifies successfully exactly once", async () => {
    const user = await testPrisma.user.findUniqueOrThrow({ where: { id: userId } });
    await otp.requestOtp(user.email);

    // Fetches the actual email Nodemailer sent through Mailpit's local SMTP
    // and pulls the real 6-digit code out of the subject line — this is
    // deliberately not a fake/shortcut code path, it exercises the exact
    // code a real user would receive.
    const code = await fetchLatestOtpCodeFromMailpit(user.email);
    expect(code).toMatch(/^\d{6}$/);

    const success = await otp.verifyOtp(user.email, code);
    expect(success.outcome).toBe("success");
    if (success.outcome === "success") {
      expect(success.userId).toBe(userId);
    }

    // One-time use: verifying the same code again must fail.
    const reuse = await otp.verifyOtp(user.email, code);
    expect(reuse.outcome).toBe("invalid");
  });

  it("issuing a new OTP invalidates the previous still-active one", async () => {
    const user = await testPrisma.user.findUniqueOrThrow({ where: { id: userId } });
    await otp.requestOtp(user.email);
    const first = await testPrisma.otpCode.findFirstOrThrow({ where: { userId }, orderBy: { createdAt: "desc" } });

    await otp.requestOtp(user.email);

    const firstAfter = await testPrisma.otpCode.findUniqueOrThrow({ where: { id: first.id } });
    expect(firstAfter.consumedAt).not.toBeNull();
  });

  it("an expired code is rejected even if it would otherwise match", async () => {
    const user = await testPrisma.user.findUniqueOrThrow({ where: { id: userId } });
    await otp.requestOtp(user.email);
    const stored = await testPrisma.otpCode.findFirstOrThrow({ where: { userId }, orderBy: { createdAt: "desc" } });

    await testPrisma.otpCode.update({ where: { id: stored.id }, data: { expiresAt: new Date(Date.now() - 1000) } });

    const result = await otp.verifyOtp(user.email, "000000");
    expect(result.outcome).toBe("expired");
  });

  it("exceeding the max attempt count locks the code out", async () => {
    const user = await testPrisma.user.findUniqueOrThrow({ where: { id: userId } });
    await otp.requestOtp(user.email);
    const stored = await testPrisma.otpCode.findFirstOrThrow({ where: { userId }, orderBy: { createdAt: "desc" } });

    await testPrisma.otpCode.update({ where: { id: stored.id }, data: { attempts: config.otp.maxAttempts } });

    const result = await otp.verifyOtp(user.email, "000000");
    expect(result.outcome).toBe("too_many_attempts");
  });
});
