#!/bin/bash
# Automated Daily Backup für Essen-Wissen Kalender
# Füge diesen Cron-Job hinzu: crontab -e
# 0 2 * * * /path/to/auto-backup.sh

BACKUP_SCRIPT="/path/to/backup.sh"
LOG_FILE="/var/log/essen-wissen-backup.log"

{
  echo "Backup started at $(date)"
  bash "$BACKUP_SCRIPT" 2>&1
  echo "Backup finished at $(date)"
} >> "$LOG_FILE" 2>&1
