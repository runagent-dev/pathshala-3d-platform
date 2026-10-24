#!/bin/sh
# Backs up what is not in git (studio accounts, sessions, jobs, original uploads, official releases) and a bundle of
# the git history (in case the remote is lost). Keeps 14 days locally; set BACKUP_RCLONE_REMOTE (e.g. "b2:bucket/
# pathshala") in /etc/pathshala/backup.env to also copy each backup off the machine with rclone.
set -eu
DATA="${PATHSHALA_DATA_DIR:-/srv/pathshala/data}"
EXPORTS="${PATHSHALA_EXPORTS_DIR:-/srv/pathshala/exports}"
REPO="${PATHSHALA_REPO:-/srv/pathshala/repo}"
OUT="${BACKUP_DIR:-/srv/pathshala/backups}"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
mkdir -p "$OUT"
cd "$REPO"
git bundle create "$OUT/repo-$STAMP.bundle" --all
# official releases only (previews are rebuilt from git)
tar -czf "$OUT/state-$STAMP.tar.gz" -C / "${DATA#/}" $(find "$EXPORTS" -mindepth 1 -maxdepth 1 ! -name _preview -printf "${EXPORTS#/}/%f " 2>/dev/null)
find "$OUT" -name 'repo-*.bundle' -mtime +14 -delete
find "$OUT" -name 'state-*.tar.gz' -mtime +14 -delete
if [ -n "${BACKUP_RCLONE_REMOTE:-}" ]; then
  rclone copy "$OUT/repo-$STAMP.bundle" "$BACKUP_RCLONE_REMOTE/"
  rclone copy "$OUT/state-$STAMP.tar.gz" "$BACKUP_RCLONE_REMOTE/"
fi
echo "backup $STAMP done: $(du -sh "$OUT" | cut -f1) in $OUT"
