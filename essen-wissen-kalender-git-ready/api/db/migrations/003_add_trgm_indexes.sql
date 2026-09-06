-- 003_add_trgm_indexes.sql
-- Leistungsverbesserung für Suchabfragen

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX events_title_trgm_idx
  ON essen_wissen.events USING gin (title gin_trgm_ops);

CREATE INDEX events_city_trgm_idx
  ON essen_wissen.locations USING gin (city gin_trgm_ops);