# RENAS Platform

A production monorepo for RENAS Group: a public Next.js website, a custom Next.js CMS admin, and a NestJS API backed by PostgreSQL — with real draft/preview/publish workflow, a blog, RFQ and contact intake, media management on S3-compatible storage, and OTP-based CMS authentication.

See `docs/architecture.md` for the system diagram and design rationale, and `docs/cms.md` for how to actually use the CMS.

## Stack

- **apps/web** — Next.js 15 (App Router), the public site. Renders CMS-managed pages through a controlled section registry.
- **apps/admin** — Next.js 15, the CMS admin UI.
- **apps/api** — NestJS, the single source of truth for all business logic.
- **packages/database** — Prisma schema, migrations, seed.
- **packages/shared** — section registry types, API envelope, preview-token crypto, cache-tag names.
- **packages/validation** — Zod schemas shared by the API and both frontends.
- **packages/config** — environment variable schema with fail-fast startup validation.

## Local development

Requires Node 20+, pnpm 10+, and Docker.

```bash
git clone <this repo>
cd renas-platform
cp .env.example .env          # fill in real values only if deviating from the defaults below — they work as-is for local dev
pnpm install
docker compose up -d          # Postgres (port 5434), MinIO (9000/9001), Mailpit (1025/8025)
pnpm db:migrate                # applies migrations, prompts for a name on first schema change
pnpm db:seed                   # creates a SUPER_ADMIN, site settings, nav, and a Home page
pnpm dev                       # runs web (3000), admin (3001), api (3002) together
```

Open `http://localhost:3000` (public site), `http://localhost:3001` (CMS admin), `http://localhost:3002/api/docs` (Swagger). OTP codes sent during local login land in Mailpit at `http://localhost:8025` — no real email provider needed for development.

### Local ports

| Service | Port |
|---|---|
| Web | 3000 |
| Admin | 3001 |
| API | 3002 |
| Postgres | 5434 (not 5432 — see `docker-compose.yml`'s comment if you need to change this) |
| MinIO API / Console | 9000 / 9001 |
| Mailpit SMTP / Web UI | 1025 / 8025 |

## Environment variables

See `.env.example` for the full list with inline comments. All of them are validated at process startup by `@renas/config` — a missing or malformed required variable throws immediately with a readable list of what's wrong, rather than failing mysteriously later.

## Database commands

```bash
pnpm db:migrate          # prisma migrate dev — creates + applies a migration (development)
pnpm db:migrate:deploy   # prisma migrate deploy — applies existing migrations only (production)
pnpm db:seed             # idempotent seed data
pnpm db:studio           # Prisma Studio (visual DB browser)
pnpm db:generate         # regenerate the Prisma client after a schema change
pnpm db:backup           # pg_dump to infra/backups/ — see docs/backup-restore.md
pnpm db:restore -- <file># explicit, confirmation-gated restore — see docs/backup-restore.md
```

## Testing

```bash
pnpm lint
pnpm typecheck
pnpm test          # Jest (api) + Vitest (web/admin)
pnpm test:e2e      # Playwright — requires the full stack running (see apps/e2e/README.md)
```

## Production build

```bash
pnpm build
```

See `docs/deployment.md` for the full production rollout (DNS, S3, SMTP, migrations, Docker, nginx, HTTPS, post-deploy verification).

## Documentation index

- `docs/architecture.md` — system diagram, publish-flow sequence, why a modular monolith
- `docs/cms.md` — how to use the CMS as an editor
- `docs/content-model.md` — the section registry and draft/publish/revision data model
- `docs/api.md` — endpoint map (full detail in the live Swagger UI)
- `docs/security.md` — what's implemented and why, plus honestly-stated gaps
- `docs/deployment.md` — production rollout, step by step
- `docs/backup-restore.md` — backup/restore procedure and its safety gates
