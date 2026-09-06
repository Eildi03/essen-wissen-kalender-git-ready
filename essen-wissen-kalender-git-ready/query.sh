#!/bin/bash
# Query-Script für Essen-Wissen Kalender
# Führt SQL-Queries aus und gibt Ergebnisse aus

set -e

QUERY="${1:-}"

if [ -z "$QUERY" ]; then
  echo "❌ Fehler: Query nicht angegeben"
  echo "Verwendung: ./query.sh \"SELECT * FROM essen_wissen.app_users;\""
  exit 1
fi

echo "🔍 Query wird ausgeführt..."
echo "   $QUERY"
echo ""

docker exec essen-wissen-kalender-postgres-1 psql \
  -U essen_wissen_admin \
  -d essen_wissen \
  -c "$QUERY" \
  --no-password

echo ""
echo "✅ Fertig!"
