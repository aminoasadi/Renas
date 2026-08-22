/**
 * Verifies a file's actual content against its claimed MIME type by
 * inspecting magic bytes, rather than trusting the `Content-Type` a client
 * sends (which is trivially spoofable) — see the platform's upload
 * security requirements.
 */
const SIGNATURES: Record<string, (buf: Buffer) => boolean> = {
  "image/jpeg": (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) =>
    b.length > 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a,
  "image/webp": (b) => b.length > 12 && b.slice(0, 4).toString("ascii") === "RIFF" && b.slice(8, 12).toString("ascii") === "WEBP",
  "image/gif": (b) => b.length > 6 && ["GIF87a", "GIF89a"].includes(b.slice(0, 6).toString("ascii")),
  "application/pdf": (b) => b.length > 4 && b.slice(0, 4).toString("ascii") === "%PDF",
};

export const ALLOWED_MIME_TYPES = Object.keys(SIGNATURES);

export function detectActualMimeType(buffer: Buffer): string | null {
  for (const [mime, check] of Object.entries(SIGNATURES)) {
    if (check(buffer)) return mime;
  }
  return null;
}
