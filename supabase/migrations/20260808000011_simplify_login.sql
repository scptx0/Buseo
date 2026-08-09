-- ============================================================
-- Buseo — Migración 11: Login simplificado (usuario + género)
-- ============================================================
-- Reversión parcial de la migración 10:
--   - Elimina la columna password_hash y los RPC de contraseña.
--   - Conserva username / gender / preferred_line_id (los usa el
--     nuevo login: adopta la cuenta si existe, o la crea).
-- Nuevo RPC: login_or_register(p_username, p_gender)

-- ═══════════════════════════════════════════════════
-- 1. REVERTIR AUTH POR CONTRASEÑA
-- ═══════════════════════════════════════════════════

ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

DROP FUNCTION IF EXISTS register_user(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS verify_login(TEXT, TEXT);

-- ═══════════════════════════════════════════════════
-- 2. LOGIN: ADOPTA O CREA CUENTA
-- ═══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION login_or_register(p_username TEXT, p_gender TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_username TEXT;
  v_user users%ROWTYPE;
BEGIN
  v_username := lower(btrim(p_username));

  IF v_username IS NULL
     OR char_length(v_username) < 3
     OR char_length(v_username) > 20
     OR v_username !~ '^[a-z0-9_.-]+$' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'message', 'El usuario debe tener entre 3 y 20 caracteres (letras, números, _ . -).'
    );
  END IF;

  IF p_gender IS NULL OR p_gender NOT IN ('hombre', 'mujer', 'na') THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Selecciona un género.');
  END IF;

  -- 1) ¿Ya existe? → adoptar y refrescar el género elegido
  SELECT * INTO v_user FROM users WHERE username = v_username;
  IF FOUND THEN
    UPDATE users SET gender = p_gender, updated_at = NOW()
    WHERE id = v_user.id
    RETURNING * INTO v_user;
    RETURN jsonb_build_object(
      'ok', true,
      'id', v_user.id,
      'username', v_user.username,
      'gender', v_user.gender,
      'preferred_line_id', v_user.preferred_line_id
    );
  END IF;

  -- 2) No existe → crear
  BEGIN
    INSERT INTO users (id, username, gender, display_name)
    VALUES (gen_random_uuid(), v_username, p_gender, v_username)
    RETURNING * INTO v_user;
  EXCEPTION
    WHEN unique_violation THEN
      SELECT * INTO v_user FROM users WHERE username = v_username;
  END;

  RETURN jsonb_build_object(
    'ok', true,
    'id', v_user.id,
    'username', v_user.username,
    'gender', v_user.gender,
    'preferred_line_id', v_user.preferred_line_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION login_or_register(TEXT, TEXT) TO anon, authenticated;
