-- ============================================================
-- Buseo — Migración 08: optimizar búsqueda y limitar 2 transbordos
-- ============================================================
-- Problema: tras la migración 07, la búsqueda con 2 transbordos
-- explotó combinatoriamente (~2600 candidatos) y el RPC
-- search_all_routes supera el statement timeout (500).
-- Causa: por cada candidato se llamaba a segment_eta 3 veces,
-- y esa función usaba una subconsulta correlacionada por fila.
--
-- Solución (2 partes):
--   1. Tabla derivada route_eta_cum: minutos acumulados por
--      (línea, dirección, stop_order). ETA(tramo) = cum_min(to)
--      - cum_min(from) → O(1) con índice, sin subconsultas.
--      NOTA: es una foto de segments/line_stops; si se vuelve a
--      recalcular segments (migración 06), hay que re-ejecutar
--      el INSERT de esta migración.
--   2. En search_all_routes, el bucle de 2 transbordos queda
--      limitado a las 3 MEJORES rutas (LIMIT 3 por etaMin).
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. Tabla derivada: minutos acumulados por línea/dirección
--    cum_min(k) = minutos para llegar a la estación k desde la 0
-- ────────────────────────────────────────────────────────────────
-- CASCADE: segment_eta depende de esta tabla y se recrea más abajo
-- en el mismo script, así que re-ejecutar la migración es seguro.
DROP TABLE IF EXISTS route_eta_cum CASCADE;

CREATE TABLE route_eta_cum (
  line_id    INT  NOT NULL,
  direction  TEXT NOT NULL,
  stop_order INT  NOT NULL,
  cum_min    INT  NOT NULL DEFAULT 0,
  PRIMARY KEY (line_id, direction, stop_order)
);

INSERT INTO route_eta_cum (line_id, direction, stop_order, cum_min)
SELECT
  ls.line_id,
  ls.direction,
  ls.stop_order,
  COALESCE(SUM(COALESCE(seg.estimated_time_minutes, 0))
           OVER (PARTITION BY ls.line_id, ls.direction ORDER BY ls.stop_order), 0)::int AS cum_min
FROM line_stops ls
LEFT JOIN line_stops prev
  ON prev.line_id = ls.line_id
 AND prev.direction = ls.direction
 AND prev.stop_order = ls.stop_order - 1
LEFT JOIN segments seg
  ON seg.line_id = ls.line_id
 AND seg.from_station = prev.station_id
 AND seg.to_station = ls.station_id;

-- ────────────────────────────────────────────────────────────────
-- 2. segment_eta O(1): resta de prefijos con índice (PK)
-- ────────────────────────────────────────────────────────────────
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
    (SELECT cum_min FROM route_eta_cum
      WHERE line_id = p_line_id AND direction = p_direction AND stop_order = p_to_order)
    - (SELECT cum_min FROM route_eta_cum
      WHERE line_id = p_line_id AND direction = p_direction AND stop_order = p_from_order),
    0
  );
$$;

-- ────────────────────────────────────────────────────────────────
-- 3. search_all_routes: 2 transbordos → SOLO las 3 mejores
--    (el resto de bucles queda igual, ahora con segment_eta O(1))
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION search_all_routes(p_origin INT, p_dest INT)
RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE
  rec RECORD;
  route_eta INT;
  routes jsonb := '[]'::jsonb;
  nodes jsonb;
  route_json jsonb;
  sig TEXT;
  v_from INT;
  v_transfer_penalty INT := 10; -- min por transbordo (caminata + espera)
BEGIN
  IF p_origin = p_dest THEN RETURN routes; END IF;

  -- Rutas directas (sin transbordo)
  FOR rec IN
    SELECT DISTINCT ON (l.id, ls_o.direction)
      l.id AS line_id, l.name AS line_name, ls_o.direction,
      ls_o.stop_order AS origin_order, ls_d.stop_order AS dest_order
    FROM line_stops ls_o
    JOIN line_stops ls_d ON ls_d.line_id = ls_o.line_id AND ls_d.direction = ls_o.direction AND ls_d.station_id = p_dest
    JOIN lines l ON l.id = ls_o.line_id
    WHERE ls_o.station_id = p_origin AND ls_o.stop_order < ls_d.stop_order
      AND EXISTS (SELECT 1 FROM segments WHERE line_id = l.id)
  LOOP
    route_eta := segment_eta(rec.line_id, rec.direction, rec.origin_order, rec.dest_order);
    IF route_eta > 0 THEN
      v_from := GREATEST(0, rec.origin_order - 2);
      SELECT jsonb_agg(jsonb_build_object(
        'stationId', rn.station_id, 'stationName', rn.station_name,
        'stopOrder', rn.stop_order, 'durationSeconds', rn.duration_seconds,
        'distanceMeters', rn.distance_meters
      ) ORDER BY rn.stop_order) INTO nodes
      FROM get_route_nodes(rec.line_id, rec.direction, v_from, rec.dest_order) rn;
      sig := rec.line_id::text || '|' || rec.direction;
      route_json := jsonb_build_object(
        'id', gen_random_uuid()::text, 'lineName', rec.line_name, 'lineId', rec.line_id,
        'direction', rec.direction, 'etaMin', route_eta, 'transfers', 0, 'sig', sig,
        'steps', jsonb_build_array(jsonb_build_object(
          'lineId', rec.line_id, 'lineName', rec.line_name, 'direction', rec.direction,
          'fromStop', rec.origin_order, 'toStop', rec.dest_order, 'nodes', nodes
        )), 'alerts', '[]'::jsonb
      );
      routes := routes || route_json;
    END IF;
  END LOOP;

  -- Rutas con 1 transbordo
  FOR rec IN
    SELECT DISTINCT ON (l1.id || '|' || l2.id || '|' || ls_o.direction || '|' || ls_t2.direction)
      l1.id AS line1_id, l1.name AS line1_name, ls_o.direction AS dir1,
      ls_o.stop_order AS origin_order, ls_t1.stop_order AS transfer_order1,
      ls_t1.station_id AS transfer_station,
      l2.id AS line2_id, l2.name AS line2_name, ls_t2.direction AS dir2,
      ls_t2.stop_order AS transfer_order2, ls_d.stop_order AS dest_order,
      segment_eta(l1.id, ls_o.direction, ls_o.stop_order, ls_t1.stop_order)
        + segment_eta(l2.id, ls_t2.direction, ls_t2.stop_order, ls_d.stop_order) AS eta_calc
    FROM line_stops ls_o
    JOIN line_stops ls_t1 ON ls_t1.line_id = ls_o.line_id AND ls_t1.direction = ls_o.direction AND ls_t1.stop_order > ls_o.stop_order
    JOIN line_stops ls_t2 ON ls_t2.station_id = ls_t1.station_id AND ls_t2.line_id <> ls_t1.line_id
    JOIN line_stops ls_d ON ls_d.line_id = ls_t2.line_id AND ls_d.direction = ls_t2.direction AND ls_d.station_id = p_dest AND ls_d.stop_order > ls_t2.stop_order
    JOIN lines l1 ON l1.id = ls_o.line_id
    JOIN lines l2 ON l2.id = ls_t2.line_id
    WHERE ls_o.station_id = p_origin AND ls_o.line_id <> ls_t2.line_id
      AND EXISTS (SELECT 1 FROM segments WHERE line_id = l1.id)
      AND EXISTS (SELECT 1 FROM segments WHERE line_id = l2.id)
    ORDER BY l1.id || '|' || l2.id || '|' || ls_o.direction || '|' || ls_t2.direction, eta_calc ASC
  LOOP
    route_eta := rec.eta_calc + v_transfer_penalty;
    IF route_eta > 0 THEN
      sig := rec.line1_id::text || '|' || rec.line2_id::text || '|' || rec.dir1 || '|' || rec.dir2;
      v_from := GREATEST(0, rec.origin_order - 2);
      SELECT jsonb_agg(jsonb_build_object(
        'stationId', rn.station_id, 'stationName', rn.station_name,
        'stopOrder', rn.stop_order, 'durationSeconds', rn.duration_seconds,
        'distanceMeters', rn.distance_meters
      ) ORDER BY rn.stop_order) INTO nodes
      FROM get_route_nodes(rec.line1_id, rec.dir1, v_from, rec.transfer_order1) rn;
      route_json := jsonb_build_object(
        'id', gen_random_uuid()::text,
        'lineName', rec.line1_name || ' + ' || rec.line2_name,
        'lineId', rec.line1_id, 'direction', rec.dir1,
        'etaMin', route_eta, 'transfers', 1, 'sig', sig,
        'steps', jsonb_build_array(
          jsonb_build_object(
            'lineId', rec.line1_id, 'lineName', rec.line1_name, 'direction', rec.dir1,
            'fromStop', rec.origin_order, 'toStop', rec.transfer_order1, 'nodes', nodes
          ),
          jsonb_build_object(
            'lineId', rec.line2_id, 'lineName', rec.line2_name, 'direction', rec.dir2,
            'fromStop', rec.transfer_order2, 'toStop', rec.dest_order,
            'nodes', (SELECT jsonb_agg(jsonb_build_object(
              'stationId', rn.station_id, 'stationName', rn.station_name,
              'stopOrder', rn.stop_order, 'durationSeconds', rn.duration_seconds,
              'distanceMeters', rn.distance_meters
            ) ORDER BY rn.stop_order)
            FROM get_route_nodes(rec.line2_id, rec.dir2, rec.transfer_order2, rec.dest_order) rn)
          )
        ), 'alerts', '[]'::jsonb
      );
      routes := routes || route_json;
    END IF;
  END LOOP;

  -- Rutas con 2 transbordos: SOLO las 3 mejores (LIMIT 3)
  FOR rec IN
    SELECT DISTINCT ON (l1.id || '|' || l2.id || '|' || l3.id || '|' || ls_o.direction || '|' || ls_t2.direction || '|' || ls_t4.direction)
      l1.id AS line1_id, l1.name AS line1_name, ls_o.direction AS dir1,
      ls_o.stop_order AS origin_order, ls_t1.stop_order AS transfer_order1,
      ls_t1.station_id AS transfer_station1,
      l2.id AS line2_id, l2.name AS line2_name, ls_t2.direction AS dir2,
      ls_t2.stop_order AS transfer_order2, ls_t3.stop_order AS transfer_order3,
      ls_t3.station_id AS transfer_station2,
      l3.id AS line3_id, l3.name AS line3_name, ls_t4.direction AS dir3,
      ls_t4.stop_order AS transfer_order4, ls_d.stop_order AS dest_order,
      segment_eta(l1.id, ls_o.direction, ls_o.stop_order, ls_t1.stop_order)
        + segment_eta(l2.id, ls_t2.direction, ls_t2.stop_order, ls_t3.stop_order)
        + segment_eta(l3.id, ls_t4.direction, ls_t4.stop_order, ls_d.stop_order) AS eta_calc
    FROM line_stops ls_o
    JOIN line_stops ls_t1 ON ls_t1.line_id = ls_o.line_id AND ls_t1.direction = ls_o.direction AND ls_t1.stop_order > ls_o.stop_order
    JOIN line_stops ls_t2 ON ls_t2.station_id = ls_t1.station_id AND ls_t2.line_id <> ls_t1.line_id
    JOIN line_stops ls_t3 ON ls_t3.line_id = ls_t2.line_id AND ls_t3.direction = ls_t2.direction AND ls_t3.stop_order > ls_t2.stop_order
    JOIN line_stops ls_t4 ON ls_t4.station_id = ls_t3.station_id AND ls_t4.line_id <> ls_t3.line_id
    JOIN line_stops ls_d ON ls_d.line_id = ls_t4.line_id AND ls_d.direction = ls_t4.direction AND ls_d.station_id = p_dest AND ls_d.stop_order > ls_t4.stop_order
    JOIN lines l1 ON l1.id = ls_o.line_id
    JOIN lines l2 ON l2.id = ls_t2.line_id
    JOIN lines l3 ON l3.id = ls_t4.line_id
    WHERE ls_o.station_id = p_origin
      AND ls_t2.line_id <> ls_o.line_id
      AND ls_t4.line_id <> ls_t2.line_id
      AND ls_t4.line_id <> ls_o.line_id
      AND EXISTS (SELECT 1 FROM segments WHERE line_id = l1.id)
      AND EXISTS (SELECT 1 FROM segments WHERE line_id = l2.id)
      AND EXISTS (SELECT 1 FROM segments WHERE line_id = l3.id)
    ORDER BY l1.id || '|' || l2.id || '|' || l3.id || '|' || ls_o.direction || '|' || ls_t2.direction || '|' || ls_t4.direction, eta_calc ASC
    LIMIT 3
  LOOP
    route_eta := rec.eta_calc + 2 * v_transfer_penalty;
    IF route_eta > 0 THEN
      sig := rec.line1_id::text || '|' || rec.line2_id::text || '|' || rec.line3_id::text || '|' || rec.dir1 || '|' || rec.dir2 || '|' || rec.dir3;
      v_from := GREATEST(0, rec.origin_order - 2);
      SELECT jsonb_agg(jsonb_build_object(
        'stationId', rn.station_id, 'stationName', rn.station_name,
        'stopOrder', rn.stop_order, 'durationSeconds', rn.duration_seconds,
        'distanceMeters', rn.distance_meters
      ) ORDER BY rn.stop_order) INTO nodes
      FROM get_route_nodes(rec.line1_id, rec.dir1, v_from, rec.transfer_order1) rn;
      route_json := jsonb_build_object(
        'id', gen_random_uuid()::text,
        'lineName', rec.line1_name || ' + ' || rec.line2_name || ' + ' || rec.line3_name,
        'lineId', rec.line1_id, 'direction', rec.dir1,
        'etaMin', route_eta, 'transfers', 2, 'sig', sig,
        'steps', jsonb_build_array(
          jsonb_build_object(
            'lineId', rec.line1_id, 'lineName', rec.line1_name, 'direction', rec.dir1,
            'fromStop', rec.origin_order, 'toStop', rec.transfer_order1, 'nodes', nodes
          ),
          jsonb_build_object(
            'lineId', rec.line2_id, 'lineName', rec.line2_name, 'direction', rec.dir2,
            'fromStop', rec.transfer_order2, 'toStop', rec.transfer_order3,
            'nodes', (SELECT jsonb_agg(jsonb_build_object(
              'stationId', rn.station_id, 'stationName', rn.station_name,
              'stopOrder', rn.stop_order, 'durationSeconds', rn.duration_seconds,
              'distanceMeters', rn.distance_meters
            ) ORDER BY rn.stop_order)
            FROM get_route_nodes(rec.line2_id, rec.dir2, rec.transfer_order2, rec.transfer_order3) rn)
          ),
          jsonb_build_object(
            'lineId', rec.line3_id, 'lineName', rec.line3_name, 'direction', rec.dir3,
            'fromStop', rec.transfer_order4, 'toStop', rec.dest_order,
            'nodes', (SELECT jsonb_agg(jsonb_build_object(
              'stationId', rn.station_id, 'stationName', rn.station_name,
              'stopOrder', rn.stop_order, 'durationSeconds', rn.duration_seconds,
              'distanceMeters', rn.distance_meters
            ) ORDER BY rn.stop_order)
            FROM get_route_nodes(rec.line3_id, rec.dir3, rec.transfer_order4, rec.dest_order) rn)
          )
        ), 'alerts', '[]'::jsonb
      );
      routes := routes || route_json;
    END IF;
  END LOOP;

  WITH dedup AS (
    SELECT DISTINCT ON (elem->>'sig') elem as r
    FROM jsonb_array_elements(routes) elem
    ORDER BY elem->>'sig', (elem->>'etaMin')::int ASC
  )
  SELECT jsonb_agg(r ORDER BY (r->>'etaMin')::int ASC) INTO routes FROM dedup;

  SELECT jsonb_agg(elem - 'sig' ORDER BY (elem->>'etaMin')::int ASC) INTO routes
  FROM jsonb_array_elements(routes) elem;

  RETURN COALESCE(routes, '[]'::jsonb);
END;
$$;

COMMIT;

-- ============================================================
-- Verificación rápida (SQL Editor / psql):
--   SELECT * FROM search_all_routes(7, 15);  -- naranjal → uni
--   SELECT * FROM search_all_routes(7, 44);  -- naranjal → matellini
--     (debe devolver a lo sumo 3 rutas con "transfers": 2)
-- ============================================================
