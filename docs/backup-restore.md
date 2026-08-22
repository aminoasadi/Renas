# Backup and Restore

## Backup

```bash
set -a && source .env && set +a
pnpm db:backup
```

Writes a gzip-compressed `pg_dump` to `infra/backups/renas-<UTC timestamp>.sql.gz`. Run this on a schedule in production (a cron job or your hosting provider's managed-Postgres backup feature — see the retention note below) and additionally before any risky migration.

**Retention.** This project does not prescribe a retention policy or automate pruning of old backup files — decide based on your compliance/storage constraints and document it here once fixed. A reasonable starting point: keep daily backups for 30 days, weekly for a year.

## Restore

```bash
set -a && source .env && set +a
pnpm db:restore -- infra/backups/renas-20260101T000000Z.sql.gz
```

This is deliberately NOT automatic and NOT silent:

- The backup file path is a required argument — there is no "restore the latest" default.
- The script prints the target database name and requires you to re-type it to confirm before doing anything destructive.
- It never runs as part of any CI/CD pipeline or startup script.

Restoring drops and recreates every table currently in the target database with the backup's contents. Run it against a throwaway/staging database first if you're unsure the backup is the one you want.

## Managed Postgres alternative

If your production Postgres is a managed service (RDS, Cloud SQL, Neon, Supabase, etc.), prefer that provider's own point-in-time-recovery and snapshot tooling over these scripts — they're built for exactly this and typically don't require taking the database offline. Use `pnpm db:backup`/`db:restore` for local development, ad hoc exports, or self-hosted Postgres.
