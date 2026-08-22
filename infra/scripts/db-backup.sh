#!/usr/bin/env bash
# Usage: pnpm db:backup
# Writes a timestamped pg_dump to infra/backups/. Requires DATABASE_URL to
# be set (loaded from .env by the caller, or export it manually first).
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set. Load your .env first: set -a && source .env && set +a" >&2
  exit 1
fi

BACKUP_DIR="$(dirname "$0")/../backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
OUT_FILE="$BACKUP_DIR/renas-${TIMESTAMP}.sql.gz"

echo "Backing up database to $OUT_FILE ..."
pg_dump "$DATABASE_URL" --format=plain --no-owner --no-privileges | gzip > "$OUT_FILE"
echo "Done: $OUT_FILE ($(du -h "$OUT_FILE" | cut -f1))"
