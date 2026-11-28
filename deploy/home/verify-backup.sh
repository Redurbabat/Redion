#!/usr/bin/env bash
# Read-only host verification. No service stop, restore, deletion or key export.
set -euo pipefail
umask 077
cd "$(dirname "$0")"
: "${REDION_BACKUP_DIR:?Export an existing backup directory}"
: "${REDION_BACKUP_KEY_PATH:?Export the private 32-byte backup key file}"
command -v node >/dev/null
backup=$(realpath -e -- "$REDION_BACKUP_DIR")
key=$(realpath -e -- "$REDION_BACKUP_KEY_PATH")
[[ -d "$backup" && -f "$key" ]]
case "$key" in "$backup"/*) echo "Keep the backup key outside the backup directory." >&2; exit 1;; esac
# Explicit age policy: exit 2 for an authenticated but stale backup.
export REDION_MAX_BACKUP_AGE_HOURS="${REDION_MAX_BACKUP_AGE_HOURS:-48}"
node ../../server/home/backup.ts verify-latest "$backup" "$key" --verify-only
