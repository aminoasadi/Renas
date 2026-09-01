import { randomBytes, createHash } from "crypto";

/** High-entropy opaque token for session cookies. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Session tokens are already 256 bits of randomness, so a fast SHA-256
 * digest is sufficient for at-rest storage — protecting against a database
 * leak revealing usable tokens, not against brute force (the token space is
 * far too large to brute force).
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
