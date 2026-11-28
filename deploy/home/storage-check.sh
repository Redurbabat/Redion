#!/usr/bin/env bash
# Read-only Linux host preflight. No mounting, formatting, chmod or key access.
set -euo pipefail
path="${1:-}"
[[ ( $# -eq 1 || $# -eq 3 ) && -n "$path" && -d "$path" ]] || { echo "Usage: storage-check.sh EXISTING_DATA_DIRECTORY [EXPECTED_MOUNTPOINT EXPECTED_FILESYSTEM_UUID]" >&2; exit 2; }
for cmd in findmnt lsblk realpath node; do command -v "$cmd" >/dev/null || { echo "Missing $cmd; encryption cannot be verified." >&2; exit 2; }; done
root=$(realpath -e -- "$path")
expected_check(){
  local mount_json
  mount_json=$(findmnt --json --list -o TARGET,UUID,FSROOT,FSTYPE,MAJ:MIN --target "$root")
  node "$(dirname "$0")/storage-check.mts" expected "$root" "$mount_json" "$2" "$3"
}
if [[ $# -eq 3 ]]; then expected_check "$@"; fi
# Resolve mount by kernel major/minor rather than potentially ambiguous names.
dev=$(findmnt -n -o MAJ:MIN --target "$root")
[[ "$dev" =~ ^[0-9]+:[0-9]+$ ]] || { echo "Mount device is unknown; encryption not verified." >&2; exit 2; }
# Inverse dependency tree: every branch to a physical device must pass
# through a dm-crypt node. Multi-device and unsupported filesystems fail closed.
fs=$(findmnt -n -o FSTYPE --target "$root")
case "$fs" in ext4|xfs) ;; *) echo "Unsupported filesystem ($fs); encryption not verified." >&2; exit 2;; esac
# Reject a nested mount hiding part of the actual data. Only direct children
# of the directory are considered; device tree check is for its mount.
mounts=$(findmnt --json --list -o TARGET)
node "$(dirname "$0")/storage-check.mts" nested "$root" "$mounts"
tree=$(lsblk --json --inverse --tree --output NAME,TYPE,MAJ:MIN)
node "$(dirname "$0")/storage-check.mts" device "$dev" "$tree"
if [[ $# -eq 3 ]]; then
  expected_check "$@"
  [[ "$(findmnt -n -o MAJ:MIN --target "$root")" == "$dev" ]] || { echo "Mount changed during preflight." >&2; exit 2; }
  echo "Expected filesystem UUID and mountpoint matched before and after encryption check."
else
  echo "No expected SSD identity supplied; this is an encryption-only check."
fi
echo "dm-crypt dependency check passed for the data directory's current mount."
echo "This does NOT prove LUKS key strength, key separation, backup encryption, swap encryption or absence of alternate plaintext copies."
