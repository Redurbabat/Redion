#!/usr/bin/env bash
# CI-only fixture: verifies the real isolated rehearsal using two versions.
# No production data, no published ports, no persistent containers.
set -euo pipefail
old_sha=0e9b8506ccdfe6ceaf74f1bb38aeeb612e77ab34
new_sha=$(git rev-parse HEAD)
[[ "$new_sha" =~ ^[a-f0-9]{40}$ && "$old_sha" != "$new_sha" ]]
tmp=$(mktemp -d)
trap 'rm -rf -- "$tmp"' EXIT
mkdir -p "$tmp/old" "$tmp/live" "$tmp/rehearsal"
git archive "$old_sha" server deploy/home/Dockerfile | tar -x -C "$tmp/old"
old="redion-home:$old_sha"; new="redion-home:$new_sha"
docker build -f "$tmp/old/deploy/home/Dockerfile" --label "org.opencontainers.image.revision=$old_sha" -t "$old" "$tmp/old"
docker build -f deploy/home/Dockerfile --label "org.opencontainers.image.revision=$new_sha" -t "$new" .
umask 077
head -c 32 /dev/urandom > "$tmp/backup.key"
head -c 32 /dev/urandom > "$tmp/vault.key"
base=(docker run --rm --network none --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges --user "$(id -u):$(id -g)" -v "$tmp:/fixture")
"${base[@]}" "$old" node --input-type=module -e '
 import {openHomeServer} from "./server/home-server.ts";
 import {readFile} from "node:fs/promises";
 const s=await openHomeServer({dataDir:"/fixture/live",origin:"https://rehearsal.example.test",vaultKey:await readFile("/fixture/vault.key")});
 try{await s.store.ablage.setze("konten",{id:"fixture-owner",gesperrt:0});await s.blobs.lege("fixture",new TextEncoder().encode("synthetic backup data"));}
 finally{s.close();}
'
"${base[@]}" "$old" node server/home/backup.ts create /fixture/live /fixture/backup /fixture/backup.key --offline-confirmed
(cd "$tmp/live" && find . -type f -print0 | sort -z | xargs -0 sha256sum) > "$tmp/before"
export REDION_REHEARSAL_ROOT="$tmp/rehearsal" REDION_BACKUP_PATH="$tmp/backup" REDION_BACKUP_KEY_PATH="$tmp/backup.key" REDION_DATA_DIR="$tmp/live" REDION_VAULT_KEY_PATH="$tmp/vault.key"
bash deploy/home/rehearse-update.sh "$old" "$new" --approve-rehearsal
(cd "$tmp/live" && find . -type f -print0 | sort -z | xargs -0 sha256sum) > "$tmp/after"
cmp "$tmp/before" "$tmp/after"
[[ -z $(find "$tmp/rehearsal" -mindepth 1 -print -quit) ]]
echo 'Real Docker rehearsal passed; fixture live file hashes unchanged.'
