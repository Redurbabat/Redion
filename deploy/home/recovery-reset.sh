#!/usr/bin/env bash
# Local operator only. Never stops or starts a service automatically.
set -euo pipefail
cd "$(dirname "$0")"
[[ "${1:-}" == --offline-confirmed-reset-all-access ]] || { echo 'Requires explicit confirmation of ALL access revocation and offline maintenance.' >&2; exit 2; }
: "${REDION_DATA_DIR:?Set the existing private data directory}"
[[ -d "$REDION_DATA_DIR" ]]
export REDION_DATA_DIR="$(realpath -e -- "$REDION_DATA_DIR")"
[[ -f "$REDION_DATA_DIR/redion.sqlite" ]] || { echo 'Existing database required.' >&2; exit 2; }
exec 9<"$REDION_DATA_DIR"
flock -n 9
compose=(docker compose -f compose.yaml)
if [[ "${REDION_USE_VAULT:-0}" == 1 ]]; then compose+=(-f compose.vault.yaml); fi
# Fail if the known compose service is active. Operator must independently
# stop any manual writers or other compose projects using this directory.
running=$("${compose[@]}" ps -q --status running redion)
[[ -z "$running" ]] || { echo 'Stop RED ION first and verify all writers are offline.' >&2; exit 2; }
"${compose[@]}" run --rm --no-deps redion node server/home-server.ts recovery-reset-access --offline-confirmed-reset-all-access
echo 'Access reset finished; server remains stopped. Re-pair devices after review.'
