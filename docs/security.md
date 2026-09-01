# Security

This documents what's implemented and why, organized by the review checklist the project was built against.

**Cookies.** Session tokens live in an `HttpOnly`, `SameSite=Lax` cookie (`Secure` in production — see `SessionService.setSessionCookie`), never in `localStorage`. A raw 256-bit random token is stored client-side; only its SHA-256 hash is persisted server-side (`common/utils/crypto.util.ts`), so a database leak alone doesn't yield usable session tokens.

**CORS.** `main.ts` restricts `Access-Control-Allow-Origin` to exactly `WEB_URL` and `ADMIN_URL` from validated config — not a wildcard, not a regex.

**CSRF.** The session cookie is `SameSite=Lax`, which blocks cross-site POST/PUT/PATCH/DELETE from sending it. Combined with CORS restricting which origins can even read a response, this covers the standard CSRF threat model without a separate token scheme.

**Rate limiting.** Global default (`ThrottlerModule`, 60 req/min) plus tighter per-route limits on the sensitive endpoints: password login (5/min), RFQ submission (5/min), RFQ attachment upload (3/min), contact submission (5/min).

**Password login.** Username/password is the only CMS login mechanism (there is no email-based flow, so there's no SMTP/email dependency at all). Passwords are hashed with argon2 (never plaintext). Login returns an identical, generic "Invalid username or password" error whether the username doesn't exist or the password is wrong — see `auth/auth.controller.ts`. A SUPER_ADMIN can reset any user's password, which immediately revokes that user's active sessions.

**Session revocation.** Every authenticated request re-validates the session against the database (`SessionAuthGuard`) — not just a signed-but-unverified JWT. Disabling a user, or explicit logout, takes effect on the very next request, not after a token would otherwise expire. Verified live in this build: disabling a user mid-session immediately 401s their next request.

**RBAC.** Enforced in `RolesGuard` on the backend, not just hidden buttons in the admin UI — a request from a role that doesn't have access is rejected with 403 regardless of what the client sends. Verified live: an EDITOR session gets 403 on a SUPER_ADMIN-only route.

**Upload security.** MIME type is never trusted from the client `Content-Type` header — `media/file-signature.util.ts` inspects the actual file bytes (magic numbers) before accepting anything. Size is capped (15MB) at both the Multer layer and again explicitly in `MediaService.upload`. The anonymous RFQ-attachment upload path reuses this exact validation, just without requiring a session, and is rate-limited more tightly than any authenticated route.

**XSS / content sanitization.** The `rich_text` section type and the contact/RFQ forms never render raw, unsanitized HTML. `lib/sanitize.ts` allowlists a fixed tag/attribute set via `sanitize-html` for CMS rich text. Blog post bodies are TipTap structured JSON, rendered by `components/TipTapRenderer.tsx` as real React elements from a fixed node-type switch — there is no `dangerouslySetInnerHTML` in that code path at all, so there's no HTML string to inject into in the first place.

**Preview token security.** HMAC-SHA256 (`@renas/shared/preview-token.ts`), 10-minute expiry, verified with `crypto.timingSafeEqual` (not `===`, which leaks timing information on a byte-by-byte early-exit compare). The same shared secret is used to sign (API) and verify (web app), so a token from one process always verifies in the other with no network round-trip. A forged or expired token never enables Draft Mode.

**Revalidation secret.** `/api/revalidate` in `apps/web` checks a shared secret header (`REVALIDATE_SECRET`) before calling `revalidateTag` — an unauthenticated version of this route would let anyone force cache purges on demand, which is a (mild) DoS vector and an information probe. Only the API calls it, server-to-server, never a browser.

**Env secrets.** `packages/config/src/env.ts` validates every required variable at process startup and throws with an aggregated, readable error if anything is missing or malformed — a misconfigured deployment fails immediately and loudly instead of serving traffic with, e.g., a blank `SESSION_SECRET`. `.env` is gitignored; `.env.example` documents every variable with placeholder values only.

**Request size limits.** `client_max_body_size 20m` in the example nginx config; Multer's own `fileSize` limit backs this up at the application layer regardless of what's in front of it.

**HTTP security headers.** `helmet()` is applied globally in `main.ts`. The example nginx config adds `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and (on the admin subdomain specifically) `X-Robots-Tag: noindex, nofollow` — the CMS should never appear in search results.

**Error leakage.** `HttpExceptionFilter` returns a generic "Internal server error" message in production for unexpected exceptions; stack traces are logged server-side (Pino) but never sent in the response body. Development mode returns the real message to speed up debugging.

**Trust proxy.** In production, Express is configured with `trust proxy` so `req.ip` reflects the real client IP from nginx's `X-Forwarded-For` — without this, every rate-limit bucket and audit log entry behind a reverse proxy would collapse onto the proxy's own IP.

**Admin route exposure.** The admin app is a fully separate Next.js application on its own subdomain (`admin.renasxgroup.com`), not a route inside the public site — it never appears in the public site's navigation, sitemap, or bundle.

## Known gaps (honest, not fabricated)

- Turnstile integration is wired to accept a site key via env and render its widget when configured, but full server-side token verification against Cloudflare's siteverify endpoint has not been implemented — see the RFQ/contact controllers' anti-spam notes.
- CSP (`Content-Security-Policy`) is disabled outright in non-production via Helmet's config and left to Helmet's defaults in production; a hardened, allowlist-based CSP tailored to this app's actual script/style/image origins has not been hand-tuned.
- No automated dependency vulnerability scanning (e.g. `npm audit` / Dependabot / Snyk) is wired into CI yet.
