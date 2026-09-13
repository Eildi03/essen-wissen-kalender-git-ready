-- migrate:up
-- 004_add_roles.sql
-- Rollen für Migration und Runtime
--
-- essen_wissen_admin wird bereits von Postgres selbst als POSTGRES_USER
-- angelegt (siehe compose.yaml) und daher hier nicht erneut erstellt.

CREATE ROLE essen_wissen_api LOGIN;

-- Passwörter werden ausserhalb gesetzt (z. B. per ALTER ROLE im Betrieb),
-- oder in dieser Migration mit Platzhaltern, die per CI ersetzt werden.

REVOKE ALL ON SCHEMA essen_wissen FROM PUBLIC;
GRANT USAGE ON SCHEMA essen_wissen TO essen_wissen_api;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA essen_wissen TO essen_wissen_api;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA essen_wissen TO essen_wissen_api;

ALTER DEFAULT PRIVILEGES IN SCHEMA essen_wissen
  GRANT SELECT, INSERT, UPDATE ON TABLES TO essen_wissen_api;
