import { randomBytes, randomInt, createHash } from "crypto";

/** High-entropy opaque token for session cookies. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Session tokens are already 256 bits of randomness, so a fast SHA-256
 * digest is sufficient for at-rest storage (we're protecting against a
 * database leak revealing usable tokens, not against brute force — the
 * token space is far too large to brute force). OTP codes are different:
 * they're a small numeric space, so those are hashed with argon2 instead
 * (see `otp.service.ts`), which is deliberately slow.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Cryptographically secure numeric OTP, zero-padded to `length` digits. */
export function generateNumericOtp(length: number): string {
  const max = 10 ** length;
  const value = randomInt(0, max);
  return value.toString().padStart(length, "0");
}
