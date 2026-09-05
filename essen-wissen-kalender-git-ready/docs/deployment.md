# Deployment und lokaler Test

## Lokal unter Windows

1. Docker Desktop mit WSL2 starten.
2. `.env.example` nach `.env` kopieren.
3. `POSTGRES_PASSWORD` und `JWT_SECRET` in `.env` ersetzen.
4. Im Projektordner den Compose-Stack bauen und starten:

```powershell
docker compose -f compose.yaml -f compose.dev.yaml up -d --build
```

5. Prüfen:

```powershell
docker compose ps
docker compose logs --tail=100 api
```

6. Öffnen:

```text
https://kalender.localhost
https://api.kalender.localhost/healthz
http://127.0.0.1:8025
```

Caddy verwendet lokal eine interne Zertifizierungsstelle. Diese Root-CA muss einmal im Betriebssystem beziehungsweise im Browser als vertrauenswürdig installiert werden.

## Demo-Administrator

```powershell
$env:DEMO_ADMIN_PASSWORD = "Ein-langes-Testpasswort-mit-mindestens-12-Zeichen"
docker compose exec api node scripts/seed-demo.js
Remove-Item Env:DEMO_ADMIN_PASSWORD
```

## Zurücksetzen

```powershell
docker compose down -v
docker compose -f compose.yaml -f compose.dev.yaml up -d --build
```

Der erste Befehl löscht alle lokalen Datenbankdaten.

## Produktion

1. Echte Domains und DNS-Einträge einrichten.
2. `.env` mit Produktionssecrets konfigurieren.
3. `CORS_ORIGIN`, `APP_DOMAIN` und `API_DOMAIN` setzen.
4. `proxy/Caddy.productionfile` als `proxy/Caddyfile` aktivieren.
5. Ports 80 und 443 zum Server weiterleiten.
6. den Stack starten.

Caddy beantragt Zertifikate automatisch über Let's Encrypt.

## Backup und Betrieb

PostgreSQL-Volume, Caddy-Daten und Konfiguration regelmäßig sichern. Wiederherstellungstests durchführen. Containerimages, Node-Abhängigkeiten und Datenbank regelmäßig aktualisieren.
