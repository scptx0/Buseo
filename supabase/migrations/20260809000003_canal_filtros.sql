-- ============================================================
-- Buseo — Migración: filtros del Canal (tipo y ubicación)
-- ============================================================
-- Los posts del canal ahora guardan datos estructurados para poder
-- filtrarlos por tipo de incidente y por ubicación:
--   report_type: 'station' | 'bus' | 'delay' | 'incident' | 'closure' | 'other'
--   station1_id: estación (o primera estación del tramo)
--   station2_id: segunda estación del tramo (NULL en reportes de estación)
-- Además, get_report_clusters expone el tipo de incidente (metadata->>'incidentType')
-- y la segunda estación del tramo (metadata->>'station2Id') para cada clúster.

ALTER TABLE feed_posts
  ADD COLUMN IF NOT EXISTS report_type TEXT,
  ADD COLUMN IF NOT EXISTS station1_id INTEGER,
  ADD COLUMN IF NOT EXISTS station2_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_feed_posts_report_type ON feed_posts(report_type);

-- RETURNS TABLE define parámetros OUT: para ampliar las columnas del resultado
-- no basta con CREATE OR REPLACE, hay que eliminar la función anterior.
DROP FUNCTION IF EXISTS get_report_clusters(integer, double precision, integer);

CREATE OR REPLACE FUNCTION get_report_clusters(p_min_reports INT DEFAULT 2, p_window_hours FLOAT DEFAULT 0.5, p_dedup_minutes INT DEFAULT 30)
RETURNS TABLE(
  target_type TEXT, target_id TEXT, report_type TEXT,
  incident_type TEXT, station2_id TEXT,
  count BIGINT, sample_descriptions TEXT[]
) LANGUAGE sql STABLE AS $$
  SELECT
    'station' as target_type, target_id, type as report_type,
    mode() WITHIN GROUP (ORDER BY metadata->>'incidentType') as incident_type,
    mode() WITHIN GROUP (ORDER BY metadata->>'station2Id') as station2_id,
    COUNT(*) as count,
    array_agg(description ORDER BY created_at DESC) FILTER (WHERE description != '') as sample_descriptions
  FROM reports r
  WHERE r.created_at > NOW() - (p_window_hours || ' hours')::INTERVAL
    AND NOT EXISTS (
      SELECT 1 FROM feed_posts fp
      WHERE fp.created_at > NOW() - (p_dedup_minutes || ' minutes')::INTERVAL
        AND (fp.content ILIKE '%' || r.target_id || '%' OR fp.tags @> ARRAY[r.target_id])
    )
  GROUP BY target_id, type
  HAVING COUNT(*) >= p_min_reports
  UNION ALL
  SELECT
    'bus', metadata->>'lineId', type,
    NULL::text, NULL::text,
    COUNT(*),
    array_agg(description ORDER BY created_at DESC) FILTER (WHERE description != '')
  FROM reports r
  WHERE r.created_at > NOW() - (p_window_hours || ' hours')::INTERVAL AND r.metadata ? 'lineId'
    AND NOT EXISTS (
      SELECT 1 FROM feed_posts fp
      WHERE fp.created_at > NOW() - (p_dedup_minutes || ' minutes')::INTERVAL
        AND (fp.content ILIKE '%' || (r.metadata->>'lineId') || '%' OR fp.tags @> ARRAY[r.metadata->>'lineId'])
    )
  GROUP BY metadata->>'lineId', type
  HAVING COUNT(*) >= p_min_reports;
$$;
