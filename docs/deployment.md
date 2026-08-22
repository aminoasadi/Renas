# Deployment

## 1. DNS

Point three subdomains at your infrastructure (all to the same reverse proxy in the simplest topology):

```
renasxgroup.com         A/AAAA  → your server/load balancer
admin.renasxgroup.com   A/AAAA  → same
api.renasxgroup.com     A/AAAA  → same
```

## 2. Environment variables

Copy `.env.example` to a production `.env` (or your platform's secret manager) and fill in real values for every variable — see that file for the full list and `packages/config/src/env.ts` for validation rules. The process refuses to start if anything required is missing, so a misconfiguration is caught immediately rather than surfacing as a mysterious 500 later.

## 3. PostgreSQL

Either run the `postgres` service in `docker-compose.prod.example.yml`, or point `DATABASE_URL` at a managed instance (RDS, Cloud SQL, Neon, etc.) and remove that service. Either way, `DATABASE_URL` must be reachable from wherever `apps/api` runs.

## 4. S3-compatible object storage

Provision a bucket on AWS S3, Cloudflare R2, ArvanCloud, or any S3-compatible provider. Set `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL`, `S3_FORCE_PATH_STYLE` accordingly (`S3_FORCE_PATH_STYLE=true` for R2/ArvanCloud/MinIO-style endpoints, `false` for AWS S3 with virtual-hosted-style URLs). The bucket should allow public read on the objects the app uploads (or front it with a CDN) since `publicUrl` is served directly to visitors.

## 5. SMTP

Point `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASSWORD`/`SMTP_FROM` at a real transactional email provider (SES, Postmark, SendGrid, etc.). `NOTIFICATIONS_TEAM_EMAIL` is where RFQ and contact notifications land internally.

## 6. Migrations

```bash
pnpm db:migrate:deploy
```

This runs `prisma migrate deploy` — applies committed migrations without generating new ones and without the interactive prompts `migrate dev` has. **Never use `prisma db push` as the production migration mechanism** — it can silently apply schema changes without a reviewable migration file.

## 7. Seed / admin bootstrap

```bash
SEED_ADMIN_EMAIL=you@yourcompany.com pnpm db:seed
```

Creates the first SUPER_ADMIN (idempotent — safe to re-run), default site settings, header/footer navigation, and a Home page. Change `SEED_ADMIN_EMAIL` to a real, monitored inbox before running this in production — that's the only account that can create every other account.

## 8. Build

```bash
pnpm build
```

Builds every workspace package and app via Turborepo, in dependency order. For containerized deployment, the multi-stage Dockerfiles (`apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/admin/Dockerfile`) do this inside the image build — see `docker-compose.prod.example.yml`.

## 9. Container startup

```bash
cp docker-compose.prod.example.yml docker-compose.prod.yml
# edit build args / env_file references as needed
docker compose -f docker-compose.prod.yml up -d --build
```

## 10. Nginx

Copy `infra/nginx/renas.conf`, fill in your real TLS certificate paths, and reload nginx. See that file's comments for what each server block expects.

## 11. HTTPS

This project does not generate or bundle certificates. Provision real ones via Let's Encrypt/certbot (or your platform's managed TLS) for all three subdomains before serving production traffic — the nginx config assumes certificates already exist at the paths it references.

## 12. Health verification

```bash
curl https://api.renasxgroup.com/api/v1/health
curl https://api.renasxgroup.com/api/v1/ready   # round-trips Postgres
curl -I https://renasxgroup.com
curl -I https://admin.renasxgroup.com
```

## 13. Post-deploy CMS test

Log into `admin.renasxgroup.com` with the seeded SUPER_ADMIN email, confirm the OTP email arrives, edit the Home page, save a draft, preview it, publish, and confirm the public site updates — this is the single test that proves the whole publish pipeline (API → Postgres → revalidation → Next.js cache) is wired correctly end-to-end in the real environment, not just locally.
