#!/usr/bin/env bash
# cleanup-temp.sh — Remove stale temp files from PDF generation pipeline
#
# Usage:
#   ./scripts/cleanup-temp.sh              # default: delete files older than 24h
#   ./scripts/cleanup-temp.sh --max-age 6  # delete files older than 6 hours
#   ./scripts/cleanup-temp.sh --dry-run    # preview without deleting
#
# Recommended cron (daily at 3 AM):
#   0 3 * * * /path/to/Carbonac/scripts/cleanup-temp.sh >> /var/log/carbonac-cleanup.log 2>&1

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEMP_DIR="${PROJECT_ROOT}/output/temp"
MAX_AGE_HOURS=24
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --max-age)
      MAX_AGE_HOURS="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

if [[ ! -d "$TEMP_DIR" ]]; then
  echo "[cleanup] Temp directory does not exist: $TEMP_DIR"
  exit 0
fi

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "[cleanup] $TIMESTAMP — scanning $TEMP_DIR (max age: ${MAX_AGE_HOURS}h, dry-run: $DRY_RUN)"

# Count files before cleanup
BEFORE=$(find "$TEMP_DIR" -type f | wc -l)

if [[ "$DRY_RUN" == "true" ]]; then
  echo "[cleanup] Files that would be deleted:"
  find "$TEMP_DIR" -type f -mmin +$((MAX_AGE_HOURS * 60)) -print
  COUNT=$(find "$TEMP_DIR" -type f -mmin +$((MAX_AGE_HOURS * 60)) | wc -l)
  echo "[cleanup] Would delete $COUNT files (of $BEFORE total)"
else
  # Delete old files
  find "$TEMP_DIR" -type f -mmin +$((MAX_AGE_HOURS * 60)) -delete
  # Remove empty directories left behind
  find "$TEMP_DIR" -mindepth 1 -type d -empty -delete 2>/dev/null || true

  AFTER=$(find "$TEMP_DIR" -type f | wc -l)
  DELETED=$((BEFORE - AFTER))
  echo "[cleanup] Deleted $DELETED files ($AFTER remaining)"
fi
