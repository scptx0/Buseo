-- ============================================================
-- Migración 001 — Funciones para Planear Ruta (Fase 2)
-- ============================================================

-- Extensión para pg_cron (limpieza de rutas expiradas)
-- IMPORTANTE: Ejecutar en Supabase SQL Editor con permisos de superadmin
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- 0. Índices para queries de búsqueda de rutas
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_line_stops_route
  ON line_stops (line_id, direction, stop_order);

CREATE INDEX IF NOT EXISTS idx_segments_line
  ON segments (line_id, from_station);

CREATE INDEX IF NOT EXISTS idx_active_routes_user
  ON active_routes (user_id);

CREATE INDEX IF NOT EXISTS idx_active_routes_expiry
  ON active_routes (created_at)
  WHERE status = 'active';

-- ============================================================
-- 1. Listar todas las estaciones
-- ============================================================
CREATE OR REPLACE FUNCTION get_stations()
RETURNS TABLE(id INT, name TEXT, lat DOUBLE PRECISION, lng DOUBLE PRECISION)
LANGUAGE sql
STABLE
AS $$
  SELECT s.id, s.name, s.lat, s.lng
  FROM stations s
  ORDER BY s.id;
$$;

-- ============================================================
-- 2. Calcular ETA de un tramo sumando segments
-- ============================================================
CREATE OR REPLACE FUNCTION segment_eta(
  p_line_id INT,
  p_direction TEXT,
  p_from_order INT,
  p_to_order INT
)
RETURNS INT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    SUM(s.estimated_time_minutes), 0
  )
  FROM line_stops ls
  JOIN segments s ON s.from_station = ls.station_id
                  AND s.to_station = (
                    SELECT MAX(ls2.station_id)
                    FROM line_stops ls2
                    WHERE ls2.line_id = ls.line_id
                      AND ls2.direction = ls.direction
                      AND ls2.stop_order = ls.stop_order + 1
                  )
                  AND s.line_id = ls.line_id
  WHERE ls.line_id = p_line_id
    AND ls.direction = p_direction
    AND ls.stop_order >= p_from_order
    AND ls.stop_order < p_to_order;
$$;

-- ============================================================
-- 3. Obtener nodos de un tramo con duraciones reales
-- ============================================================
CREATE OR REPLACE FUNCTION get_route_nodes(
  p_line_id INT,
  p_direction TEXT,
  p_from_order INT,
  p_to_order INT
)
RETURNS TABLE(
  station_id INT,
  station_name TEXT,
  stop_order INT,
  duration_seconds INT,
  distance_meters DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT ON (ls.stop_order)
    ls.station_id,
    st.name,
    ls.stop_order,
    COALESCE(seg.duration_seconds, 0),
    COALESCE(seg.distance_meters, 0)
  FROM line_stops ls
  JOIN stations st ON st.id = ls.station_id
  LEFT JOIN line_stops ls_next ON ls_next.line_id = ls.line_id
                               AND ls_next.direction = ls.direction
                               AND ls_next.stop_order = ls.stop_order + 1
  LEFT JOIN segments seg ON seg.from_station = ls.station_id
                         AND seg.to_station = COALESCE(ls_next.station_id, ls.station_id)
                         AND seg.line_id = ls.line_id
  WHERE ls.line_id = p_line_id
    AND ls.direction = p_direction
    AND ls.stop_order >= p_from_order
    AND ls.stop_order <= p_to_order
  ORDER BY ls.stop_order, ls.station_id;
$$;

-- ============================================================
-- 4. Buscar todas las rutas posibles (directas + transbordo)
-- ============================================================
CREATE OR REPLACE FUNCTION search_all_routes(
  p_origin INT,
  p_dest INT
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  rec RECORD;
  rec2 RECORD;
  route_eta INT;
  routes jsonb := '[]'::jsonb;
  nodes jsonb;
  route_json jsonb;
BEGIN
  -- Si origen = destino, no hay ruta
  IF p_origin = p_dest THEN
    RETURN routes;
  END IF;

  -- ============================================================
  -- Rutas directas: misma línea, misma dirección, origen < destino
  -- ============================================================
  FOR rec IN
    SELECT DISTINCT
      l.id AS line_id,
      l.name AS line_name,
      ls_o.direction,
      ls_o.stop_order AS origin_order,
      ls_d.stop_order AS dest_order
    FROM line_stops ls_o
    JOIN line_stops ls_d ON ls_d.line_id = ls_o.line_id
                         AND ls_d.direction = ls_o.direction
                         AND ls_d.station_id = p_dest
    JOIN lines l ON l.id = ls_o.line_id
    WHERE ls_o.station_id = p_origin
      AND ls_o.stop_order < ls_d.stop_order
      AND EXISTS (SELECT 1 FROM segments WHERE line_id = l.id)
  LOOP
    route_eta := segment_eta(rec.line_id, rec.direction, rec.origin_order, rec.dest_order);

    IF route_eta > 0 THEN
    -- Nodos del tramo
    SELECT jsonb_agg(jsonb_build_object(
      'stationId', rn.station_id,
      'stationName', rn.station_name,
      'stopOrder', rn.stop_order,
      'durationSeconds', rn.duration_seconds,
      'distanceMeters', rn.distance_meters
    ) ORDER BY rn.stop_order) INTO nodes
    FROM get_route_nodes(rec.line_id, rec.direction, rec.origin_order, rec.dest_order) rn;

    route_json := jsonb_build_object(
      'id', gen_random_uuid()::text,
      'lineName', rec.line_name,
      'lineId', rec.line_id,
      'direction', rec.direction,
      'etaMin', route_eta,
      'transfers', 0,
      'steps', jsonb_build_array(
        jsonb_build_object(
          'lineId', rec.line_id,
          'lineName', rec.line_name,
          'direction', rec.direction,
          'fromStop', rec.origin_order,
          'toStop', rec.dest_order,
          'nodes', nodes
        )
      ),
      'alerts', '[]'::jsonb
    );

    routes := routes || route_json;
    END IF;
  END LOOP;

  -- ============================================================
  -- Rutas con transbordo: L1 origen→transbordo + L2 transbordo→destino
  -- ============================================================
  FOR rec IN
    SELECT DISTINCT
      l1.id AS line1_id,
      l1.name AS line1_name,
      ls_o.direction AS dir1,
      ls_o.stop_order AS origin_order,
      ls_t1.stop_order AS transfer_order1,
      l2.id AS line2_id,
      l2.name AS line2_name,
      ls_t2.direction AS dir2,
      ls_t2.stop_order AS transfer_order2,
      ls_d.stop_order AS dest_order,
      ls_t1.station_id AS transfer_station
    FROM line_stops ls_o
    JOIN line_stops ls_t1 ON ls_t1.line_id = ls_o.line_id
                          AND ls_t1.direction = ls_o.direction
                          AND ls_t1.stop_order > ls_o.stop_order
    JOIN line_stops ls_t2 ON ls_t2.station_id = ls_t1.station_id
                          AND ls_t2.line_id <> ls_t1.line_id
    JOIN line_stops ls_d ON ls_d.line_id = ls_t2.line_id
                         AND ls_d.direction = ls_t2.direction
                         AND ls_d.station_id = p_dest
                         AND ls_d.stop_order > ls_t2.stop_order
    JOIN lines l1 ON l1.id = ls_o.line_id
    JOIN lines l2 ON l2.id = ls_t2.line_id
    WHERE ls_o.station_id = p_origin
      AND ls_o.line_id <> ls_t2.line_id
      AND EXISTS (SELECT 1 FROM segments WHERE line_id = l1.id)
      AND EXISTS (SELECT 1 FROM segments WHERE line_id = l2.id)
    ORDER BY l1.id, l2.id
  LOOP
    route_eta := segment_eta(rec.line1_id, rec.dir1, rec.origin_order, rec.transfer_order1)
               + segment_eta(rec.line2_id, rec.dir2, rec.transfer_order2, rec.dest_order);

    IF route_eta > 0 THEN
    -- Nodos del primer tramo
    SELECT jsonb_agg(jsonb_build_object(
      'stationId', rn.station_id,
      'stationName', rn.station_name,
      'stopOrder', rn.stop_order,
      'durationSeconds', rn.duration_seconds,
      'distanceMeters', rn.distance_meters
    ) ORDER BY rn.stop_order) INTO nodes
    FROM get_route_nodes(rec.line1_id, rec.dir1, rec.origin_order, rec.transfer_order1) rn;

    route_json := jsonb_build_object(
      'id', gen_random_uuid()::text,
      'lineName', rec.line1_name || ' + ' || rec.line2_name,
      'lineId', rec.line1_id,
      'direction', rec.dir1,
      'etaMin', route_eta,
      'transfers', 1,
      'steps', jsonb_build_array(
        jsonb_build_object(
          'lineId', rec.line1_id,
          'lineName', rec.line1_name,
          'direction', rec.dir1,
          'fromStop', rec.origin_order,
          'toStop', rec.transfer_order1,
          'nodes', nodes
        ),
        jsonb_build_object(
          'lineId', rec.line2_id,
          'lineName', rec.line2_name,
          'direction', rec.dir2,
          'fromStop', rec.transfer_order2,
          'toStop', rec.dest_order,
          'nodes', (
            SELECT jsonb_agg(jsonb_build_object(
              'stationId', rn.station_id,
              'stationName', rn.station_name,
              'stopOrder', rn.stop_order,
              'durationSeconds', rn.duration_seconds,
              'distanceMeters', rn.distance_meters
            ) ORDER BY rn.stop_order)
            FROM get_route_nodes(rec.line2_id, rec.dir2, rec.transfer_order2, rec.dest_order) rn
          )
        )
      ),
      'alerts', '[]'::jsonb
    );

    routes := routes || route_json;
    END IF;
  END LOOP;

  -- Ordenar por ETA
  SELECT jsonb_agg(ordered ORDER BY (ordered->>'etaMin')::int) INTO routes
  FROM jsonb_array_elements(routes) ordered;

  RETURN COALESCE(routes, '[]'::jsonb);
END;
$$;

-- ============================================================
-- 5. Iniciar un viaje (guardar ruta activa)
-- ============================================================
CREATE OR REPLACE FUNCTION start_trip(
  p_user_id UUID,
  p_origin INT,
  p_dest INT,
  p_steps JSONB
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_id UUID;
BEGIN
  v_id := gen_random_uuid();

  INSERT INTO active_routes (id, user_id, origin, destination, steps, status, created_at)
  VALUES (v_id, p_user_id, p_origin, p_dest, p_steps, 'active', NOW());

  RETURN jsonb_build_object(
    'success', true,
    'routeId', v_id
  );
END;
$$;

-- ============================================================
-- 6. pg_cron: limpiar rutas activas expiradas (>5 horas)
-- ============================================================
-- Descomentar y ejecutar tras habilitar pg_cron:
--
-- SELECT cron.schedule(
--   'clean-expired-routes',  -- nombre del job
--   '0 * * * *',             -- cada hora (minuto 0)
--   $$ DELETE FROM active_routes WHERE created_at < NOW() - INTERVAL '5 hours' $$
-- );
