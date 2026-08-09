-- ============================================================
-- Buseo — Migración: validar incidentes entre estaciones consecutivas
-- ============================================================
-- Un reporte de incidente describe un tramo entre DOS estaciones
-- CONSECUTIVAS del corredor. Se valida en el RPC `submit_report`
-- que el par (station1Id, station2Id) de la metadata exista en la
-- tabla `segments` (en cualquier sentido), fuente de verdad de los
-- pares consecutivos, y que `target_id` apunte a station1Id.
-- Si no cumple, se rechaza el reporte.

CREATE OR REPLACE FUNCTION submit_report(
  p_user_id UUID, p_type TEXT, p_target_id TEXT,
  p_severity TEXT, p_description TEXT, p_metadata JSONB
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO users (id, display_name, created_at, updated_at)
  VALUES (p_user_id, 'Viajero', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  IF p_type = 'incident' THEN
    IF (p_metadata->>'station1Id') IS NULL
       OR (p_metadata->>'station2Id') IS NULL
       OR p_target_id IS DISTINCT FROM (p_metadata->>'station1Id')
       OR NOT (
            (p_metadata->>'station1Id') ~ '^[0-9]+$'
            AND (p_metadata->>'station2Id') ~ '^[0-9]+$'
            AND EXISTS (
              SELECT 1 FROM segments
              WHERE (from_station = (p_metadata->>'station1Id')::int AND to_station = (p_metadata->>'station2Id')::int)
                 OR (from_station = (p_metadata->>'station2Id')::int AND to_station = (p_metadata->>'station1Id')::int)
            )
          ) THEN
      RAISE EXCEPTION 'El incidente debe ser entre dos estaciones consecutivas.';
    END IF;
  END IF;

  v_id := gen_random_uuid();
  INSERT INTO reports (id, user_id, type, target_id, severity, description, metadata, created_at)
  VALUES (v_id, p_user_id, p_type, p_target_id, p_severity, p_description, p_metadata, NOW());
  RETURN jsonb_build_object('id', v_id, 'success', true);
END;
$$;
