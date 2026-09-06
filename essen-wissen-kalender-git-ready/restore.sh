#!/bin/bash
# Restore-Script für Essen-Wissen Kalender
# Stellt ein Datenbank-Backup wieder her

set -e

BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
  echo "❌ Fehler: Backup-Datei nicht angegeben"
  echo "Verwendung: ./restore.sh <backup-file.sql.gz>"
  echo ""
  echo "Verfügbare Backups:"
  ls -lh backups/*.gz 2>/dev/null || echo "Keine Backups gefunden"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Fehler: Datei nicht gefunden: $BACKUP_FILE"
  exit 1
fi

# Temporäre Datei zum Entpacken
TEMP_FILE=$(mktemp)

echo "🔄 Backup wird wiederhergestellt..."
echo "   Datei: $BACKUP_FILE"

# Entpacken (falls gzip)
if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
else
  cp "$BACKUP_FILE" "$TEMP_FILE"
fi

# DB löschen und neu erstellen
echo "⚠️  Datenbank wird zurückgesetzt..."
docker exec essen-wissen-kalender-postgres-1 psql \
  -U essen_wissen_admin \
  -d postgres \
  -c "DROP DATABASE IF EXISTS essen_wissen;" \
  --no-password

docker exec essen-wissen-kalender-postgres-1 psql \
  -U essen_wissen_admin \
  -d postgres \
  -c "CREATE DATABASE essen_wissen;" \
  --no-password

# Backup wiederherstellen
echo "📥 Daten werden wiederhergestellt..."
cat "$TEMP_FILE" | docker exec -i essen-wissen-kalender-postgres-1 psql \
  -U essen_wissen_admin \
  -d essen_wissen \
  --no-password

# Aufräumen
rm "$TEMP_FILE"

echo "✅ Restore erfolgreich abgeschlossen!"
