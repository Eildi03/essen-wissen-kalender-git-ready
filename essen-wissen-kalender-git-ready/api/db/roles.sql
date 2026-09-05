-- api/db/roles.sql, nach schema.sql ausfuehren
CREATE ROLE essen_wissen_api LOGIN PASSWORD :'api_password';

REVOKE ALL ON SCHEMA essen_wissen FROM PUBLIC;
GRANT USAGE ON SCHEMA essen_wissen TO essen_wissen_api;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA essen_wissen TO essen_wissen_api;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA essen_wissen TO essen_wissen_api;

-- Kein DELETE: die Anwendung nutzt ausschliesslich Soft Deletes.
ALTER DEFAULT PRIVILEGES IN SCHEMA essen_wissen
  GRANT SELECT, INSERT, UPDATE ON TABLES TO essen_wissen_api;

ALTER DEFAULT PRIVILEGES IN SCHEMA essen_wissen
  GRANT DELETE ON essen_wissen.user_roles TO essen_wissen_api; 
  