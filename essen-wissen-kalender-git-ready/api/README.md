# Essen-Wissen Kalender API

Server-API fuer den Essen-Wissen Einsatz- und Veranstaltungskalender.

## Voraussetzungen

- Node.js 20 oder neuer
- PostgreSQL 15 oder neuer
- psql fuer die Datenbankmigration
- HTTPS-Reverse-Proxy, zum Beispiel Nginx oder Caddy

## Einrichtung

1. Projekt auf den Server kopieren.
2. `.env.example` nach `.env` kopieren und mit echten Werten fuellen.
3. Die in `package.json` aufgefuehrten Abhaengigkeiten in der Deployment-Umgebung installieren.
4. Schema mit `npm run db:migrate` einspielen.
5. Fuer die Ersteinrichtung `DEMO_ADMIN_PASSWORD` setzen und `npm run db:seed` einmal ausfuehren.
6. `DEMO_ADMIN_PASSWORD` danach entfernen und mit `npm start` starten.

## Endpunkte

Oeffentlich:

- `GET /healthz`
- `GET /api/v1/health`
- `GET /api/v1/public/events`

Login und Benutzer:

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/admin/users`
- `POST /api/v1/admin/users`
- `POST /api/v1/admin/users/:id/roles`

Interne Termine mit `Authorization: Bearer <TOKEN>`:

- `GET /api/v1/events`
- `GET /api/v1/events/:id`
- `POST /api/v1/events`
- `PATCH /api/v1/events/:id`
- `DELETE /api/v1/events/:id` (Soft Delete)
- `POST /api/v1/events/:id/cancel`

Auswertungen:

- `GET /api/v1/statistics/yearly`
- `GET /api/v1/statistics/federal-states`

## Login-Anfrage

```http
POST /api/v1/auth/login
Content-Type: application/json

{"email":"admin@example.org","password":"..."}
```

Das Ergebnis enthaelt ein signiertes JWT. Interne Requests verwenden den Bearer-Header.

## Termin anlegen

```json
{
  "title": "Brotbox-Baukasten",
  "publicTitle": "Essen-Wissen Bus",
  "description": "Workshop fuer Kinder.",
  "publicDescription": "Ein Workshop rund um eine ausgewogene Brotbox.",
  "eventType": "bus",
  "status": "planned",
  "startsAt": "2026-09-02T09:00:00+02:00",
  "endsAt": "2026-09-02T13:00:00+02:00",
  "timezone": "Europe/Berlin",
  "institutionId": "UUID_DER_EINRICHTUNG",
  "locationId": "UUID_DES_ORTS",
  "expectedChildren": 48,
  "expectedCompanions": 4,
  "targetGroup": "Klassenstufe 3-4",
  "topic": "Brotbox und Pausenenergie",
  "visibility": "partial_public",
  "showPublicStatus": true,
  "resourceIds": ["UUID_DES_BUSSES"],
  "contactIds": ["UUID_DES_ANSPRECHPARTNERS"]
}
```

## Rollen und Rechte

Die Rollen werden aus `user_roles` und `role_permissions` geladen und in das signierte Token aufgenommen. Jede geschuetzte Route prueft die Berechtigung serverseitig.

Vorgesehene Rollen:

- `administrator`
- `stiftungsteam`
- `internal_reader`
- `public_visitor`

## Datenschutz

Oeffentliche Kalenderanfragen lesen ausschliesslich `public_calendar_events`. Diese View enthaelt keine Ansprechpartner, Telefonnummern, E-Mail-Adressen, internen Notizen oder vollstaendigen Strassenadressen.

Fuer interne Transaktionen setzt die API `app.user_id` und `app.request_id`; dadurch kann der Audit-Log den Bearbeiter und die Anfrage zuordnen.

## Ressourcen und Doppelbuchungen

Die API synchronisiert `event_resources` und `resource_bookings` innerhalb derselben Transaktion. Die Exclusion Constraint des Schemas verhindert ueberlappende Zeitbereiche derselben Ressource. Bei SQLSTATE `23P01` antwortet die API mit HTTP 409 und `RESOURCE_CONFLICT`.

`resource_unavailability` muss vor dem Speichern zusaetzlich von der API geprueft werden, weil Sperrzeiten nicht automatisch in `resource_bookings` uebernommen werden.

## Produktionshinweise

- Nur HTTPS verwenden.
- `CORS_ORIGIN` auf genau einen erlaubten Frontend-Origin setzen.
- `JWT_SECRET` ueber Secret Management bereitstellen.
- Demo-Seed und Demo-Passwort nach der Ersteinrichtung entfernen.
- PostgreSQL-Benutzer mit minimalen Rechten verwenden.
- Datenbank, Backups und Dateiablage verschluesseln.
- Login-Rate-Limiting und Login-Sperren am Reverse-Proxy oder in der Anwendung ergaenzen.
- Anhaenge vor dem Speichern auf Groesse, Dateityp und Schadsoftware pruefen.
- Die oeffentliche API nie direkt auf interne Tabellen aufsetzen.

Die vorhandene Browser-Oberflaeche muss fuer den Produktivbetrieb ihre lokalen Demodaten durch Requests auf `/api/v1` ersetzen. Fuer interne Kontaktdaten ist ein HttpOnly-, Secure- und SameSite-Cookie gegenueber localStorage vorzuziehen.
