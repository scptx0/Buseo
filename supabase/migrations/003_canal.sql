-- Migracion 003: Canal IA - reacciones, likes, reportes de comentarios

-- Agregar contador de likes a comments
ALTER TABLE comments ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0;

-- Reacciones a posts
CREATE TABLE IF NOT EXISTS post_reactions (
  post_id UUID REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

-- Likes a comentarios
CREATE TABLE IF NOT EXISTS comment_reactions (
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (comment_id, user_id)
);

-- Reportes de comentarios
CREATE TABLE IF NOT EXISTS comment_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funcion: insertar comentario
CREATE OR REPLACE FUNCTION add_comment(
  p_post_id UUID, p_user_id UUID, p_content TEXT
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO users (id, display_name, created_at, updated_at)
  VALUES (p_user_id, 'Viajero', NOW(), NOW()) ON CONFLICT (id) DO NOTHING;
  v_id := gen_random_uuid();
  INSERT INTO comments (id, post_id, user_id, content, created_at)
  VALUES (v_id, p_post_id, p_user_id, p_content, NOW());
  RETURN jsonb_build_object('id', v_id, 'post_id', p_post_id, 'content', p_content, 'likes_count', 0, 'created_at', NOW());
END;
$$;

-- Funcion: toggle like a comentario
CREATE OR REPLACE FUNCTION toggle_comment_like(p_comment_id UUID, p_user_id UUID)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE v_count INT;
BEGIN
  INSERT INTO users (id, display_name, created_at, updated_at)
  VALUES (p_user_id, 'Viajero', NOW(), NOW()) ON CONFLICT (id) DO NOTHING;
  IF EXISTS (SELECT 1 FROM comment_reactions WHERE comment_id = p_comment_id AND user_id = p_user_id) THEN
    DELETE FROM comment_reactions WHERE comment_id = p_comment_id AND user_id = p_user_id;
    UPDATE comments SET likes_count = likes_count - 1 WHERE id = p_comment_id;
    SELECT likes_count INTO v_count FROM comments WHERE id = p_comment_id;
    RETURN jsonb_build_object('liked', false, 'count', v_count);
  ELSE
    INSERT INTO comment_reactions (comment_id, user_id) VALUES (p_comment_id, p_user_id);
    UPDATE comments SET likes_count = likes_count + 1 WHERE id = p_comment_id;
    SELECT likes_count INTO v_count FROM comments WHERE id = p_comment_id;
    RETURN jsonb_build_object('liked', true, 'count', v_count);
  END IF;
END;
$$;

-- Funcion: toggle reaccion a post
CREATE OR REPLACE FUNCTION toggle_post_reaction(p_post_id UUID, p_user_id UUID, p_type TEXT)
RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO users (id, display_name, created_at, updated_at)
  VALUES (p_user_id, 'Viajero', NOW(), NOW()) ON CONFLICT (id) DO NOTHING;
  DELETE FROM post_reactions WHERE post_id = p_post_id AND user_id = p_user_id;
  INSERT INTO post_reactions (post_id, user_id, type) VALUES (p_post_id, p_user_id, p_type);
  RETURN (SELECT jsonb_object_agg(type, count) FROM (
    SELECT type, COUNT(*) as count FROM post_reactions WHERE post_id = p_post_id GROUP BY type
  ) t);
END;
$$;

-- Funcion: reportar comentario
CREATE OR REPLACE FUNCTION report_comment(p_comment_id UUID, p_reporter_id UUID, p_reason TEXT)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE v_count INT;
BEGIN
  INSERT INTO users (id, display_name, created_at, updated_at)
  VALUES (p_reporter_id, 'Viajero', NOW(), NOW()) ON CONFLICT (id) DO NOTHING;
  INSERT INTO comment_reports (comment_id, reporter_id, reason) VALUES (p_comment_id, p_reporter_id, p_reason);
  SELECT COUNT(*) INTO v_count FROM comment_reports WHERE comment_id = p_comment_id;
  IF v_count >= 5 THEN
    DELETE FROM comments WHERE id = p_comment_id;
    RETURN jsonb_build_object('deleted', true, 'reports', v_count);
  END IF;
  RETURN jsonb_build_object('deleted', false, 'reports', v_count);
END;
$$;

-- Funcion: obtener comentarios de un post ordenados por likes
CREATE OR REPLACE FUNCTION get_post_comments(p_post_id UUID)
RETURNS TABLE(
  id UUID, post_id UUID, user_id UUID, content TEXT,
  likes_count INT, created_at TIMESTAMPTZ
) LANGUAGE sql STABLE AS $$
  SELECT c.id, c.post_id, c.user_id, c.content, c.likes_count, c.created_at
  FROM comments c
  WHERE c.post_id = p_post_id
  ORDER BY c.likes_count DESC, c.created_at DESC;
$$;

-- Funcion: generar post IA desde reportes agrupados
CREATE OR REPLACE FUNCTION get_report_clusters(p_min_reports INT DEFAULT 2, p_window_hours FLOAT DEFAULT 0.5, p_dedup_minutes INT DEFAULT 30)
RETURNS TABLE(
  target_type TEXT, target_id TEXT, report_type TEXT,
  count BIGINT, sample_descriptions TEXT[]
) LANGUAGE sql STABLE AS $$
  SELECT
    'station' as target_type, target_id, type as report_type,
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
