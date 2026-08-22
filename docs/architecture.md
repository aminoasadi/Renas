# Architecture

## System overview

```
                         ┌─────────────────────┐
   Visitor  ────────────▶│   apps/web (Next.js) │
                         │   renasxgroup.com    │
                         └──────────┬───────────┘
                                    │ public content API (published only)
                                    ▼
                         ┌──────────────────────┐        ┌──────────────────┐
   CMS Admin ───────────▶│  apps/api (NestJS)   │───────▶│   PostgreSQL     │
   admin.renasxgroup.com │  api.renasxgroup.com │        │   (Prisma)       │
                         └──────┬───────┬───────┘        └──────────────────┘
                                │       │
                    ┌───────────┘       └───────────┐
                    ▼                                ▼
          ┌──────────────────┐              ┌──────────────────┐
          │ S3-compatible     │              │  SMTP            │
          │ object storage    │              │  (OTP / RFQ /    │
          │ (MinIO locally)   │              │   contact email) │
          └──────────────────┘              └──────────────────┘
```

## Publish flow (the platform's most important behavior)

```
CMS Admin edits a page
        │
        ▼
PageSection rows updated (DRAFT — live, editable, never public)
        │
        ├── "Preview Draft" ──▶ signed preview token ──▶ apps/web /api/preview
        │                        (HMAC, @renas/shared)     enables Next.js Draft Mode
        │                                                   renders draft via /api/v1/internal/*
        │
        └── "Publish Changes"
                │
                ▼
        API commits: publishedSnapshot (immutable JSON) + ContentRevision row + status=PUBLISHED
                │
                ▼
        API calls apps/web's /api/revalidate (shared secret header)
                │
                ▼
        Next.js revalidateTag("page:<slug>", "navigation", ...)
                │
                ▼
        Public site serves the new content on the next request — no rebuild, no redeploy, no restart
```

See `docs/cms.md` for the draft/publish/revision data model in detail and `docs/security.md` for why the preview and revalidation endpoints are each guarded the way they are.

## Why a modular monolith, not microservices

One NestJS application (`apps/api`) hosts every backend module (auth, pages, blog, media, RFQ, contact, settings, navigation, redirects, audit). Each concern is its own Nest module with its own service/controller — internally decoupled — but they share one process, one database connection pool, and one deployment unit. This is deliberate: at this scale, splitting into separate services would add network calls, deployment coordination, and operational surface area (service discovery, distributed tracing, inter-service auth) without a real scaling problem to justify it. The module boundaries inside the monolith are exactly where you'd cut it into services later if a specific module's load genuinely outgrew the rest — nothing here forecloses that.

Likewise: no Kafka/RabbitMQ (nothing here needs async fan-out beyond "send an email, don't block the request" — see `EmailService`'s persist-then-notify pattern), no GraphQL (the section-registry content model is naturally REST-shaped: fetch a page, get its sections), no Redis cluster (Next.js's own tag-based cache plus Postgres cover current caching needs), no Elasticsearch (Postgres full-text search is the stated starting point for both admin and public search, with an abstraction boundary so it could be swapped later without an API rewrite).

## Data architecture

Every entity in `packages/database/prisma/schema.prisma` is documented inline with the reasoning behind non-obvious modeling choices — the draft/publish/snapshot/revision split for Page and BlogPost, `Role` as an enum rather than a table, `SeoMetadata` as a shared 1:1 table rather than duplicated columns. See `docs/content-model.md` for the CMS-facing view of this (what an editor sees) and the schema file itself for the database-facing view (what's actually stored).

## Monorepo layout

```
renas-platform/
├── apps/
│   ├── web/       Next.js — public site (App Router, Server Components)
│   ├── admin/     Next.js — CMS admin UI
│   └── api/       NestJS — the only source of truth for business logic
├── packages/
│   ├── database/  Prisma schema, migrations, seed, generated client
│   ├── shared/    Section registry types, API envelope, preview-token crypto, revalidation tag names
│   ├── validation/ Zod schemas — the SAME schemas the API validates against and the frontends can import
│   ├── api-client/ (reserved for a generated typed client if/when the OpenAPI spec is used to codegen one)
│   └── config/    Environment variable schema + fail-fast validation
├── infra/
│   ├── nginx/     Example production reverse-proxy config
│   └── scripts/   db-backup.sh / db-restore.sh
└── docs/          This directory
```

Frontend code never re-implements backend logic: `apps/web` and `apps/admin` call the API for everything and reuse `@renas/validation`'s Zod schemas for client-side form validation feedback, but the API is what actually enforces every rule server-side (see `docs/security.md`'s note on never trusting frontend validation alone).
