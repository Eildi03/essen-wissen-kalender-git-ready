-- migrate:up
-- Essen-Wissen Stiftung Eildermann
-- PostgreSQL-Schema für Einsatz- und Veranstaltungskalender
-- Zielversion: PostgreSQL 15+
-- Anwendungszeitzone: Europe/Berlin
--
-- Ausführung:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
--     -f essen-wissen-postgresql-schema-final.sql
--
-- Sicherheitsprinzipien:
--   1. Öffentliche API-Endpunkte lesen ausschließlich public_calendar_events.
--   2. Kontaktdaten und interne Notizen liegen nur in internen Tabellen/Views.
--   3. Dateien werden nicht in PostgreSQL gespeichert. storage_key verweist auf
--      einen verschlüsselten Objektspeicher des Servers.
--   4. Vor jedem mutierenden API-Request updated_by sowie app.user_id und
--      app.request_id setzen.

BEGIN;

CREATE SCHEMA IF NOT EXISTS essen_wissen;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS btree_gist;
SET search_path TO essen_wissen, public;

-- ============================================================
-- Enums
-- ============================================================

DO $$
BEGIN
  CREATE TYPE event_type AS ENUM ('bus', 'kitchen', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE event_status AS ENUM ('request', 'planned', 'confirmed', 'done', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE event_visibility AS ENUM ('internal', 'partial_public', 'public');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE institution_type AS ENUM (
    'kindertagesstaette',
    'grundschule',
    'weiterfuehrende_schule',
    'hort',
    'jugendfreizeiteinrichtung',
    'familienzentrum',
    'soziale_einrichtung',
    'unternehmen',
    'oeffentliche_veranstaltung',
    'sonstige_einrichtung'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE resource_type AS ENUM ('bus', 'kitchen', 'staff', 'vehicle', 'equipment', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE resource_status AS ENUM ('active', 'inactive', 'maintenance');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE consent_status AS ENUM ('unknown', 'pending', 'granted', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE notification_channel AS ENUM ('email', 'in_app');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- Gemeinsame Funktionen
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = essen_wissen, pg_catalog
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = essen_wissen, pg_catalog
AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid;
$$;

-- ============================================================
-- Stammdaten, Benutzer und Rollen
-- ============================================================

CREATE TABLE IF NOT EXISTS federal_states (
  code        char(2) PRIMARY KEY,
  name        varchar(80) NOT NULL UNIQUE
);

INSERT INTO federal_states (code, name) VALUES
  ('BW', 'Baden-Württemberg'),
  ('BY', 'Bayern'),
  ('BE', 'Berlin'),
  ('BB', 'Brandenburg'),
  ('HB', 'Bremen'),
  ('HH', 'Hamburg'),
  ('HE', 'Hessen'),
  ('MV', 'Mecklenburg-Vorpommern'),
  ('NI', 'Niedersachsen'),
  ('NW', 'Nordrhein-Westfalen'),
  ('RP', 'Rheinland-Pfalz'),
  ('SL', 'Saarland'),
  ('SN', 'Sachsen'),
  ('ST', 'Sachsen-Anhalt'),
  ('SH', 'Schleswig-Holstein'),
  ('TH', 'Thüringen')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS app_users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           citext NOT NULL UNIQUE,
  password_hash   text,
  auth_provider   varchar(20) NOT NULL DEFAULT 'local',
  first_name      varchar(100) NOT NULL,
  last_name       varchar(100) NOT NULL,
  is_active       boolean NOT NULL DEFAULT true,
  last_login_at   timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_users_name_check CHECK (
    btrim(first_name) <> '' AND btrim(last_name) <> ''
  ),
  CONSTRAINT app_users_auth_provider_check CHECK (
    auth_provider IN ('local', 'oidc', 'saml')
  )
);

CREATE TABLE IF NOT EXISTS roles (
  code        varchar(50) PRIMARY KEY,
  label       varchar(120) NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissions (
  code        varchar(100) PRIMARY KEY,
  label       varchar(160) NOT NULL,
  description text
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id     uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  role_code   varchar(50) NOT NULL REFERENCES roles(code) ON DELETE RESTRICT,
  assigned_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_code)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_code       varchar(50) NOT NULL REFERENCES roles(code) ON DELETE CASCADE,
  permission_code varchar(100) NOT NULL REFERENCES permissions(code) ON DELETE CASCADE,
  PRIMARY KEY (role_code, permission_code)
);

INSERT INTO roles (code, label, description) VALUES
  ('administrator', 'Administrator', 'Vollständiger Zugriff einschließlich Benutzerverwaltung.'),
  ('stiftungsteam', 'Stiftungsteam', 'Veranstaltungen anlegen und bearbeiten; interne Daten lesen.'),
  ('internal_reader', 'Leseberechtigter interner Nutzer', 'Interne Kalenderansicht ohne Bearbeitungsrechte.'),
  ('public_visitor', 'Öffentlicher Besucher', 'Nur freigegebene öffentliche Informationen.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions (code, label, description) VALUES
  ('calendar.read_public', 'Öffentlichen Kalender lesen', 'Freigegebene Termine lesen.'),
  ('calendar.read_internal', 'Internen Kalender lesen', 'Alle internen Termindaten lesen.'),
  ('event.create', 'Veranstaltungen anlegen', 'Einzeltermine und Serien anlegen.'),
  ('event.update', 'Veranstaltungen bearbeiten', 'Termine bearbeiten oder verschieben.'),
  ('event.delete', 'Veranstaltungen löschen', 'Termine löschen oder archivieren.'),
  ('event.publish', 'Veranstaltungen freigeben', 'Termine öffentlich schalten.'),
  ('event.export', 'Termine exportieren', 'ICS-, CSV- und PDF-Exporte ausführen.'),
  ('user.manage', 'Benutzer verwalten', 'Benutzer und Rollen verwalten.'),
  ('settings.manage', 'Systemeinstellungen verwalten', 'Ressourcen und Stammdaten verwalten.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_code, permission_code)
SELECT 'administrator', code FROM permissions
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_code, permission_code) VALUES
  ('stiftungsteam', 'calendar.read_internal'),
  ('stiftungsteam', 'event.create'),
  ('stiftungsteam', 'event.update'),
  ('stiftungsteam', 'event.export'),
  ('internal_reader', 'calendar.read_internal'),
  ('public_visitor', 'calendar.read_public')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Einrichtungen, Adressen und Ansprechpartner
-- ============================================================

CREATE TABLE IF NOT EXISTS institutions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_type  institution_type NOT NULL,
  name              varchar(240) NOT NULL,
  central_phone     varchar(60),
  central_email     citext,
  notes             text,
  created_by        uuid REFERENCES app_users(id) ON DELETE SET NULL,
  updated_by        uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  CONSTRAINT institutions_name_check CHECK (btrim(name) <> '')
);

CREATE INDEX IF NOT EXISTS institutions_name_idx
  ON institutions (lower(name))
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS locations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id      uuid REFERENCES institutions(id) ON DELETE CASCADE,
  federal_state_code  char(2) NOT NULL REFERENCES federal_states(code),
  postal_code         varchar(10) NOT NULL,
  city                varchar(120) NOT NULL,
  district            varchar(120),
  street              varchar(180),
  house_number        varchar(30),
  building_room       varchar(180),
  arrival_notes       text,
  parking_notes       text,
  latitude            numeric(9, 6),
  longitude           numeric(9, 6),
  is_primary          boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT locations_postal_code_check CHECK (btrim(postal_code) <> ''),
  CONSTRAINT locations_city_check CHECK (btrim(city) <> ''),
  CONSTRAINT locations_latitude_check CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CONSTRAINT locations_longitude_check CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE UNIQUE INDEX IF NOT EXISTS locations_one_primary_per_institution
  ON locations (institution_id)
  WHERE is_primary AND institution_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS locations_city_idx ON locations (lower(city));
CREATE INDEX IF NOT EXISTS locations_state_idx ON locations (federal_state_code);

CREATE TABLE IF NOT EXISTS contacts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id      uuid REFERENCES institutions(id) ON DELETE SET NULL,
  first_name          varchar(100) NOT NULL,
  last_name           varchar(100) NOT NULL,
  function_title      varchar(160),
  phone               varchar(60),
  mobile_phone        varchar(60),
  email               citext,
  notes               text,
  consent_status      consent_status NOT NULL DEFAULT 'unknown',
  consent_recorded_at timestamptz,
  is_primary          boolean NOT NULL DEFAULT false,
  is_active           boolean NOT NULL DEFAULT true,
  created_by          uuid REFERENCES app_users(id) ON DELETE SET NULL,
  updated_by          uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contacts_name_check CHECK (
    btrim(first_name) <> '' AND btrim(last_name) <> ''
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS contacts_one_primary_per_institution
  ON contacts (institution_id)
  WHERE is_primary AND is_active AND institution_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS contacts_name_idx
  ON contacts (lower(last_name), lower(first_name));

-- ============================================================
-- Ressourcen und Sperrzeiten
-- ============================================================

CREATE TABLE IF NOT EXISTS resources (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            varchar(160) NOT NULL UNIQUE,
  resource_type   resource_type NOT NULL,
  description     text,
  status          resource_status NOT NULL DEFAULT 'active',
  created_by      uuid REFERENCES app_users(id) ON DELETE SET NULL,
  updated_by      uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT resources_name_check CHECK (btrim(name) <> '')
);

INSERT INTO resources (name, resource_type, description) VALUES
  ('Essen-Wissen Bus', 'bus', 'Mobiler Bus für Einsätze außerhalb der Stiftung.'),
  ('Stiftungsküche', 'kitchen', 'Koch- und Schulungszentrum der Stiftung.')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS resource_unavailability (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  starts_at   timestamptz NOT NULL,
  ends_at     timestamptz NOT NULL,
  reason      varchar(240) NOT NULL,
  created_by  uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT resource_unavailability_range_check CHECK (ends_at > starts_at),
  CONSTRAINT resource_unavailability_reason_check CHECK (btrim(reason) <> '')
);

CREATE INDEX IF NOT EXISTS resource_unavailability_idx
  ON resource_unavailability (resource_id, starts_at, ends_at);

-- ============================================================
-- Wiederkehrende Termine und Veranstaltungen
-- ============================================================

CREATE TABLE IF NOT EXISTS event_series (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  frequency    varchar(20) NOT NULL,
  rrule        text NOT NULL,
  starts_at    timestamptz NOT NULL,
  repeat_until timestamptz,
  timezone     varchar(64) NOT NULL DEFAULT 'Europe/Berlin',
  created_by   uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_series_frequency_check CHECK (
    frequency IN ('weekly', 'monthly', 'yearly', 'custom')
  ),
  CONSTRAINT event_series_until_check CHECK (
    repeat_until IS NULL OR repeat_until >= starts_at
  )
);

CREATE TABLE IF NOT EXISTS events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id           uuid REFERENCES event_series(id) ON DELETE SET NULL,
  occurrence_start    timestamptz,
  is_series_exception boolean NOT NULL DEFAULT false,

  title               varchar(240) NOT NULL,
  public_title        varchar(240),
  description         text,
  public_description  text,
  event_type          event_type NOT NULL,
  status              event_status NOT NULL DEFAULT 'request',

  starts_at           timestamptz NOT NULL,
  ends_at             timestamptz NOT NULL,
  all_day             boolean NOT NULL DEFAULT false,
  timezone            varchar(64) NOT NULL DEFAULT 'Europe/Berlin',

  institution_id      uuid REFERENCES institutions(id) ON DELETE SET NULL,
  location_id         uuid REFERENCES locations(id) ON DELETE SET NULL,
  expected_children   integer NOT NULL DEFAULT 0,
  expected_companions integer NOT NULL DEFAULT 0,
  target_group        varchar(240),
  topic               varchar(240),
  internal_notes      text,

  visibility          event_visibility NOT NULL DEFAULT 'internal',
  show_public_status  boolean NOT NULL DEFAULT true,
  public_released_at  timestamptz,
  public_released_by  uuid REFERENCES app_users(id) ON DELETE SET NULL,

  created_by          uuid REFERENCES app_users(id) ON DELETE SET NULL,
  updated_by          uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz,
  deleted_by          uuid REFERENCES app_users(id) ON DELETE SET NULL,

  CONSTRAINT events_title_check CHECK (btrim(title) <> ''),
  CONSTRAINT events_public_title_check CHECK (
    public_title IS NULL OR btrim(public_title) <> ''
  ),
  CONSTRAINT events_range_check CHECK (ends_at > starts_at),
  CONSTRAINT events_participants_check CHECK (
    expected_children >= 0 AND expected_companions >= 0
  ),
  CONSTRAINT events_timezone_check CHECK (btrim(timezone) <> ''),
  CONSTRAINT events_series_occurrence_check CHECK (
    (series_id IS NULL AND occurrence_start IS NULL)
    OR (series_id IS NOT NULL AND occurrence_start IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS events_start_idx ON events (starts_at);
CREATE INDEX IF NOT EXISTS events_end_idx ON events (ends_at);
CREATE INDEX IF NOT EXISTS events_type_status_idx ON events (event_type, status);
CREATE INDEX IF NOT EXISTS events_visibility_start_idx ON events (visibility, starts_at);
CREATE INDEX IF NOT EXISTS events_institution_idx ON events (institution_id);
CREATE INDEX IF NOT EXISTS events_location_idx ON events (location_id);
CREATE INDEX IF NOT EXISTS events_active_start_idx
  ON events (starts_at)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS events_series_occurrence_unique
  ON events (series_id, occurrence_start)
  WHERE series_id IS NOT NULL AND occurrence_start IS NOT NULL;

CREATE INDEX IF NOT EXISTS events_search_idx
  ON events USING gin (
    to_tsvector(
      'german',
      concat_ws(
        ' ', title, public_title, description, public_description,
        topic, target_group, internal_notes
      )
    )
  );

CREATE TABLE IF NOT EXISTS event_contacts (
  event_id     uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  contact_id   uuid NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
  contact_role varchar(80),
  is_primary   boolean NOT NULL DEFAULT false,
  PRIMARY KEY (event_id, contact_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS event_contacts_one_primary
  ON event_contacts (event_id)
  WHERE is_primary;

CREATE TABLE IF NOT EXISTS event_resources (
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE RESTRICT,
  is_primary  boolean NOT NULL DEFAULT false,
  PRIMARY KEY (event_id, resource_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS event_resources_one_primary
  ON event_resources (event_id)
  WHERE is_primary;

-- ============================================================
-- Ressourcenbelegung und Doppelbuchungsprüfung
-- ============================================================
-- Die Anwendung legt für jede einem Termin zugewiesene Ressource eine Zeile
-- in resource_bookings an. Die Exclusion Constraint verhindert überlappende
-- Zeitbereiche derselben Ressource. Abgesagte oder gelöschte Termine blockieren
-- die Ressource nicht mehr.

CREATE TABLE IF NOT EXISTS resource_bookings (
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE RESTRICT,
  starts_at   timestamptz NOT NULL,
  ends_at     timestamptz NOT NULL,
  blocks      boolean NOT NULL DEFAULT true,
  time_range  tstzrange GENERATED ALWAYS AS (
    tstzrange(starts_at, ends_at, '[)')
  ) STORED,
  PRIMARY KEY (event_id, resource_id),
  CONSTRAINT resource_bookings_range_check CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS resource_bookings_resource_idx
  ON resource_bookings (resource_id, starts_at, ends_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'resource_bookings_no_overlap'
      AND conrelid = 'essen_wissen.resource_bookings'::regclass
  ) THEN
    ALTER TABLE resource_bookings
      ADD CONSTRAINT resource_bookings_no_overlap
      EXCLUDE USING gist (
        resource_id WITH =,
        time_range WITH &&
      ) WHERE (blocks);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION sync_booking_from_event_resource()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = essen_wissen, pg_catalog
AS $$
DECLARE
  current_event events%ROWTYPE;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM resource_bookings
     WHERE event_id = OLD.event_id
       AND resource_id = OLD.resource_id;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND
     (OLD.event_id <> NEW.event_id OR OLD.resource_id <> NEW.resource_id) THEN
    DELETE FROM resource_bookings
     WHERE event_id = OLD.event_id
       AND resource_id = OLD.resource_id;
  END IF;

  SELECT * INTO current_event
    FROM events
   WHERE id = NEW.event_id;

  INSERT INTO resource_bookings (
    event_id, resource_id, starts_at, ends_at, blocks
  ) VALUES (
    NEW.event_id,
    NEW.resource_id,
    current_event.starts_at,
    current_event.ends_at,
    current_event.status <> 'cancelled'
      AND current_event.deleted_at IS NULL
  )
  ON CONFLICT (event_id, resource_id) DO UPDATE SET
    starts_at = EXCLUDED.starts_at,
    ends_at = EXCLUDED.ends_at,
    blocks = EXCLUDED.blocks;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_bookings_from_event()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = essen_wissen, pg_catalog
AS $$
BEGIN
  UPDATE resource_bookings
     SET starts_at = NEW.starts_at,
         ends_at = NEW.ends_at,
         blocks = NEW.status <> 'cancelled'
           AND NEW.deleted_at IS NULL
   WHERE event_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS event_resources_sync_booking ON event_resources;
CREATE TRIGGER event_resources_sync_booking
AFTER INSERT OR UPDATE OR DELETE ON event_resources
FOR EACH ROW EXECUTE FUNCTION sync_booking_from_event_resource();

DROP TRIGGER IF EXISTS events_sync_bookings ON events;
CREATE TRIGGER events_sync_bookings
AFTER UPDATE OF starts_at, ends_at, status, deleted_at ON events
FOR EACH ROW EXECUTE FUNCTION sync_bookings_from_event();

-- ============================================================
-- Anhänge, Erinnerungen und Benachrichtigungen
-- ============================================================

CREATE TABLE IF NOT EXISTS attachments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_name varchar(255) NOT NULL,
  storage_key   varchar(500) NOT NULL UNIQUE,
  media_type    varchar(160) NOT NULL,
  size_bytes    bigint NOT NULL,
  sha256_hex    char(64),
  uploaded_by   uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attachments_size_check CHECK (size_bytes >= 0)
);

CREATE TABLE IF NOT EXISTS event_attachments (
  event_id      uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  attachment_id uuid NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
  description   varchar(240),
  PRIMARY KEY (event_id, attachment_id)
);

CREATE TABLE IF NOT EXISTS event_reminders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  recipient_user_id uuid REFERENCES app_users(id) ON DELETE CASCADE,
  recipient_email   citext,
  channel           notification_channel NOT NULL DEFAULT 'email',
  minutes_before    integer NOT NULL,
  sent_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_reminders_recipient_check CHECK (
    recipient_user_id IS NOT NULL OR recipient_email IS NOT NULL
  ),
  CONSTRAINT event_reminders_minutes_check CHECK (minutes_before >= 0)
);

CREATE INDEX IF NOT EXISTS event_reminders_pending_idx
  ON event_reminders (event_id, sent_at)
  WHERE sent_at IS NULL;

CREATE TABLE IF NOT EXISTS event_subscriptions (
  user_id          uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  event_id         uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  notify_on_change boolean NOT NULL DEFAULT true,
  notify_on_status boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);


-- ============================================================
-- Änderungsprotokoll
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_type   varchar(80) NOT NULL,
  entity_id     uuid NOT NULL,
  action        varchar(30) NOT NULL,
  actor_user_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  occurred_at   timestamptz NOT NULL DEFAULT now(),
  before_data   jsonb,
  after_data    jsonb,
  request_id    varchar(120)
);

CREATE INDEX IF NOT EXISTS audit_log_entity_idx
  ON audit_log (entity_type, entity_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION audit_event_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = essen_wissen, pg_catalog
AS $$
DECLARE
  actor uuid;
BEGIN
  actor := COALESCE(
    CASE WHEN TG_OP = 'DELETE' THEN OLD.updated_by ELSE NEW.updated_by END,
    current_app_user_id()
  );

  INSERT INTO audit_log (
    entity_type, entity_id, action, actor_user_id,
    before_data, after_data, request_id
  ) VALUES (
    'event',
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    lower(TG_OP),
    actor,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END,
    NULLIF(current_setting('app.request_id', true), '')
  );

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS events_audit ON events;
CREATE TRIGGER events_audit
AFTER INSERT OR UPDATE OR DELETE ON events
FOR EACH ROW EXECUTE FUNCTION audit_event_changes();

-- updated_at automatisch pflegen

DROP TRIGGER IF EXISTS app_users_set_updated_at ON app_users;
CREATE TRIGGER app_users_set_updated_at
BEFORE UPDATE ON app_users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS institutions_set_updated_at ON institutions;
CREATE TRIGGER institutions_set_updated_at
BEFORE UPDATE ON institutions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS locations_set_updated_at ON locations;
CREATE TRIGGER locations_set_updated_at
BEFORE UPDATE ON locations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS contacts_set_updated_at ON contacts;
CREATE TRIGGER contacts_set_updated_at
BEFORE UPDATE ON contacts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS resources_set_updated_at ON resources;
CREATE TRIGGER resources_set_updated_at
BEFORE UPDATE ON resources
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS events_set_updated_at ON events;
CREATE TRIGGER events_set_updated_at
BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Datenschutzfreundliche Views
-- ============================================================
-- Diese View enthält absichtlich keine Namen, Telefon- oder E-Mail-Daten,
-- internen Notizen, vollständigen Straßenadressen oder storage_keys.

CREATE OR REPLACE VIEW public_calendar_events AS
SELECT
  e.id,
  COALESCE(NULLIF(e.public_title, ''), e.title) AS title,
  e.starts_at,
  e.ends_at,
  e.all_day,
  e.timezone,
  e.event_type,
  CASE WHEN e.show_public_status THEN e.status::text END AS status,
  i.name AS institution_name,
  l.city,
  fs.name AS federal_state,
  e.public_description AS description
FROM events e
LEFT JOIN institutions i
  ON i.id = e.institution_id
 AND i.deleted_at IS NULL
LEFT JOIN locations l ON l.id = e.location_id
LEFT JOIN federal_states fs ON fs.code = l.federal_state_code
WHERE e.deleted_at IS NULL
  AND e.visibility IN ('public', 'partial_public');

CREATE OR REPLACE VIEW internal_calendar_events AS
SELECT
  e.id,
  e.series_id,
  e.occurrence_start,
  e.title,
  e.public_title,
  e.description,
  e.public_description,
  e.event_type,
  e.status,
  e.starts_at,
  e.ends_at,
  e.all_day,
  e.timezone,
  e.institution_id,
  i.name AS institution_name,
  i.institution_type,
  e.location_id,
  l.federal_state_code,
  fs.name AS federal_state,
  l.postal_code,
  l.city,
  l.district,
  l.street,
  l.house_number,
  l.building_room,
  e.expected_children,
  e.expected_companions,
  e.target_group,
  e.topic,
  e.internal_notes,
  e.visibility,
  e.created_by,
  e.created_at,
  e.updated_by,
  e.updated_at,
  e.deleted_at
FROM events e
LEFT JOIN institutions i ON i.id = e.institution_id
LEFT JOIN locations l ON l.id = e.location_id
LEFT JOIN federal_states fs ON fs.code = l.federal_state_code;

-- ============================================================
-- Auswertungen
-- ============================================================

CREATE OR REPLACE VIEW event_yearly_statistics AS
SELECT
  EXTRACT(YEAR FROM e.starts_at AT TIME ZONE e.timezone)::integer AS year,
  COUNT(*) FILTER (WHERE e.event_type = 'bus') AS bus_events,
  COUNT(*) FILTER (WHERE e.event_type = 'kitchen') AS kitchen_events,
  COUNT(DISTINCT e.institution_id) AS institutions_reached,
  COALESCE(SUM(e.expected_children), 0) AS expected_children,
  COALESCE(SUM(e.expected_companions), 0) AS expected_companions,
  COUNT(*) FILTER (WHERE e.status = 'confirmed') AS confirmed_events,
  COUNT(*) FILTER (WHERE e.status = 'planned') AS planned_events,
  COUNT(*) FILTER (WHERE e.status = 'cancelled') AS cancelled_events
FROM events e
WHERE e.deleted_at IS NULL
GROUP BY EXTRACT(YEAR FROM e.starts_at AT TIME ZONE e.timezone)::integer;

CREATE OR REPLACE VIEW event_statistics_by_federal_state AS
SELECT
  EXTRACT(YEAR FROM e.starts_at AT TIME ZONE e.timezone)::integer AS year,
  fs.code AS federal_state_code,
  fs.name AS federal_state,
  COUNT(*) AS event_count,
  COUNT(*) FILTER (WHERE e.event_type = 'bus') AS bus_event_count,
  COUNT(*) FILTER (WHERE e.event_type = 'kitchen') AS kitchen_event_count,
  COALESCE(SUM(e.expected_children), 0) AS expected_children
FROM events e
JOIN locations l ON l.id = e.location_id
JOIN federal_states fs ON fs.code = l.federal_state_code
WHERE e.deleted_at IS NULL
GROUP BY
  EXTRACT(YEAR FROM e.starts_at AT TIME ZONE e.timezone)::integer,
  fs.code,
  fs.name;

-- ============================================================
-- Integrationshinweise für die Server-Anwendung
-- ============================================================
-- Vor jedem mutierenden API-Request innerhalb der Transaktion setzen:
--   SELECT set_config('app.user_id', '<UUID>', true);
--   SELECT set_config('app.request_id', '<REQUEST-ID>', true);
--
-- Öffentliche API:
--   SELECT * FROM essen_wissen.public_calendar_events
--    WHERE starts_at >= $1 AND starts_at < $2;
--
-- Interne API:
--   Rollen/Berechtigungen aus user_roles und role_permissions prüfen und
--   anschließend internal_calendar_events bzw. Basistabellen lesen.
--
-- Die Exclusion Constraint erzeugt bei einer Ressourcenüberschneidung den
-- Fehler SQLSTATE 23P01. Die API sollte ihn in eine verständliche Meldung
-- wie „Ressource bereits belegt“ übersetzen.
--
-- Zusätzlich zu resource_bookings müssen vor dem Speichern resource_unavailability
-- und die Berechtigung des Benutzers geprüft werden.
--
-- Passwörter ausschließlich als Argon2id- oder bcrypt-Hash speichern.
-- Niemals Klartextpasswörter in app_users.password_hash ablegen.

COMMIT;

