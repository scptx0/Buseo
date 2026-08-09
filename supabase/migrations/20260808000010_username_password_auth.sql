-- ============================================================
-- Buseo — Migración 10: Autenticación usuario + contraseña
-- ============================================================
-- Agrega credenciales a la tabla `users` y expone dos funciones
-- RPC (SECURITY DEFINER) para registro y verificación con bcrypt.
-- Requiere la extensión pgcrypto (ya instalada en el proyecto).

-- ═══════════════════════════════════════════════════
-- 1. COLUMNAS DE CREDENCIALES EN users
-- ═══════════════════════════════════════════════════

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS preferred_line_id TEXT;

-- Username único (índice parcial: permite filas existentes sin username)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username
  ON users (username)
  WHERE username IS NOT NULL;

-- ═══════════════════════════════════════════════════
-- 2. ACTIVE_ROUTES: apuntaba a auth.users; ahora a users
--    (las cuentas de Buseo viven en public.users, no en Supabase Auth)
-- ═══════════════════════════════════════════════════

ALTER TABLE IF EXISTS active_routes DROP CONSTRAINT IF EXISTS active_routes_user_id_fkey;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'active_routes') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'active_routes_user_id_fkey'
        AND conrelid = 'public.active_routes'::regclass
    ) THEN
      ALTER TABLE active_routes
        ADD CONSTRAINT active_routes_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════
-- 3. REGISTRO
-- ═══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION register_user(p_username TEXT, p_password TEXT, p_gender TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_username TEXT;
  v_id UUID;
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

  IF p_password IS NULL OR char_length(p_password) < 6 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'La contraseña debe tener al menos 6 caracteres.');
  END IF;

  IF p_gender IS NOT NULL AND p_gender NOT IN ('hombre', 'mujer', 'na') THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Género inválido.');
  END IF;

  BEGIN
    INSERT INTO users (id, username, password_hash, gender, display_name)
    VALUES (gen_random_uuid(), v_username, crypt(p_password, gen_salt('bf')), p_gender, v_username)
    RETURNING id INTO v_id;
  EXCEPTION
    WHEN unique_violation THEN
      RETURN jsonb_build_object('ok', false, 'message', 'Ese nombre de usuario ya está en uso.');
  END;

  RETURN jsonb_build_object('ok', true, 'id', v_id, 'username', v_username);
END;
$$;

-- ═══════════════════════════════════════════════════
-- 4. VERIFICACIÓN DE LOGIN
-- ═══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION verify_login(p_username TEXT, p_password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user users%ROWTYPE;
BEGIN
  SELECT * INTO v_user
  FROM users
  WHERE username = lower(btrim(p_username))
    AND password_hash = crypt(p_password, password_hash);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'id', v_user.id,
    'username', v_user.username,
    'gender', v_user.gender,
    'preferred_line_id', v_user.preferred_line_id
  );
END;
$$;

-- ═══════════════════════════════════════════════════
-- 5. PERMISOS (la app usa la key anónima para llamar los RPC)
-- ═══════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION register_user(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_login(TEXT, TEXT) TO anon, authenticated;
