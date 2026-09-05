# Essen-Wissen Kalender

Git-fertiges Projekt fuer den internen Einsatz- und Veranstaltungskalender der Essen-Wissen Stiftung Eildermann.

## Projektumfang

- Responsive Kalenderoberflaeche mit Monats-, Wochen-, Jahres- und Listenansicht
- interne und datenschutzreduzierte oeffentliche Ansicht
- Node.js-/Express-API
- PostgreSQL-Datenbankschema mit Rollen, Audit-Log und Ressourcen-Doppelbuchungsschutz
- Login mit signierten JWTs und serverseitiger Rollenpruefung
- Docker-Compose-Stack fuer PostgreSQL, API, Frontend und Caddy
- lokales HTTPS ueber Caddy-interne Zertifikate
- produktives HTTPS ueber Caddy und Let's Encrypt
- Container-Haertung, Healthchecks und interne Docker-Netzwerke

## Verzeichnisstruktur

```text
essen-wissen-kalender/
|-- api/
|   |-- db/schema.sql
|   |-- scripts/seed-demo.js
|   |-- src/
|   |   |-- auth.js
|   |   |-- config.js
|   |   |-- db.js
|   |   |-- repository.js
|   |   |-- routes.js
|   |   |-- server.js
|   |   `-- validation.js
|   |-- .dockerignore
|   |-- Dockerfile
|   |-- README.md
|   |-- package-lock.json
|   `-- package.json
|-- docs/
|   |-- deployment.md
|   `-- security-checklist.md
|-- frontend/
|   |-- public/index.html
|   |-- Dockerfile
|   `-- nginx.conf
|-- proxy/
|   |-- Caddyfile
|   `-- Caddy.productionfile
|-- scripts/
|   |-- check-project.sh
|   `-- generate-secrets.ps1
|-- .dockerignore
|-- .env.example
|-- .gitattributes
|-- .gitignore
|-- compose.dev.yaml
|-- compose.yaml
|-- LICENSE
`-- README.md
```

## Voraussetzungen

- Docker Desktop mit Docker Compose V2
- Windows 10/11; WSL2 wird empfohlen
- mindestens 4 GB freier Arbeitsspeicher
- Internetzugriff fuer den ersten Download der Docker-Images und Node-Abhaengigkeiten
- fuer produktives HTTPS: Domain, DNS und TCP-Ports 80/443

## Lokaler Start

PowerShell im Projektordner oeffnen:

```powershell
Copy-Item .env.example .env
```

In `.env` mindestens `POSTGRES_PASSWORD` und `JWT_SECRET` durch zufaellige Werte ersetzen. Die `.env`-Datei darf nicht in Git eingecheckt werden.

```powershell
docker compose -f compose.yaml -f compose.dev.yaml up -d --build
```

Lokale URLs:

```text
https://kalender.localhost
https://api.kalender.localhost/healthz
http://127.0.0.1:8025
```

Caddy verwendet lokal eine eigene Zertifizierungsstelle. Die Caddy-CA muss einmal auf dem lokalen Rechner als vertrauenswuerdig installiert werden. Eine Browserwarnung sollte nicht dauerhaft ignoriert werden.

## Demo-Administrator

Nur fuer lokale Tests:

```powershell
$env:DEMO_ADMIN_PASSWORD = "Ein-langes-Testpasswort-mit-mindestens-12-Zeichen"
docker compose exec api node scripts/seed-demo.js
Remove-Item Env:DEMO_ADMIN_PASSWORD
```

Das Demo-Konto nicht fuer Produktion verwenden.

## Stoppen und Zuruecksetzen

```powershell
docker compose down
```

Alle lokalen Daten loeschen:

```powershell
docker compose down -v
```

Der zweite Befehl loescht das PostgreSQL-Testvolume unwiderruflich.

## Produktion

1. `.env` mit Produktionswerten anlegen.
2. `APP_DOMAIN`, `API_DOMAIN` und `CORS_ORIGIN` auf echte Domains setzen.
3. `proxy/Caddy.productionfile` als `proxy/Caddyfile` verwenden.
4. DNS fuer beide Domains auf den Server zeigen lassen.
5. TCP 80 und 443 am Server freigeben.
6. Stack starten.

Caddy beantragt und erneuert die Zertifikate automatisch, sobald DNS und Ports korrekt eingerichtet sind.

## Git-Initialisierung

```powershell
git init
git add .
git diff --cached --check
git commit -m "Initiales Essen-Wissen Kalenderprojekt"
```

Fuer ein Remote-Repository:

```powershell
git remote add origin <REPOSITORY-URL>
git push -u origin main
```

## Sicherheitsumfang

Enthalten sind unter anderem:

- API- und Frontend-Container ohne Root-Rechte
- internes Backend-Netzwerk
- keine oeffentliche PostgreSQL-Veroeffentlichung im Produktionsstack
- Read-only-Dateisysteme fuer API und Frontend
- `no-new-privileges` und Capability-Drop
- HTTPS-Terminierung mit Security-Headern
- JWT-Signaturen und scrypt-Passwort-Hashing
- serverseitige Rollenpruefung
- oeffentliche Datenschutz-View
- Audit-Log
- Ressourcen-Doppelbuchungsschutz
- Healthchecks

Vor Produktion zusaetzlich erledigen:

- Login-Rate-Limiting und Brute-Force-Schutz
- serverseitig widerrufbare Sessions oder Refresh-Token-Rotation
- MFA fuer Administratoren
- getrennte PostgreSQL-Rollen fuer Migration und API
- verschluesselte Backups und getestete Wiederherstellung
- Malwarepruefung fuer Datei-Uploads
- Monitoring, Alarmierung und zentrale Logs
- automatisierte Integrations- und Sicherheitstests
