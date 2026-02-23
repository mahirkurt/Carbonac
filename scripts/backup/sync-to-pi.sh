#!/bin/bash
# Thunderbolt SSD'den Pi'ye incremental rsync yedekleme
# Cron: 0 */6 * * * (her 6 saatte bir)

set -euo pipefail

SRC="/mnt/thunderbolt/workspaces/Carbonac/"
DEST="/mnt/pi-shared/backup/Carbonac/"
LOG_DIR="/mnt/thunderbolt/backup/logs"
LOG="$LOG_DIR/carbonac-sync-$(date +%Y%m%d-%H%M).log"

mkdir -p "$LOG_DIR"
mkdir -p "$DEST"

# NFS mount kontrolu
if ! mountpoint -q /mnt/pi-shared; then
  echo "[$(date)] ERROR: /mnt/pi-shared is not mounted" >> "$LOG"
  exit 1
fi

echo "[$(date)] Starting Carbonac backup sync" >> "$LOG"

rsync -avh --delete \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.env' \
  --exclude='.env.hp' \
  --exclude='.env.pi' \
  --exclude='temp/' \
  --exclude='output/*.pdf' \
  "$SRC" "$DEST" \
  >> "$LOG" 2>&1

echo "[$(date)] Backup sync completed successfully" >> "$LOG"

# 30 gunluk eski loglari temizle
find "$LOG_DIR" -name "carbonac-sync-*.log" -mtime +30 -delete 2>/dev/null || true
