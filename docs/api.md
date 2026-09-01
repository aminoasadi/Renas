# API Reference

Full interactive documentation (Swagger/OpenAPI) is served at `${API_URL}/api/docs` in every non-production environment (disabled in production — see `main.ts`). This document is the human-readable map; the Swagger UI is the source of truth for exact request/response shapes.

All routes are versioned under `/api/v1`. Every response is either `{ "data": ..., "meta"?: ... }` or `{ "error": { "code", "message", "details"? } }` — see `packages/shared/src/api-envelope.ts`.

## Modules

| Module | Base path | Auth |
|---|---|---|
| Auth | `/auth` | `/auth/login` is public; `/auth/me`, `/auth/logout` require a session |
| Users | `/users` | SUPER_ADMIN |
| Pages | `/pages` | SUPER_ADMIN, EDITOR |
| Blog | `/blog`, `/categories`, `/tags`, `/authors` | SUPER_ADMIN, EDITOR |
| Media | `/media` | SUPER_ADMIN, EDITOR |
| Navigation | `/navigation` | SUPER_ADMIN, EDITOR (write) |
| Settings | `/settings` | SUPER_ADMIN (write), any session (read) |
| Redirects | `/redirects` | SUPER_ADMIN |
| Supply Requests | `/supply-requests` | SUPER_ADMIN, EDITOR |
| Contact Submissions | `/contact-submissions` | SUPER_ADMIN, EDITOR |
| Audit Logs / Dashboard | `/audit-logs`, `/dashboard` | SUPER_ADMIN (audit logs); both roles (dashboard) |
| Public content | `/public/*` | none — published content only |
| Internal | `/internal/*` | shared-secret header (`x-preview-secret`) — server-to-server only, used by the web app's preview rendering |

## Public endpoints (no auth, published content only)

```
GET  /public/pages/:slug
GET  /public/navigation/:key        (HEADER | FOOTER)
GET  /public/settings
GET  /public/blog?page=&perPage=&category=&tag=&search=
GET  /public/blog/:slug
GET  /public/sitemap                (published slugs, for the web app's sitemap.xml)
GET  /public/redirects/resolve?path=
POST /public/supply-requests
POST /public/supply-requests/attachment   (anonymous, rate-limited, real MIME validation)
POST /public/contact-submissions
```

## CMS-critical endpoints

```
POST /pages/:id/publish
POST /pages/:id/unpublish
GET  /pages/:id/preview-url
GET  /pages/:id/revisions
POST /pages/:id/revisions/:version/restore
POST /pages/:id/sections
PATCH /pages/:id/sections/:sectionId
DELETE /pages/:id/sections/:sectionId
POST /pages/:id/sections/:sectionId/duplicate
POST /pages/:id/sections/reorder
```

(The `/blog/:id/*` equivalents mirror this exactly, plus `/blog/:id/archive` and `/blog/:id/duplicate`.)

## Health

```
GET /health   — liveness (always 200 once the process is up)
GET /ready    — readiness (round-trips a real query to Postgres)
```
