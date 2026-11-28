#!/usr/bin/env bash
# This tool never deploys a release or changes a live data volume.
set -euo pipefail
repo=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
remote=$(git -C "$repo" remote get-url origin)
case "$remote" in
  https://github.com/Redurbabat/Redion|https://github.com/Redurbabat/Redion.git|git@github.com:Redurbabat/Redion.git) ;;
  *) echo "Unexpected origin; review the repository configuration." >&2; exit 1;;
esac
remote_sha(){ git -C "$repo" ls-remote --exit-code origin refs/heads/main | cut -f1; }
case "${1:-check}" in
  check)
    current=$(git -C "$repo" rev-parse HEAD)
    latest=$(remote_sha)
    printf 'Local checkout: %s\nRemote main:    %s\n' "$current" "$latest"
    if [[ "$current" != "$latest" ]]; then echo "Different commits; review the release before staging."; else echo "Checkout is current."; fi
    ;;
  stage)
    sha="${2:-}"
    [[ "$sha" =~ ^[a-f0-9]{40}$ && "${3:-}" == --approve ]] || { echo "Usage: update.sh stage FULL_MAIN_SHA --approve" >&2; exit 1; }
    git -C "$repo" fetch --no-tags origin refs/heads/main
    latest=$(git -C "$repo" rev-parse FETCH_HEAD)
    [[ "$latest" == "$sha" ]] || { echo "main changed; inspect the new commit before approving." >&2; exit 1; }
    work=$(mktemp -d)
    cleanup(){ git -C "$repo" worktree remove --force "$work/source" >/dev/null 2>&1 || true; rm -rf -- "$work"; }
    trap cleanup EXIT
    git -C "$repo" worktree add --detach "$work/source" "$sha"
    image="redion-home:$sha"
    docker build --label "org.opencontainers.image.revision=$sha" -f "$work/source/deploy/home/Dockerfile" -t "$image" "$work/source"
    docker run --rm --network none --read-only --tmpfs /data:rw,nosuid,nodev,uid=1000,gid=1000,mode=0700 "$image" node --input-type=module -e '
      import {openHomeServer} from "./server/home-server.ts";
      const origin="https://staging.example.test";
      const s=await openHomeServer({dataDir:"/data",origin});
      try{
        if((await s.handle(new Request(origin+"/api/stand"))).status!==200)throw Error("Health check failed");
        if((await s.handle(new Request(origin+"/home/dashboard"))).status!==401)throw Error("Dashboard access check failed");
      }finally{s.close();}
    '
    printf 'Staged and smoke-tested: %s\nNo running service or data volume changed.\n' "$image"
    ;;
  *) echo "Usage: update.sh check | stage FULL_MAIN_SHA --approve" >&2; exit 1;;
esac
