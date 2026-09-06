--
-- PostgreSQL database dump
--

\restrict Dh5157s3uppc3jxw2fpysevDzXmkN1sr9xjEYljWI1zUerduYeH3PEGBVQq3zQJ

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: essen_wissen; Type: SCHEMA; Schema: -; Owner: essen_wissen_admin
--

CREATE SCHEMA essen_wissen;


ALTER SCHEMA essen_wissen OWNER TO essen_wissen_admin;

--
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: consent_status; Type: TYPE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TYPE essen_wissen.consent_status AS ENUM (
    'unknown',
    'pending',
    'granted',
    'revoked'
);


ALTER TYPE essen_wissen.consent_status OWNER TO essen_wissen_admin;

--
-- Name: event_status; Type: TYPE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TYPE essen_wissen.event_status AS ENUM (
    'request',
    'planned',
    'confirmed',
    'done',
    'cancelled'
);


ALTER TYPE essen_wissen.event_status OWNER TO essen_wissen_admin;

--
-- Name: event_type; Type: TYPE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TYPE essen_wissen.event_type AS ENUM (
    'bus',
    'kitchen',
    'other'
);


ALTER TYPE essen_wissen.event_type OWNER TO essen_wissen_admin;

--
-- Name: event_visibility; Type: TYPE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TYPE essen_wissen.event_visibility AS ENUM (
    'internal',
    'partial_public',
    'public'
);


ALTER TYPE essen_wissen.event_visibility OWNER TO essen_wissen_admin;

--
-- Name: institution_type; Type: TYPE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TYPE essen_wissen.institution_type AS ENUM (
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


ALTER TYPE essen_wissen.institution_type OWNER TO essen_wissen_admin;

--
-- Name: notification_channel; Type: TYPE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TYPE essen_wissen.notification_channel AS ENUM (
    'email',
    'in_app'
);


ALTER TYPE essen_wissen.notification_channel OWNER TO essen_wissen_admin;

--
-- Name: resource_status; Type: TYPE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TYPE essen_wissen.resource_status AS ENUM (
    'active',
    'inactive',
    'maintenance'
);


ALTER TYPE essen_wissen.resource_status OWNER TO essen_wissen_admin;

--
-- Name: resource_type; Type: TYPE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TYPE essen_wissen.resource_type AS ENUM (
    'bus',
    'kitchen',
    'staff',
    'vehicle',
    'equipment',
    'other'
);


ALTER TYPE essen_wissen.resource_type OWNER TO essen_wissen_admin;

--
-- Name: audit_event_changes(); Type: FUNCTION; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE FUNCTION essen_wissen.audit_event_changes() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'essen_wissen', 'pg_catalog'
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


ALTER FUNCTION essen_wissen.audit_event_changes() OWNER TO essen_wissen_admin;

--
-- Name: current_app_user_id(); Type: FUNCTION; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE FUNCTION essen_wissen.current_app_user_id() RETURNS uuid
    LANGUAGE sql STABLE
    SET search_path TO 'essen_wissen', 'pg_catalog'
    AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid;
$$;


ALTER FUNCTION essen_wissen.current_app_user_id() OWNER TO essen_wissen_admin;

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE FUNCTION essen_wissen.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'essen_wissen', 'pg_catalog'
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION essen_wissen.set_updated_at() OWNER TO essen_wissen_admin;

--
-- Name: sync_booking_from_event_resource(); Type: FUNCTION; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE FUNCTION essen_wissen.sync_booking_from_event_resource() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'essen_wissen', 'pg_catalog'
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


ALTER FUNCTION essen_wissen.sync_booking_from_event_resource() OWNER TO essen_wissen_admin;

--
-- Name: sync_bookings_from_event(); Type: FUNCTION; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE FUNCTION essen_wissen.sync_bookings_from_event() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'essen_wissen', 'pg_catalog'
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


ALTER FUNCTION essen_wissen.sync_bookings_from_event() OWNER TO essen_wissen_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_users; Type: TABLE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TABLE essen_wissen.app_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email public.citext NOT NULL,
    password_hash text,
    auth_provider character varying(20) DEFAULT 'local'::character varying NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT app_users_auth_provider_check CHECK (((auth_provider)::text = ANY ((ARRAY['local'::character varying, 'oidc'::character varying, 'saml'::character varying])::text[]))),
    CONSTRAINT app_users_name_check CHECK (((btrim((first_name)::text) <> ''::text) AND (btrim((last_name)::text) <> ''::text)))
);


ALTER TABLE essen_wissen.app_users OWNER TO essen_wissen_admin;

--
-- Name: attachments; Type: TABLE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TABLE essen_wissen.attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    original_name character varying(255) NOT NULL,
    storage_key character varying(500) NOT NULL,
    media_type character varying(160) NOT NULL,
    size_bytes bigint NOT NULL,
    sha256_hex character(64),
    uploaded_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT attachments_size_check CHECK ((size_bytes >= 0))
);


ALTER TABLE essen_wissen.attachments OWNER TO essen_wissen_admin;

--
-- Name: audit_log; Type: TABLE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TABLE essen_wissen.audit_log (
    id bigint NOT NULL,
    entity_type character varying(80) NOT NULL,
    entity_id uuid NOT NULL,
    action character varying(30) NOT NULL,
    actor_user_id uuid,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL,
    before_data jsonb,
    after_data jsonb,
    request_id character varying(120)
);


ALTER TABLE essen_wissen.audit_log OWNER TO essen_wissen_admin;

--
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE essen_wissen.audit_log ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME essen_wissen.audit_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: contacts; Type: TABLE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TABLE essen_wissen.contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institution_id uuid,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    function_title character varying(160),
    phone character varying(60),
    mobile_phone character varying(60),
    email public.citext,
    notes text,
    consent_status essen_wissen.consent_status DEFAULT 'unknown'::essen_wissen.consent_status NOT NULL,
    consent_recorded_at timestamp with time zone,
    is_primary boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT contacts_name_check CHECK (((btrim((first_name)::text) <> ''::text) AND (btrim((last_name)::text) <> ''::text)))
);


ALTER TABLE essen_wissen.contacts OWNER TO essen_wissen_admin;

--
-- Name: event_attachments; Type: TABLE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TABLE essen_wissen.event_attachments (
    event_id uuid NOT NULL,
    attachment_id uuid NOT NULL,
    description character varying(240)
);


ALTER TABLE essen_wissen.event_attachments OWNER TO essen_wissen_admin;

--
-- Name: event_contacts; Type: TABLE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TABLE essen_wissen.event_contacts (
    event_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    contact_role character varying(80),
    is_primary boolean DEFAULT false NOT NULL
);


ALTER TABLE essen_wissen.event_contacts OWNER TO essen_wissen_admin;

--
-- Name: event_reminders; Type: TABLE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TABLE essen_wissen.event_reminders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    recipient_user_id uuid,
    recipient_email public.citext,
    channel essen_wissen.notification_channel DEFAULT 'email'::essen_wissen.notification_channel NOT NULL,
    minutes_before integer NOT NULL,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT event_reminders_minutes_check CHECK ((minutes_before >= 0)),
    CONSTRAINT event_reminders_recipient_check CHECK (((recipient_user_id IS NOT NULL) OR (recipient_email IS NOT NULL)))
);


ALTER TABLE essen_wissen.event_reminders OWNER TO essen_wissen_admin;

--
-- Name: event_resources; Type: TABLE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TABLE essen_wissen.event_resources (
    event_id uuid NOT NULL,
    resource_id uuid NOT NULL,
    is_primary boolean DEFAULT false NOT NULL
);


ALTER TABLE essen_wissen.event_resources OWNER TO essen_wissen_admin;

--
-- Name: event_series; Type: TABLE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TABLE essen_wissen.event_series (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    frequency character varying(20) NOT NULL,
    rrule text NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    repeat_until timestamp with time zone,
    timezone character varying(64) DEFAULT 'Europe/Berlin'::character varying NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT event_series_frequency_check CHECK (((frequency)::text = ANY ((ARRAY['weekly'::character varying, 'monthly'::character varying, 'yearly'::character varying, 'custom'::character varying])::text[]))),
    CONSTRAINT event_series_until_check CHECK (((repeat_until IS NULL) OR (repeat_until >= starts_at)))
);


ALTER TABLE essen_wissen.event_series OWNER TO essen_wissen_admin;

--
-- Name: events; Type: TABLE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TABLE essen_wissen.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    series_id uuid,
    occurrence_start timestamp with time zone,
    is_series_exception boolean DEFAULT false NOT NULL,
    title character varying(240) NOT NULL,
    public_title character varying(240),
    description text,
    public_description text,
    event_type essen_wissen.event_type NOT NULL,
    status essen_wissen.event_status DEFAULT 'request'::essen_wissen.event_status NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    all_day boolean DEFAULT false NOT NULL,
    timezone character varying(64) DEFAULT 'Europe/Berlin'::character varying NOT NULL,
    institution_id uuid,
    location_id uuid,
    expected_children integer DEFAULT 0 NOT NULL,
    expected_companions integer DEFAULT 0 NOT NULL,
    target_group character varying(240),
    topic character varying(240),
    internal_notes text,
    visibility essen_wissen.event_visibility DEFAULT 'internal'::essen_wissen.event_visibility NOT NULL,
    show_public_status boolean DEFAULT true NOT NULL,
    public_released_at timestamp with time zone,
    public_released_by uuid,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    CONSTRAINT events_participants_check CHECK (((expected_children >= 0) AND (expected_companions >= 0))),
    CONSTRAINT events_public_title_check CHECK (((public_title IS NULL) OR (btrim((public_title)::text) <> ''::text))),
    CONSTRAINT events_range_check CHECK ((ends_at > starts_at)),
    CONSTRAINT events_series_occurrence_check CHECK ((((series_id IS NULL) AND (occurrence_start IS NULL)) OR ((series_id IS NOT NULL) AND (occurrence_start IS NOT NULL)))),
    CONSTRAINT events_timezone_check CHECK ((btrim((timezone)::text) <> ''::text)),
    CONSTRAINT events_title_check CHECK ((btrim((title)::text) <> ''::text))
);


ALTER TABLE essen_wissen.events OWNER TO essen_wissen_admin;

--
-- Name: federal_states; Type: TABLE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TABLE essen_wissen.federal_states (
    code character(2) NOT NULL,
    name character varying(80) NOT NULL
);


ALTER TABLE essen_wissen.federal_states OWNER TO essen_wissen_admin;

--
-- Name: locations; Type: TABLE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TABLE essen_wissen.locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institution_id uuid,
    federal_state_code character(2) NOT NULL,
    postal_code character varying(10) NOT NULL,
    city character varying(120) NOT NULL,
    district character varying(120),
    street character varying(180),
    house_number character varying(30),
    building_room character varying(180),
    arrival_notes text,
    parking_notes text,
    latitude numeric(9,6),
    longitude numeric(9,6),
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT locations_city_check CHECK ((btrim((city)::text) <> ''::text)),
    CONSTRAINT locations_latitude_check CHECK (((latitude IS NULL) OR ((latitude >= ('-90'::integer)::numeric) AND (latitude <= (90)::numeric)))),
    CONSTRAINT locations_longitude_check CHECK (((longitude IS NULL) OR ((longitude >= ('-180'::integer)::numeric) AND (longitude <= (180)::numeric)))),
    CONSTRAINT locations_postal_code_check CHECK ((btrim((postal_code)::text) <> ''::text))
);


ALTER TABLE essen_wissen.locations OWNER TO essen_wissen_admin;

--
-- Name: event_statistics_by_federal_state; Type: VIEW; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE VIEW essen_wissen.event_statistics_by_federal_state AS
 SELECT (EXTRACT(year FROM (e.starts_at AT TIME ZONE e.timezone)))::integer AS year,
    fs.code AS federal_state_code,
    fs.name AS federal_state,
    count(*) AS event_count,
    count(*) FILTER (WHERE (e.event_type = 'bus'::essen_wissen.event_type)) AS bus_event_count,
    count(*) FILTER (WHERE (e.event_type = 'kitchen'::essen_wissen.event_type)) AS kitchen_event_count,
    COALESCE(sum(e.expected_children), (0)::bigint) AS expected_children
   FROM ((essen_wissen.events e
     JOIN essen_wissen.locations l ON ((l.id = e.location_id)))
     JOIN essen_wissen.federal_states fs ON ((fs.code = l.federal_state_code)))
  WHERE (e.deleted_at IS NULL)
  GROUP BY ((EXTRACT(year FROM (e.starts_at AT TIME ZONE e.timezone)))::integer), fs.code, fs.name;


ALTER VIEW essen_wissen.event_statistics_by_federal_state OWNER TO essen_wissen_admin;

--
-- Name: event_subscriptions; Type: TABLE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TABLE essen_wissen.event_subscriptions (
    user_id uuid NOT NULL,
    event_id uuid NOT NULL,
    notify_on_change boolean DEFAULT true NOT NULL,
    notify_on_status boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE essen_wissen.event_subscriptions OWNER TO essen_wissen_admin;

--
-- Name: event_yearly_statistics; Type: VIEW; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE VIEW essen_wissen.event_yearly_statistics AS
 SELECT (EXTRACT(year FROM (starts_at AT TIME ZONE timezone)))::integer AS year,
    count(*) FILTER (WHERE (event_type = 'bus'::essen_wissen.event_type)) AS bus_events,
    count(*) FILTER (WHERE (event_type = 'kitchen'::essen_wissen.event_type)) AS kitchen_events,
    count(DISTINCT institution_id) AS institutions_reached,
    COALESCE(sum(expected_children), (0)::bigint) AS expected_children,
    COALESCE(sum(expected_companions), (0)::bigint) AS expected_companions,
    count(*) FILTER (WHERE (status = 'confirmed'::essen_wissen.event_status)) AS confirmed_events,
    count(*) FILTER (WHERE (status = 'planned'::essen_wissen.event_status)) AS planned_events,
    count(*) FILTER (WHERE (status = 'cancelled'::essen_wissen.event_status)) AS cancelled_events
   FROM essen_wissen.events e
  WHERE (deleted_at IS NULL)
  GROUP BY ((EXTRACT(year FROM (starts_at AT TIME ZONE timezone)))::integer);


ALTER VIEW essen_wissen.event_yearly_statistics OWNER TO essen_wissen_admin;

--
-- Name: institutions; Type: TABLE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TABLE essen_wissen.institutions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institution_type essen_wissen.institution_type NOT NULL,
    name character varying(240) NOT NULL,
    central_phone character varying(60),
    central_email public.citext,
    notes text,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT institutions_name_check CHECK ((btrim((name)::text) <> ''::text))
);


ALTER TABLE essen_wissen.institutions OWNER TO essen_wissen_admin;

--
-- Name: internal_calendar_events; Type: VIEW; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE VIEW essen_wissen.internal_calendar_events AS
 SELECT e.id,
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
   FROM (((essen_wissen.events e
     LEFT JOIN essen_wissen.institutions i ON ((i.id = e.institution_id)))
     LEFT JOIN essen_wissen.locations l ON ((l.id = e.location_id)))
     LEFT JOIN essen_wissen.federal_states fs ON ((fs.code = l.federal_state_code)));


ALTER VIEW essen_wissen.internal_calendar_events OWNER TO essen_wissen_admin;

--
-- Name: permissions; Type: TABLE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TABLE essen_wissen.permissions (
    code character varying(100) NOT NULL,
    label character varying(160) NOT NULL,
    description text
);


ALTER TABLE essen_wissen.permissions OWNER TO essen_wissen_admin;

--
-- Name: public_calendar_events; Type: VIEW; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE VIEW essen_wissen.public_calendar_events AS
 SELECT e.id,
    COALESCE(NULLIF((e.public_title)::text, ''::text), (e.title)::text) AS title,
    e.starts_at,
    e.ends_at,
    e.all_day,
    e.timezone,
    e.event_type,
        CASE
            WHEN e.show_public_status THEN (e.status)::text
            ELSE NULL::text
        END AS status,
    i.name AS institution_name,
    l.city,
    fs.name AS federal_state,
    e.public_description AS description
   FROM (((essen_wissen.events e
     LEFT JOIN essen_wissen.institutions i ON (((i.id = e.institution_id) AND (i.deleted_at IS NULL))))
     LEFT JOIN essen_wissen.locations l ON ((l.id = e.location_id)))
     LEFT JOIN essen_wissen.federal_states fs ON ((fs.code = l.federal_state_code)))
  WHERE ((e.deleted_at IS NULL) AND (e.visibility = ANY (ARRAY['public'::essen_wissen.event_visibility, 'partial_public'::essen_wissen.event_visibility])));


ALTER VIEW essen_wissen.public_calendar_events OWNER TO essen_wissen_admin;

--
-- Name: resource_bookings; Type: TABLE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TABLE essen_wissen.resource_bookings (
    event_id uuid NOT NULL,
    resource_id uuid NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    blocks boolean DEFAULT true NOT NULL,
    time_range tstzrange GENERATED ALWAYS AS (tstzrange(starts_at, ends_at, '[)'::text)) STORED,
    CONSTRAINT resource_bookings_range_check CHECK ((ends_at > starts_at))
);


ALTER TABLE essen_wissen.resource_bookings OWNER TO essen_wissen_admin;

--
-- Name: resource_unavailability; Type: TABLE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TABLE essen_wissen.resource_unavailability (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    resource_id uuid NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    reason character varying(240) NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT resource_unavailability_range_check CHECK ((ends_at > starts_at)),
    CONSTRAINT resource_unavailability_reason_check CHECK ((btrim((reason)::text) <> ''::text))
);


ALTER TABLE essen_wissen.resource_unavailability OWNER TO essen_wissen_admin;

--
-- Name: resources; Type: TABLE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TABLE essen_wissen.resources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(160) NOT NULL,
    resource_type essen_wissen.resource_type NOT NULL,
    description text,
    status essen_wissen.resource_status DEFAULT 'active'::essen_wissen.resource_status NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT resources_name_check CHECK ((btrim((name)::text) <> ''::text))
);


ALTER TABLE essen_wissen.resources OWNER TO essen_wissen_admin;

--
-- Name: role_permissions; Type: TABLE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TABLE essen_wissen.role_permissions (
    role_code character varying(50) NOT NULL,
    permission_code character varying(100) NOT NULL
);


ALTER TABLE essen_wissen.role_permissions OWNER TO essen_wissen_admin;

--
-- Name: roles; Type: TABLE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TABLE essen_wissen.roles (
    code character varying(50) NOT NULL,
    label character varying(120) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE essen_wissen.roles OWNER TO essen_wissen_admin;

--
-- Name: user_roles; Type: TABLE; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TABLE essen_wissen.user_roles (
    user_id uuid NOT NULL,
    role_code character varying(50) NOT NULL,
    assigned_by uuid,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE essen_wissen.user_roles OWNER TO essen_wissen_admin;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: essen_wissen_admin
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    refresh_hash text NOT NULL,
    issued_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    user_agent text,
    ip_address inet
);


ALTER TABLE public.sessions OWNER TO essen_wissen_admin;

--
-- Data for Name: app_users; Type: TABLE DATA; Schema: essen_wissen; Owner: essen_wissen_admin
--

COPY essen_wissen.app_users (id, email, password_hash, auth_provider, first_name, last_name, is_active, last_login_at, created_at, updated_at) FROM stdin;
7a7d7d37-ddaf-4af0-afb1-1c3d4a856633	test@example.com	scrypt$7a94e9fb6bfa1ad69406eab408eb2982$dea35cdb9309c774b524a4c008cc656b36ae4a465d28fbfa7353987c131a85c01da9f0de870f1dad5c54d4cd1f00953bdd3745fcbf35e20f5348f7626526115d	local	Test	User	t	2026-09-06 16:54:19.849109+00	2026-09-06 16:49:20.640778+00	2026-09-06 16:54:19.849109+00
\.


--
-- Data for Name: attachments; Type: TABLE DATA; Schema: essen_wissen; Owner: essen_wissen_admin
--

COPY essen_wissen.attachments (id, original_name, storage_key, media_type, size_bytes, sha256_hex, uploaded_by, created_at) FROM stdin;
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: essen_wissen; Owner: essen_wissen_admin
--

COPY essen_wissen.audit_log (id, entity_type, entity_id, action, actor_user_id, occurred_at, before_data, after_data, request_id) FROM stdin;
\.


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: essen_wissen; Owner: essen_wissen_admin
--

COPY essen_wissen.contacts (id, institution_id, first_name, last_name, function_title, phone, mobile_phone, email, notes, consent_status, consent_recorded_at, is_primary, is_active, created_by, updated_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: event_attachments; Type: TABLE DATA; Schema: essen_wissen; Owner: essen_wissen_admin
--

COPY essen_wissen.event_attachments (event_id, attachment_id, description) FROM stdin;
\.


--
-- Data for Name: event_contacts; Type: TABLE DATA; Schema: essen_wissen; Owner: essen_wissen_admin
--

COPY essen_wissen.event_contacts (event_id, contact_id, contact_role, is_primary) FROM stdin;
\.


--
-- Data for Name: event_reminders; Type: TABLE DATA; Schema: essen_wissen; Owner: essen_wissen_admin
--

COPY essen_wissen.event_reminders (id, event_id, recipient_user_id, recipient_email, channel, minutes_before, sent_at, created_at) FROM stdin;
\.


--
-- Data for Name: event_resources; Type: TABLE DATA; Schema: essen_wissen; Owner: essen_wissen_admin
--

COPY essen_wissen.event_resources (event_id, resource_id, is_primary) FROM stdin;
\.


--
-- Data for Name: event_series; Type: TABLE DATA; Schema: essen_wissen; Owner: essen_wissen_admin
--

COPY essen_wissen.event_series (id, frequency, rrule, starts_at, repeat_until, timezone, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: event_subscriptions; Type: TABLE DATA; Schema: essen_wissen; Owner: essen_wissen_admin
--

COPY essen_wissen.event_subscriptions (user_id, event_id, notify_on_change, notify_on_status, created_at) FROM stdin;
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: essen_wissen; Owner: essen_wissen_admin
--

COPY essen_wissen.events (id, series_id, occurrence_start, is_series_exception, title, public_title, description, public_description, event_type, status, starts_at, ends_at, all_day, timezone, institution_id, location_id, expected_children, expected_companions, target_group, topic, internal_notes, visibility, show_public_status, public_released_at, public_released_by, created_by, updated_by, created_at, updated_at, deleted_at, deleted_by) FROM stdin;
\.


--
-- Data for Name: federal_states; Type: TABLE DATA; Schema: essen_wissen; Owner: essen_wissen_admin
--

COPY essen_wissen.federal_states (code, name) FROM stdin;
BW	Baden-W├╝rttemberg
BY	Bayern
BE	Berlin
BB	Brandenburg
HB	Bremen
HH	Hamburg
HE	Hessen
MV	Mecklenburg-Vorpommern
NI	Niedersachsen
NW	Nordrhein-Westfalen
RP	Rheinland-Pfalz
SL	Saarland
SN	Sachsen
ST	Sachsen-Anhalt
SH	Schleswig-Holstein
TH	Th├╝ringen
\.


--
-- Data for Name: institutions; Type: TABLE DATA; Schema: essen_wissen; Owner: essen_wissen_admin
--

COPY essen_wissen.institutions (id, institution_type, name, central_phone, central_email, notes, created_by, updated_by, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: essen_wissen; Owner: essen_wissen_admin
--

COPY essen_wissen.locations (id, institution_id, federal_state_code, postal_code, city, district, street, house_number, building_room, arrival_notes, parking_notes, latitude, longitude, is_primary, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: essen_wissen; Owner: essen_wissen_admin
--

COPY essen_wissen.permissions (code, label, description) FROM stdin;
calendar.read_public	├ûffentlichen Kalender lesen	Freigegebene Termine lesen.
calendar.read_internal	Internen Kalender lesen	Alle internen Termindaten lesen.
event.create	Veranstaltungen anlegen	Einzeltermine und Serien anlegen.
event.update	Veranstaltungen bearbeiten	Termine bearbeiten oder verschieben.
event.delete	Veranstaltungen l├Âschen	Termine l├Âschen oder archivieren.
event.publish	Veranstaltungen freigeben	Termine ├Âffentlich schalten.
event.export	Termine exportieren	ICS-, CSV- und PDF-Exporte ausf├╝hren.
user.manage	Benutzer verwalten	Benutzer und Rollen verwalten.
settings.manage	Systemeinstellungen verwalten	Ressourcen und Stammdaten verwalten.
\.


--
-- Data for Name: resource_bookings; Type: TABLE DATA; Schema: essen_wissen; Owner: essen_wissen_admin
--

COPY essen_wissen.resource_bookings (event_id, resource_id, starts_at, ends_at, blocks) FROM stdin;
\.


--
-- Data for Name: resource_unavailability; Type: TABLE DATA; Schema: essen_wissen; Owner: essen_wissen_admin
--

COPY essen_wissen.resource_unavailability (id, resource_id, starts_at, ends_at, reason, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: resources; Type: TABLE DATA; Schema: essen_wissen; Owner: essen_wissen_admin
--

COPY essen_wissen.resources (id, name, resource_type, description, status, created_by, updated_by, created_at, updated_at) FROM stdin;
0c42202e-398b-4c5a-b94f-1b5e8f61deaa	Essen-Wissen Bus	bus	Mobiler Bus f├╝r Eins├ñtze au├ƒerhalb der Stiftung.	active	\N	\N	2026-09-06 16:47:34.214866+00	2026-09-06 16:47:34.214866+00
713cd70f-a65f-4026-b7ba-6cc981f0309f	Stiftungsk├╝che	kitchen	Koch- und Schulungszentrum der Stiftung.	active	\N	\N	2026-09-06 16:47:34.214866+00	2026-09-06 16:47:34.214866+00
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: essen_wissen; Owner: essen_wissen_admin
--

COPY essen_wissen.role_permissions (role_code, permission_code) FROM stdin;
administrator	calendar.read_public
administrator	calendar.read_internal
administrator	event.create
administrator	event.update
administrator	event.delete
administrator	event.publish
administrator	event.export
administrator	user.manage
administrator	settings.manage
stiftungsteam	calendar.read_internal
stiftungsteam	event.create
stiftungsteam	event.update
stiftungsteam	event.export
internal_reader	calendar.read_internal
public_visitor	calendar.read_public
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: essen_wissen; Owner: essen_wissen_admin
--

COPY essen_wissen.roles (code, label, description, created_at) FROM stdin;
administrator	Administrator	Vollst├ñndiger Zugriff einschlie├ƒlich Benutzerverwaltung.	2026-09-06 16:47:34.214866+00
stiftungsteam	Stiftungsteam	Veranstaltungen anlegen und bearbeiten; interne Daten lesen.	2026-09-06 16:47:34.214866+00
internal_reader	Leseberechtigter interner Nutzer	Interne Kalenderansicht ohne Bearbeitungsrechte.	2026-09-06 16:47:34.214866+00
public_visitor	├ûffentlicher Besucher	Nur freigegebene ├Âffentliche Informationen.	2026-09-06 16:47:34.214866+00
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: essen_wissen; Owner: essen_wissen_admin
--

COPY essen_wissen.user_roles (user_id, role_code, assigned_by, assigned_at) FROM stdin;
7a7d7d37-ddaf-4af0-afb1-1c3d4a856633	administrator	\N	2026-09-06 16:49:42.49319+00
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: essen_wissen_admin
--

COPY public.sessions (id, user_id, refresh_hash, issued_at, expires_at, revoked_at, user_agent, ip_address) FROM stdin;
\.


--
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: essen_wissen; Owner: essen_wissen_admin
--

SELECT pg_catalog.setval('essen_wissen.audit_log_id_seq', 1, false);


--
-- Name: app_users app_users_email_key; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.app_users
    ADD CONSTRAINT app_users_email_key UNIQUE (email);


--
-- Name: app_users app_users_pkey; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.app_users
    ADD CONSTRAINT app_users_pkey PRIMARY KEY (id);


--
-- Name: attachments attachments_pkey; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.attachments
    ADD CONSTRAINT attachments_pkey PRIMARY KEY (id);


--
-- Name: attachments attachments_storage_key_key; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.attachments
    ADD CONSTRAINT attachments_storage_key_key UNIQUE (storage_key);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: event_attachments event_attachments_pkey; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.event_attachments
    ADD CONSTRAINT event_attachments_pkey PRIMARY KEY (event_id, attachment_id);


--
-- Name: event_contacts event_contacts_pkey; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.event_contacts
    ADD CONSTRAINT event_contacts_pkey PRIMARY KEY (event_id, contact_id);


--
-- Name: event_reminders event_reminders_pkey; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.event_reminders
    ADD CONSTRAINT event_reminders_pkey PRIMARY KEY (id);


--
-- Name: event_resources event_resources_pkey; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.event_resources
    ADD CONSTRAINT event_resources_pkey PRIMARY KEY (event_id, resource_id);


--
-- Name: event_series event_series_pkey; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.event_series
    ADD CONSTRAINT event_series_pkey PRIMARY KEY (id);


--
-- Name: event_subscriptions event_subscriptions_pkey; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.event_subscriptions
    ADD CONSTRAINT event_subscriptions_pkey PRIMARY KEY (user_id, event_id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: federal_states federal_states_name_key; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.federal_states
    ADD CONSTRAINT federal_states_name_key UNIQUE (name);


--
-- Name: federal_states federal_states_pkey; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.federal_states
    ADD CONSTRAINT federal_states_pkey PRIMARY KEY (code);


--
-- Name: institutions institutions_pkey; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.institutions
    ADD CONSTRAINT institutions_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (code);


--
-- Name: resource_bookings resource_bookings_no_overlap; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.resource_bookings
    ADD CONSTRAINT resource_bookings_no_overlap EXCLUDE USING gist (resource_id WITH =, time_range WITH &&) WHERE (blocks);


--
-- Name: resource_bookings resource_bookings_pkey; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.resource_bookings
    ADD CONSTRAINT resource_bookings_pkey PRIMARY KEY (event_id, resource_id);


--
-- Name: resource_unavailability resource_unavailability_pkey; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.resource_unavailability
    ADD CONSTRAINT resource_unavailability_pkey PRIMARY KEY (id);


--
-- Name: resources resources_name_key; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.resources
    ADD CONSTRAINT resources_name_key UNIQUE (name);


--
-- Name: resources resources_pkey; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_code, permission_code);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (code);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_code);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: essen_wissen_admin
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: audit_log_entity_idx; Type: INDEX; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE INDEX audit_log_entity_idx ON essen_wissen.audit_log USING btree (entity_type, entity_id, occurred_at DESC);


--
-- Name: contacts_name_idx; Type: INDEX; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE INDEX contacts_name_idx ON essen_wissen.contacts USING btree (lower((last_name)::text), lower((first_name)::text));


--
-- Name: contacts_one_primary_per_institution; Type: INDEX; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE UNIQUE INDEX contacts_one_primary_per_institution ON essen_wissen.contacts USING btree (institution_id) WHERE (is_primary AND is_active AND (institution_id IS NOT NULL));


--
-- Name: event_contacts_one_primary; Type: INDEX; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE UNIQUE INDEX event_contacts_one_primary ON essen_wissen.event_contacts USING btree (event_id) WHERE is_primary;


--
-- Name: event_reminders_pending_idx; Type: INDEX; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE INDEX event_reminders_pending_idx ON essen_wissen.event_reminders USING btree (event_id, sent_at) WHERE (sent_at IS NULL);


--
-- Name: event_resources_one_primary; Type: INDEX; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE UNIQUE INDEX event_resources_one_primary ON essen_wissen.event_resources USING btree (event_id) WHERE is_primary;


--
-- Name: events_active_start_idx; Type: INDEX; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE INDEX events_active_start_idx ON essen_wissen.events USING btree (starts_at) WHERE (deleted_at IS NULL);


--
-- Name: events_city_trgm_idx; Type: INDEX; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE INDEX events_city_trgm_idx ON essen_wissen.locations USING gin (city public.gin_trgm_ops);


--
-- Name: events_end_idx; Type: INDEX; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE INDEX events_end_idx ON essen_wissen.events USING btree (ends_at);


--
-- Name: events_institution_idx; Type: INDEX; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE INDEX events_institution_idx ON essen_wissen.events USING btree (institution_id);


--
-- Name: events_location_idx; Type: INDEX; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE INDEX events_location_idx ON essen_wissen.events USING btree (location_id);


--
-- Name: events_search_idx; Type: INDEX; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE INDEX events_search_idx ON essen_wissen.events USING gin (to_tsvector('german'::regconfig, (((((((((((((COALESCE(title, ''::character varying))::text || ' '::text) || (COALESCE(public_title, ''::character varying))::text) || ' '::text) || COALESCE(description, ''::text)) || ' '::text) || COALESCE(public_description, ''::text)) || ' '::text) || (COALESCE(topic, ''::character varying))::text) || ' '::text) || (COALESCE(target_group, ''::character varying))::text) || ' '::text) || COALESCE(internal_notes, ''::text))));


--
-- Name: events_series_occurrence_unique; Type: INDEX; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE UNIQUE INDEX events_series_occurrence_unique ON essen_wissen.events USING btree (series_id, occurrence_start) WHERE ((series_id IS NOT NULL) AND (occurrence_start IS NOT NULL));


--
-- Name: events_start_idx; Type: INDEX; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE INDEX events_start_idx ON essen_wissen.events USING btree (starts_at);


--
-- Name: events_title_trgm_idx; Type: INDEX; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE INDEX events_title_trgm_idx ON essen_wissen.events USING gin (title public.gin_trgm_ops);


--
-- Name: events_type_status_idx; Type: INDEX; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE INDEX events_type_status_idx ON essen_wissen.events USING btree (event_type, status);


--
-- Name: events_visibility_start_idx; Type: INDEX; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE INDEX events_visibility_start_idx ON essen_wissen.events USING btree (visibility, starts_at);


--
-- Name: institutions_name_idx; Type: INDEX; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE INDEX institutions_name_idx ON essen_wissen.institutions USING btree (lower((name)::text)) WHERE (deleted_at IS NULL);


--
-- Name: locations_city_idx; Type: INDEX; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE INDEX locations_city_idx ON essen_wissen.locations USING btree (lower((city)::text));


--
-- Name: locations_one_primary_per_institution; Type: INDEX; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE UNIQUE INDEX locations_one_primary_per_institution ON essen_wissen.locations USING btree (institution_id) WHERE (is_primary AND (institution_id IS NOT NULL));


--
-- Name: locations_state_idx; Type: INDEX; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE INDEX locations_state_idx ON essen_wissen.locations USING btree (federal_state_code);


--
-- Name: resource_bookings_resource_idx; Type: INDEX; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE INDEX resource_bookings_resource_idx ON essen_wissen.resource_bookings USING btree (resource_id, starts_at, ends_at);


--
-- Name: resource_unavailability_idx; Type: INDEX; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE INDEX resource_unavailability_idx ON essen_wissen.resource_unavailability USING btree (resource_id, starts_at, ends_at);


--
-- Name: sessions_user_active_idx; Type: INDEX; Schema: public; Owner: essen_wissen_admin
--

CREATE INDEX sessions_user_active_idx ON public.sessions USING btree (user_id) WHERE (revoked_at IS NULL);


--
-- Name: app_users app_users_set_updated_at; Type: TRIGGER; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TRIGGER app_users_set_updated_at BEFORE UPDATE ON essen_wissen.app_users FOR EACH ROW EXECUTE FUNCTION essen_wissen.set_updated_at();


--
-- Name: contacts contacts_set_updated_at; Type: TRIGGER; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TRIGGER contacts_set_updated_at BEFORE UPDATE ON essen_wissen.contacts FOR EACH ROW EXECUTE FUNCTION essen_wissen.set_updated_at();


--
-- Name: event_resources event_resources_sync_booking; Type: TRIGGER; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TRIGGER event_resources_sync_booking AFTER INSERT OR DELETE OR UPDATE ON essen_wissen.event_resources FOR EACH ROW EXECUTE FUNCTION essen_wissen.sync_booking_from_event_resource();


--
-- Name: events events_audit; Type: TRIGGER; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TRIGGER events_audit AFTER INSERT OR DELETE OR UPDATE ON essen_wissen.events FOR EACH ROW EXECUTE FUNCTION essen_wissen.audit_event_changes();


--
-- Name: events events_set_updated_at; Type: TRIGGER; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TRIGGER events_set_updated_at BEFORE UPDATE ON essen_wissen.events FOR EACH ROW EXECUTE FUNCTION essen_wissen.set_updated_at();


--
-- Name: events events_sync_bookings; Type: TRIGGER; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TRIGGER events_sync_bookings AFTER UPDATE OF starts_at, ends_at, status, deleted_at ON essen_wissen.events FOR EACH ROW EXECUTE FUNCTION essen_wissen.sync_bookings_from_event();


--
-- Name: institutions institutions_set_updated_at; Type: TRIGGER; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TRIGGER institutions_set_updated_at BEFORE UPDATE ON essen_wissen.institutions FOR EACH ROW EXECUTE FUNCTION essen_wissen.set_updated_at();


--
-- Name: locations locations_set_updated_at; Type: TRIGGER; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TRIGGER locations_set_updated_at BEFORE UPDATE ON essen_wissen.locations FOR EACH ROW EXECUTE FUNCTION essen_wissen.set_updated_at();


--
-- Name: resources resources_set_updated_at; Type: TRIGGER; Schema: essen_wissen; Owner: essen_wissen_admin
--

CREATE TRIGGER resources_set_updated_at BEFORE UPDATE ON essen_wissen.resources FOR EACH ROW EXECUTE FUNCTION essen_wissen.set_updated_at();


--
-- Name: attachments attachments_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.attachments
    ADD CONSTRAINT attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES essen_wissen.app_users(id) ON DELETE SET NULL;


--
-- Name: audit_log audit_log_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.audit_log
    ADD CONSTRAINT audit_log_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES essen_wissen.app_users(id) ON DELETE SET NULL;


--
-- Name: contacts contacts_created_by_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.contacts
    ADD CONSTRAINT contacts_created_by_fkey FOREIGN KEY (created_by) REFERENCES essen_wissen.app_users(id) ON DELETE SET NULL;


--
-- Name: contacts contacts_institution_id_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.contacts
    ADD CONSTRAINT contacts_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES essen_wissen.institutions(id) ON DELETE SET NULL;


--
-- Name: contacts contacts_updated_by_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.contacts
    ADD CONSTRAINT contacts_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES essen_wissen.app_users(id) ON DELETE SET NULL;


--
-- Name: event_attachments event_attachments_attachment_id_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.event_attachments
    ADD CONSTRAINT event_attachments_attachment_id_fkey FOREIGN KEY (attachment_id) REFERENCES essen_wissen.attachments(id) ON DELETE CASCADE;


--
-- Name: event_attachments event_attachments_event_id_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.event_attachments
    ADD CONSTRAINT event_attachments_event_id_fkey FOREIGN KEY (event_id) REFERENCES essen_wissen.events(id) ON DELETE CASCADE;


--
-- Name: event_contacts event_contacts_contact_id_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.event_contacts
    ADD CONSTRAINT event_contacts_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES essen_wissen.contacts(id) ON DELETE RESTRICT;


--
-- Name: event_contacts event_contacts_event_id_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.event_contacts
    ADD CONSTRAINT event_contacts_event_id_fkey FOREIGN KEY (event_id) REFERENCES essen_wissen.events(id) ON DELETE CASCADE;


--
-- Name: event_reminders event_reminders_event_id_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.event_reminders
    ADD CONSTRAINT event_reminders_event_id_fkey FOREIGN KEY (event_id) REFERENCES essen_wissen.events(id) ON DELETE CASCADE;


--
-- Name: event_reminders event_reminders_recipient_user_id_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.event_reminders
    ADD CONSTRAINT event_reminders_recipient_user_id_fkey FOREIGN KEY (recipient_user_id) REFERENCES essen_wissen.app_users(id) ON DELETE CASCADE;


--
-- Name: event_resources event_resources_event_id_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.event_resources
    ADD CONSTRAINT event_resources_event_id_fkey FOREIGN KEY (event_id) REFERENCES essen_wissen.events(id) ON DELETE CASCADE;


--
-- Name: event_resources event_resources_resource_id_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.event_resources
    ADD CONSTRAINT event_resources_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES essen_wissen.resources(id) ON DELETE RESTRICT;


--
-- Name: event_series event_series_created_by_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.event_series
    ADD CONSTRAINT event_series_created_by_fkey FOREIGN KEY (created_by) REFERENCES essen_wissen.app_users(id) ON DELETE SET NULL;


--
-- Name: event_subscriptions event_subscriptions_event_id_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.event_subscriptions
    ADD CONSTRAINT event_subscriptions_event_id_fkey FOREIGN KEY (event_id) REFERENCES essen_wissen.events(id) ON DELETE CASCADE;


--
-- Name: event_subscriptions event_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.event_subscriptions
    ADD CONSTRAINT event_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES essen_wissen.app_users(id) ON DELETE CASCADE;


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES essen_wissen.app_users(id) ON DELETE SET NULL;


--
-- Name: events events_deleted_by_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.events
    ADD CONSTRAINT events_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES essen_wissen.app_users(id) ON DELETE SET NULL;


--
-- Name: events events_institution_id_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.events
    ADD CONSTRAINT events_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES essen_wissen.institutions(id) ON DELETE SET NULL;


--
-- Name: events events_location_id_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.events
    ADD CONSTRAINT events_location_id_fkey FOREIGN KEY (location_id) REFERENCES essen_wissen.locations(id) ON DELETE SET NULL;


--
-- Name: events events_public_released_by_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.events
    ADD CONSTRAINT events_public_released_by_fkey FOREIGN KEY (public_released_by) REFERENCES essen_wissen.app_users(id) ON DELETE SET NULL;


--
-- Name: events events_series_id_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.events
    ADD CONSTRAINT events_series_id_fkey FOREIGN KEY (series_id) REFERENCES essen_wissen.event_series(id) ON DELETE SET NULL;


--
-- Name: events events_updated_by_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.events
    ADD CONSTRAINT events_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES essen_wissen.app_users(id) ON DELETE SET NULL;


--
-- Name: institutions institutions_created_by_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.institutions
    ADD CONSTRAINT institutions_created_by_fkey FOREIGN KEY (created_by) REFERENCES essen_wissen.app_users(id) ON DELETE SET NULL;


--
-- Name: institutions institutions_updated_by_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.institutions
    ADD CONSTRAINT institutions_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES essen_wissen.app_users(id) ON DELETE SET NULL;


--
-- Name: locations locations_federal_state_code_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.locations
    ADD CONSTRAINT locations_federal_state_code_fkey FOREIGN KEY (federal_state_code) REFERENCES essen_wissen.federal_states(code);


--
-- Name: locations locations_institution_id_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.locations
    ADD CONSTRAINT locations_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES essen_wissen.institutions(id) ON DELETE CASCADE;


--
-- Name: resource_bookings resource_bookings_event_id_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.resource_bookings
    ADD CONSTRAINT resource_bookings_event_id_fkey FOREIGN KEY (event_id) REFERENCES essen_wissen.events(id) ON DELETE CASCADE;


--
-- Name: resource_bookings resource_bookings_resource_id_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.resource_bookings
    ADD CONSTRAINT resource_bookings_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES essen_wissen.resources(id) ON DELETE RESTRICT;


--
-- Name: resource_unavailability resource_unavailability_created_by_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.resource_unavailability
    ADD CONSTRAINT resource_unavailability_created_by_fkey FOREIGN KEY (created_by) REFERENCES essen_wissen.app_users(id) ON DELETE SET NULL;


--
-- Name: resource_unavailability resource_unavailability_resource_id_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.resource_unavailability
    ADD CONSTRAINT resource_unavailability_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES essen_wissen.resources(id) ON DELETE CASCADE;


--
-- Name: resources resources_created_by_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.resources
    ADD CONSTRAINT resources_created_by_fkey FOREIGN KEY (created_by) REFERENCES essen_wissen.app_users(id) ON DELETE SET NULL;


--
-- Name: resources resources_updated_by_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.resources
    ADD CONSTRAINT resources_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES essen_wissen.app_users(id) ON DELETE SET NULL;


--
-- Name: role_permissions role_permissions_permission_code_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.role_permissions
    ADD CONSTRAINT role_permissions_permission_code_fkey FOREIGN KEY (permission_code) REFERENCES essen_wissen.permissions(code) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_code_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.role_permissions
    ADD CONSTRAINT role_permissions_role_code_fkey FOREIGN KEY (role_code) REFERENCES essen_wissen.roles(code) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_assigned_by_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.user_roles
    ADD CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES essen_wissen.app_users(id) ON DELETE SET NULL;


--
-- Name: user_roles user_roles_role_code_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.user_roles
    ADD CONSTRAINT user_roles_role_code_fkey FOREIGN KEY (role_code) REFERENCES essen_wissen.roles(code) ON DELETE RESTRICT;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: essen_wissen; Owner: essen_wissen_admin
--

ALTER TABLE ONLY essen_wissen.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES essen_wissen.app_users(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: essen_wissen_admin
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES essen_wissen.app_users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Dh5157s3uppc3jxw2fpysevDzXmkN1sr9xjEYljWI1zUerduYeH3PEGBVQq3zQJ

