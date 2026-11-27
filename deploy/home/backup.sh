#!/usr/bin/env bash
# Run on the Linux host, not inside the RED ION container.
set -euo pipefail
cd "$(dirname "$0")"
: "${REDION_DATA_DIR:?Export the private data directory}"
: "${REDION_BACKUP_DIR:?Export a separate existing backup directory}"
: "${REDION_BACKUP_KEY_PATH:?Export the private 32-byte backup key file}"
[[ -d "$REDION_DATA_DIR" && -d "$REDION_BACKUP_DIR" && -f "$REDION_BACKUP_KEY_PATH" ]]
data_real=$(realpath -e -- "$REDION_DATA_DIR")
backup_real=$(realpath -e -- "$REDION_BACKUP_DIR")
key_real=$(realpath -e -- "$REDION_BACKUP_KEY_PATH")
case "$backup_real/" in "$data_real/"*) echo "Backup must not be inside the live data directory." >&2; exit 1;; esac
case "$data_real/" in "$backup_real/"*) echo "Live data must not be inside the backup directory." >&2; exit 1;; esac
case "$key_real" in "$data_real/"*|"$backup_real/"*) echo "Keep the backup key outside data and backup directories." >&2; exit 1;; esac
export REDION_DATA_DIR="$data_real" REDION_BACKUP_DIR="$backup_real" REDION_BACKUP_KEY_PATH="$key_real"
# Serialise maintenance scripts on the host. Do not run manual writers during this operation.
exec 9<"$REDION_DATA_DIR"
flock -n 9
compose=(docker compose -f compose.yaml)
if [[ "${REDION_USE_VAULT:-0}" == 1 ]]; then compose+=(-f compose.vault.yaml); fi
running=$("${compose[@]}" ps -q --status running redion)
resume(){ if [[ -n "$running" ]]; then "${compose[@]}" start redion; fi; }
trap resume EXIT
"${compose[@]}" stop redion
stamp=$(date -u +%Y%m%dT%H%M%SZ)-$(openssl rand -hex 4)
"${compose[@]}" run --rm --no-deps -v "$REDION_BACKUP_DIR:/backup" -v "$REDION_BACKUP_KEY_PATH:/run/red-backup-key:ro" redion node server/home/backup.ts create /data "/backup/$stamp" /run/red-backup-key --offline-confirmed
