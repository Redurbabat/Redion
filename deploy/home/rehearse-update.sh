#!/usr/bin/env bash
# Test upgrade and pre-cutover rollback on TWO independent restored copies.
# Never mounts the live data directory, starts a public listener or deploys.
set -euo pipefail
: "${REDION_REHEARSAL_ROOT:?Use an existing private rehearsal directory on a suitable encrypted filesystem}"
: "${REDION_BACKUP_PATH:?Point to a completed encrypted backup}"
: "${REDION_BACKUP_KEY_PATH:?Point to the private backup key}"
: "${REDION_DATA_DIR:?Set the actual live data directory for separation checks}"
old="${1:-}"; new="${2:-}"
[[ "$old" =~ ^redion-home:[a-f0-9]{40}$ && "$new" =~ ^redion-home:[a-f0-9]{40}$ && "$old" != "$new" && "${3:-}" == --approve-rehearsal ]] || {
  echo "Usage: rehearse-update.sh OLD_IMAGE NEW_IMAGE --approve-rehearsal" >&2; exit 1;
}
root=$(realpath -e -- "$REDION_REHEARSAL_ROOT")
backup=$(realpath -e -- "$REDION_BACKUP_PATH")
key=$(realpath -e -- "$REDION_BACKUP_KEY_PATH")
live=$(realpath -e -- "$REDION_DATA_DIR")
[[ -d "$root" && -d "$backup" && -f "$key" ]]
for path in "$root" "$backup" "$key"; do
  case "$path/" in "$live/"*) echo "Rehearsal must be separate from live data." >&2; exit 1;; esac
done
case "$root/" in "$backup/"*) echo "Rehearsal must not be inside the backup." >&2; exit 1;; esac
case "$live/" in "$root/"*) echo "Choose a dedicated rehearsal root, not a parent of live data." >&2; exit 1;; esac
image_ids=()
for image in "$old" "$new"; do
  sha="${image#redion-home:}"
  image_id=$(docker image inspect --format '{{.Id}}' "$image")
  [[ "$image_id" =~ ^sha256:[a-f0-9]{64}$ && $(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$image_id") == "$sha" ]] || {
    echo "Image must be staged and revision-labelled first." >&2; exit 1;
  }
  image_ids+=("$image_id")
done
old_id="${image_ids[0]}"; new_id="${image_ids[1]}"
umask 077
work=$(mktemp -d "$root/redion-rehearsal.XXXXXXXX")
cleanup(){ rm -rf -- "$work"; }
trap cleanup EXIT
# Use the calling UID/GID so the restored files stay private to the operator.
base=(docker run --rm --network none --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges --user "$(id -u):$(id -g)")
mounts=(-v "$backup:/snapshot:ro" -v "$key:/run/backup-key:ro" -v "$work:/rehearsal")
vault_env=(); vault_mount=()
if [[ -n "${REDION_VAULT_KEY_PATH:-}" ]]; then
  vault=$(realpath -e -- "$REDION_VAULT_KEY_PATH")
  [[ -f "$vault" ]]
  case "$vault/" in "$live/"*|"$backup/"*) echo "Vault key must be kept separately." >&2; exit 1;; esac
  vault_mount=(-v "$vault:/run/vault-key:ro")
  vault_env=(-e REDION_VAULT_KEY_FILE=/run/vault-key)
fi
for slot in upgrade rollback; do
  "${base[@]}" "${mounts[@]}" "$new_id" node server/home/backup.ts restore /snapshot "/rehearsal/$slot" /run/backup-key --offline-confirmed
done
probe() {
  local image=$1 slot=$2
  "${base[@]}" "${vault_mount[@]}" "${vault_env[@]}" -v "$work/$slot:/data" "$image" node --input-type=module -e '
    import {openHomeServer} from "./server/home-server.ts";
    import {readFile} from "node:fs/promises";
    const origin="https://rehearsal.example.test";
    const key=process.env.REDION_VAULT_KEY_FILE?await readFile(process.env.REDION_VAULT_KEY_FILE):undefined;
    const s=await openHomeServer({dataDir:"/data",origin,...(key?{vaultKey:key}:{})});
    try{
      if((await s.handle(new Request(origin+"/api/stand"))).status!==200)throw Error("API check failed");
      if((await s.handle(new Request(origin+"/home/dashboard"))).status!==401)throw Error("Authentication check failed");
      const check=s.store.sqlite.prepare("PRAGMA quick_check").all();
      if(check.length!==1||check[0]?.quick_check!=="ok")throw Error("SQLite integrity failed");
    }finally{s.close();}
  '
}
probe "$new_id" upgrade
probe "$old_id" rollback
echo "Upgrade and PRE-CUTOVER rollback rehearsal passed; live service and original backup unchanged."
echo "This does not validate rollback after accepting new writes. Do not restore stale data over live data."
