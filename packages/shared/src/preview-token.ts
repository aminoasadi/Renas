import { createHmac, timingSafeEqual } from "crypto";

export interface PreviewPayload {
  type: "page" | "blog_post";
  slug: string;
  exp: number;
}

const PREVIEW_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes

function sign(secret: string, encoded: string): string {
  return createHmac("sha256", secret).update(encoded).digest("base64url");
}

/**
 * Pure HMAC-signed preview tokens with no database row to look up — both
 * the API (issuing) and the Next.js web app (verifying, in its
 * `/api/preview` route) import this same module so a token signed by one
 * process verifies identically in the other, with no network round-trip
 * needed to check it.
 */
export function signPreviewToken(secret: string, type: PreviewPayload["type"], slug: string): string {
  const payload: PreviewPayload = { type, slug, exp: Date.now() + PREVIEW_TOKEN_TTL_MS };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(secret, encoded)}`;
}

export function verifyPreviewToken(secret: string, token: string): PreviewPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(secret, encoded);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8")) as PreviewPayload;
  if (payload.exp < Date.now()) return null;
  return payload;
}
