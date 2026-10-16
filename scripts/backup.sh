#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"
umask 077
mkdir -p backups
backup_file="$(mktemp "backups/postgres-$(date -u +%Y%m%dT%H%M%SZ)-XXXXXX.dump")"
if bash scripts/prod.sh exec -T postgres sh -ec 'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner --no-acl' > "$backup_file"; then
    printf '%s\n' "$backup_file"
else
    mv -- "$backup_file" "$backup_file.failed"
    printf '%s\n' 'Backup failed; incomplete file has .failed suffix.' >&2
    exit 1
fi
