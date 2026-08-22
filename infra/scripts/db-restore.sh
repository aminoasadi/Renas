#!/usr/bin/env bash
# Usage: pnpm db:restore -- infra/backups/renas-20260101T000000Z.sql.gz
#
# Deliberately requires the backup file path as an explicit argument —
# there is no "restore the latest backup" shortcut, and no default target.
# This will DROP AND RECREATE every table in the target database. It does
# not ask "are you sure" a second time beyond the confirmation prompt
# below; read the database name it prints carefully before confirming.
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set. Load your .env first: set -a && source .env && set +a" >&2
  exit 1
fi

FILE="${1:-}"
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo "Usage: pnpm db:restore -- <path-to-backup.sql.gz>" >&2
  exit 1
fi

DB_NAME=$(echo "$DATABASE_URL" | sed -E 's#.*/([^/?]+).*#\1#')
echo "This will OVERWRITE all data in database: $DB_NAME"
echo "Restoring from: $FILE"
read -r -p "Type the database name to confirm: " CONFIRM
if [ "$CONFIRM" != "$DB_NAME" ]; then
  echo "Confirmation did not match. Aborting." >&2
  exit 1
fi

gunzip -c "$FILE" | psql "$DATABASE_URL"
echo "Restore complete."
