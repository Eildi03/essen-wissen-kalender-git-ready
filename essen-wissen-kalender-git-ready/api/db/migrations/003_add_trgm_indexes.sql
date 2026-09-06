-- migrate:up
-- 003_add_trgm_indexes.sql
-- Leistungsverbesserung für Suchabfragen und Volltextsuche

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS events_title_trgm_idx
  ON essen_wissen.events USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS events_city_trgm_idx
  ON essen_wissen.locations USING gin (city gin_trgm_ops);

-- Volltextsuche mit Funktionen - diese müssen nach den Basis-Tables erstellt werden
CREATE INDEX IF NOT EXISTS events_search_idx
  ON essen_wissen.events USING gin (
    to_tsvector(
      'german',
      COALESCE(title, '') || ' ' ||
      COALESCE(public_title, '') || ' ' ||
      COALESCE(description, '') || ' ' ||
      COALESCE(public_description, '') || ' ' ||
      COALESCE(topic, '') || ' ' ||
      COALESCE(target_group, '') || ' ' ||
      COALESCE(internal_notes, '')
    )
  );
