#!/bin/bash
# Backup-Script für Essen-Wissen Kalender
# Erstellt ein vollständiges Datenbank-Backup

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/essen_wissen_$TIMESTAMP.sql"

# Verzeichnis erstellen falls nicht vorhanden
mkdir -p "$BACKUP_DIR"

echo "🔄 Backup wird erstellt..."
docker exec essen-wissen-kalender-postgres-1 pg_dump \
  -U essen_wissen_admin \
  -d essen_wissen \
  --no-password \
  > "$BACKUP_FILE"

# Gzip komprimieren
gzip "$BACKUP_FILE"
BACKUP_FILE="$BACKUP_FILE.gz"

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ Backup erfolgreich erstellt: $BACKUP_FILE ($SIZE)"

# Alte Backups löschen (älter als 7 Tage)
echo "🧹 Alte Backups werden gelöscht (älter als 7 Tage)..."
find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete

echo "✨ Fertig!"
