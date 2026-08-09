-- ============================================================
-- Buseo — Migración 06: Corregir líneas, tiempos y transbordos
-- ============================================================
-- Problema:
--   1) `line_stops` y `segments` fueron sembrados con line_id que
--      NO coinciden con los ids reales de la tabla `lines`
--      (p.ej. el id 5 = "expreso-6" tenía las paradas del expreso-5,
--      el 13 mezclaba super-expreso + expreso-13, expreso-3 quedó
--      sin paradas y al lechucero norte le faltaban estaciones).
--   2) Las distancias/tiempos de `segments` no corresponden a las
--      coordenadas reales de `stations`: p.ej. naranjal→izaguirre
--      figura con 2,71 km cuando la distancia real es ~0,79 km,
--      por lo que regular-A naranjal→uni daba 30 min en vez de ~15.
--   3) El RPC no penalizaba el transbordo, por lo que rutas con
--      transbordo "sin sentido" aparecían más baratas que el directo.
--
-- Solución:
--   • `line_stops` se regenera desde los paths de `lines`
--     (fuente de verdad; tabla ya corregida, no se modifica):
--       dirección 'norte' (viaje Sur→Norte) ← path_sur_norte
--       dirección 'sur'  (viaje Norte→Sur) ← path_norte_sur
--   • `segments` se recalcula con la distancia real entre
--     estaciones (coordenadas de stations, haversine) y el modelo:
--
--         tiempo_tramo = distancia / velocidad_base + tiempo_parada
--
--     con velocidad base = 30 km/h y 20 s de detención por parada
--     (AJUSTABLE abajo). Al sumar los tramos de una ruta, el número
--     de paradas que hace la línea en ese recorrido reduce la
--     velocidad efectiva automáticamente (más paradas = más lento),
--     sin tablas por línea.
--     NOTA: la distancia haversine es en línea recta (subestima la
--     distancia real por carretera); si luego se tienen tiempos
--     reales (Google Maps), solo hay que ajustar los dos
--     parámetros o cargar los datos.
--   • `search_all_routes` suma +10 min de penalización por
--     transbordo (caminata + espera).
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. Regenerar line_stops desde los paths de `lines`
-- ────────────────────────────────────────────────────────────────
DELETE FROM line_stops;

-- Dirección 'sur' (viaje Norte → Sur): path_norte_sur
INSERT INTO line_stops (line_id, station_id, direction, stop_order)
SELECT l.id, s.id, 'sur', p.ord - 1
FROM lines l
CROSS JOIN LATERAL jsonb_array_elements_text(l.path_norte_sur) WITH ORDINALITY AS p(sid, ord)
JOIN stations s ON s.name = p.sid
WHERE l.path_norte_sur IS NOT NULL;

-- Dirección 'norte' (viaje Sur → Norte): path_sur_norte
INSERT INTO line_stops (line_id, station_id, direction, stop_order)
SELECT l.id, s.id, 'norte', p.ord - 1
FROM lines l
CROSS JOIN LATERAL jsonb_array_elements_text(l.path_sur_norte) WITH ORDINALITY AS p(sid, ord)
JOIN stations s ON s.name = p.sid
WHERE l.path_sur_norte IS NOT NULL;

-- ────────────────────────────────────────────────────────────────
-- 2. Regenerar segments con distancias/tiempos recalibrados
--    Modelo: tiempo = distancia / velocidad_base + tiempo_por_parada
--    Parámetros — AJUSTABLES:
--      v_base     = 30 km/h (velocidad de crucero del corredor)
--      s_parada   = 20 s   (detención + subida/bajada por estación)
-- ────────────────────────────────────────────────────────────────
DELETE FROM segments;

INSERT INTO segments (from_station, to_station, line_id, distance_meters, duration_seconds, estimated_time_minutes)
SELECT
  a.station_id,
  b.station_id,
  a.line_id,
  d.dist_m,
  t.min * 60,
  t.min
FROM line_stops a
JOIN line_stops b
  ON b.line_id = a.line_id
 AND b.direction = a.direction
 AND b.stop_order = a.stop_order + 1
JOIN stations a2 ON a2.id = a.station_id
JOIN stations b2 ON b2.id = b.station_id
CROSS JOIN LATERAL (
  SELECT ROUND(6371000 * 2 * asin(LEAST(1, SQRT(
    POWER(SIN(RADIANS((b2.lat - a2.lat) / 2)), 2) +
    COS(RADIANS(a2.lat)) * COS(RADIANS(b2.lat)) * POWER(SIN(RADIANS((b2.lng - a2.lng) / 2)), 2)
  ))))::int AS dist_m
) d
CROSS JOIN LATERAL (
  -- ⬅ AJUSTAR AQUÍ si cambian los parámetros: v_base (km/h) y s_parada (segundos)
  SELECT GREATEST(1, ROUND(d.dist_m::numeric / 1000 / 30.0 * 60 + 20.0 / 60)::int) AS min
) t;

-- ────────────────────────────────────────────────────────────────
-- 3. RPC search_all_routes con penalización de transbordo (+10 min)
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

-- ────────────────────────────────────────────────────────────────
-- 4. Guardia: ninguna línea con paths puede quedar sin paradas/tramos
-- ────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_bad INT;
BEGIN
  SELECT COUNT(*) INTO v_bad
  FROM (
    SELECT l.id FROM lines l
    WHERE l.path_norte_sur IS NOT NULL OR l.path_sur_norte IS NOT NULL
    EXCEPT
    SELECT DISTINCT line_id FROM line_stops
  ) x;
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'Líneas sin paradas tras la regeneración: %', v_bad;
  END IF;

  SELECT COUNT(*) INTO v_bad
  FROM (
    SELECT DISTINCT line_id FROM line_stops
    EXCEPT
    SELECT DISTINCT line_id FROM segments
  ) x;
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'Líneas sin segments tras la regeneración: %', v_bad;
  END IF;
END
$$;

COMMIT;

-- ============================================================
-- Verificación rápida (SQL Editor / psql):
--   SELECT * FROM search_all_routes(7, 15);  -- naranjal → uni
--   SELECT * FROM search_all_routes(25, 44); -- central → matellini
--   SELECT line_id, direction, array_agg(station_id ORDER BY stop_order)
--   FROM line_stops GROUP BY line_id, direction ORDER BY line_id;
-- ============================================================
