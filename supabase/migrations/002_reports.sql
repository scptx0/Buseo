-- Migracion 002: Reportes con contadores

CREATE OR REPLACE FUNCTION submit_report(
  p_user_id UUID, p_type TEXT, p_target_id TEXT,
  p_severity TEXT, p_description TEXT, p_metadata JSONB
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO users (id, display_name, created_at, updated_at)
  VALUES (p_user_id, 'Viajero', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  v_id := gen_random_uuid();
  INSERT INTO reports (id, user_id, type, target_id, severity, description, metadata, created_at)
  VALUES (v_id, p_user_id, p_type, p_target_id, p_severity, p_description, p_metadata, NOW());
  RETURN jsonb_build_object('id', v_id, 'success', true);
END;
$$;

CREATE OR REPLACE FUNCTION report_summary(
  p_target_type TEXT, p_target_id TEXT, p_window_hours INT DEFAULT 2
) RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT COALESCE(jsonb_build_object(
    'total', COUNT(*),
    'critical', COUNT(*) FILTER (WHERE severity = 'critical'),
    'warning', COUNT(*) FILTER (WHERE severity = 'warning'),
    'ok', COUNT(*) FILTER (WHERE severity = 'ok'),
    'last_report', MAX(created_at)
  ), '{"total":0,"critical":0,"warning":0,"ok":0}'::jsonb)
  FROM reports
  WHERE type = p_target_type
    AND target_id = p_target_id
    AND created_at > NOW() - (p_window_hours || ' hours')::INTERVAL;
$$;
