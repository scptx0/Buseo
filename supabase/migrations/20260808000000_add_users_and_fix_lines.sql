-- ============================================================
-- Buseo — Migración: users + lines con id numérico
-- ============================================================

-- ═══════════════════════════════════════════════════
-- 1. ELIMINAR TABLAS QUE CAMBIAN
-- ═══════════════════════════════════════════════════

DROP TABLE IF EXISTS line_stops CASCADE;
DROP TABLE IF EXISTS segments CASCADE;
DROP TABLE IF EXISTS active_routes CASCADE;
DROP TABLE IF EXISTS lines CASCADE;

-- ═══════════════════════════════════════════════════
-- 2. RECREAR LINES CON ID NUMÉRICO
-- ═══════════════════════════════════════════════════

CREATE TABLE lines (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  directions TEXT[] NOT NULL,
  path_norte_sur JSONB NOT NULL,
  path_sur_norte JSONB,
  schedule JSONB
);

-- ═══════════════════════════════════════════════════
-- 3. RECREAR LINE_STOPS CON LINE_ID INTEGER
-- ═══════════════════════════════════════════════════

CREATE TABLE line_stops (
  line_id INTEGER REFERENCES lines(id) ON DELETE CASCADE,
  station_id TEXT REFERENCES stations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('norte', 'sur')),
  stop_order INTEGER NOT NULL,
  PRIMARY KEY (line_id, station_id, direction)
);

CREATE INDEX idx_line_stops_station ON line_stops(station_id);
CREATE INDEX idx_line_stops_line ON line_stops(line_id);

-- ═══════════════════════════════════════════════════
-- 4. RECREAR SEGMENTS CON LINE_ID INTEGER
-- ═══════════════════════════════════════════════════

CREATE TABLE segments (
  from_station TEXT REFERENCES stations(id),
  to_station TEXT REFERENCES stations(id),
  line_id INTEGER REFERENCES lines(id),
  distance_meters DOUBLE PRECISION,
  PRIMARY KEY (from_station, to_station, line_id)
);

CREATE INDEX idx_segments_from ON segments(from_station);
CREATE INDEX idx_segments_to ON segments(to_station);

-- ═══════════════════════════════════════════════════
-- 5. ACTIVE_ROUTES CON LINE_ID INTEGER
-- ═══════════════════════════════════════════════════

CREATE TABLE active_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  origin TEXT REFERENCES stations(id),
  destination TEXT REFERENCES stations(id),
  steps JSONB,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_active_routes_user ON active_routes(user_id);

-- ═══════════════════════════════════════════════════
-- 6. TABLA USERS
-- ═══════════════════════════════════════════════════

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- 7. ROUTE_HISTORY
-- ═══════════════════════════════════════════════════

CREATE TABLE route_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  origin TEXT REFERENCES stations(id),
  destination TEXT REFERENCES stations(id),
  lines_used INTEGER[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_route_history_user ON route_history(user_id);

-- ═══════════════════════════════════════════════════
-- 8. REPORTS
-- ═══════════════════════════════════════════════════

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('station', 'bus', 'segment')),
  target_id TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('ok', 'warning', 'critical')),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_user ON reports(user_id);
CREATE INDEX idx_reports_target ON reports(target_id);

-- ═══════════════════════════════════════════════════
-- 9. AGGREGATED_INCIDENTS
-- ═══════════════════════════════════════════════════

CREATE TABLE aggregated_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  summary TEXT,
  severity TEXT,
  report_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aggregated_target ON aggregated_incidents(target_id);

-- ═══════════════════════════════════════════════════
-- 10. FEED_POSTS
-- ═══════════════════════════════════════════════════

CREATE TABLE feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  content TEXT,
  tags TEXT[],
  incident_id UUID REFERENCES aggregated_incidents(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- 11. COMMENTS
-- ═══════════════════════════════════════════════════

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES feed_posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id),
  user_id UUID REFERENCES users(id),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON comments(post_id);

-- ═══════════════════════════════════════════════════
-- 12. MODERATION_LOGS
-- ═══════════════════════════════════════════════════

CREATE TABLE moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_moderation_user ON moderation_logs(user_id);

-- ═══════════════════════════════════════════════════
-- SEED: LINES (con id numérico y name)
-- ═══════════════════════════════════════════════════

INSERT INTO lines (name, directions, path_norte_sur, path_sur_norte, schedule) VALUES
('expreso-1',
 ARRAY['norte','sur'],
 '["matellini","teran","estadio-union","balta","angamos","canaval-y-moreyra","javier-prado","estadio-nacional","central"]'::jsonb,
 '["central","estadio-nacional","javier-prado","canaval-y-moreyra","angamos","28-de-julio","balta","estadio-union","teran","matellini"]'::jsonb,
 '{"norte":{"lun-vie":[{"start":"05:00","end":"21:00"}],"sab":[{"start":"06:00","end":"21:00"}],"dom":[{"start":"06:00","end":"21:00"}]},"sur":{"lun-vie":[{"start":"05:30","end":"20:00"}],"sab":[{"start":"06:30","end":"21:00"}],"dom":[{"start":"06:00","end":"21:00"}]}}'::jsonb),

('expreso-2',
 ARRAY['norte','sur'],
 '["ricardo-palma","javier-prado","canada","naranjal"]'::jsonb,
 '["naranjal","canada","javier-prado","ricardo-palma","28-de-julio"]'::jsonb,
 '{"norte":{"lun-vie":[{"start":"17:00","end":"21:00"}],"sab":[{"start":"12:30","end":"15:30"}]},"sur":{"lun-vie":[{"start":"05:00","end":"09:00"}],"sab":[{"start":"06:00","end":"09:00"}]}}'::jsonb),

('expreso-3',
 ARRAY['sur'],
 '["benavides","angamos","naranjal"]'::jsonb,
 NULL,
 '{"sur":{"lun-vie":[{"start":"17:00","end":"21:00"}],"sab":[{"start":"12:30","end":"15:30"}]}}'::jsonb),

('expreso-5',
 ARRAY['norte','sur'],
 '["plaza-de-flores","ricardo-palma","angamos","canaval-y-moreyra","javier-prado","canada","central","espana","caqueta","uni","tomas-valle","izaguirre","naranjal"]'::jsonb,
 '["naranjal","izaguirre","tomas-valle","uni","caqueta","espana","central","canada","javier-prado","canaval-y-moreyra","angamos","ricardo-palma","plaza-de-flores"]'::jsonb,
 '{"norte":{"lun-vie":[{"start":"09:00","end":"17:00"}],"sab":[{"start":"05:15","end":"20:20"}]},"sur":{"lun-vie":[{"start":"09:00","end":"17:00"}],"sab":[{"start":"05:15","end":"20:20"}]}}'::jsonb),

('expreso-6',
 ARRAY['sur'],
 '["izaguirre","independencia","central","javier-prado","canaval-y-moreyra","angamos","benavides"]'::jsonb,
 NULL,
 '{"sur":{"lun-vie":[{"start":"05:30","end":"10:00"}]}}'::jsonb),

('expreso-7',
 ARRAY['sur'],
 '["tomas-valle","central","javier-prado","canaval-y-moreyra","angamos"]'::jsonb,
 NULL,
 '{"sur":{"lun-vie":[{"start":"05:30","end":"09:00"}]}}'::jsonb),

('expreso-8',
 ARRAY['norte','sur'],
 '["izaguirre","independencia","tomas-valle","uni","central","javier-prado","canaval-y-moreyra","angamos","benavides","plaza-de-flores"]'::jsonb,
 '["plaza-de-flores","benavides","angamos","canaval-y-moreyra","javier-prado","central","uni","tomas-valle","independencia","izaguirre"]'::jsonb,
 '{"norte":{"lun-vie":[{"start":"05:00","end":"08:20"}]},"sur":{"lun-vie":[{"start":"05:00","end":"09:00"}]}}'::jsonb),

('expreso-9',
 ARRAY['norte','sur'],
 '["plaza-de-flores","benavides","angamos","canaval-y-moreyra","javier-prado","central","espana","caqueta","uni"]'::jsonb,
 '["uni","caqueta","canada","canaval-y-moreyra","angamos","benavides"]'::jsonb,
 '{"norte":{"lun-vie":[{"start":"05:30","end":"09:00"}]},"sur":{"lun-vie":[{"start":"05:30","end":"09:00"}]}}'::jsonb),

('expreso-10',
 ARRAY['sur'],
 '["naranjal","caqueta","ramon-castilla","tacna","jiron-de-la-union","colmena","central"]'::jsonb,
 NULL,
 '{"sur":{"lun-vie":[{"start":"06:00","end":"09:00"}]}}'::jsonb),

('expreso-11',
 ARRAY['norte','sur'],
 '["central","naranjal","universidad","las-vegas","22-de-agosto","andres-belaunde","los-incas"]'::jsonb,
 '["los-incas","andres-belaunde","22-de-agosto","las-vegas","universidad","pacifico","central"]'::jsonb,
 '{"norte":{"lun-vie":[{"start":"05:45","end":"10:45"}]},"sur":{"lun-vie":[{"start":"05:00","end":"10:00"}]}}'::jsonb),

('expreso-12',
 ARRAY['sur'],
 '["central","estadio-nacional","javier-prado","canaval-y-moreyra","angamos","benavides"]'::jsonb,
 NULL,
 '{"sur":{"lun-vie":[{"start":"05:45","end":"10:00"}]}}'::jsonb),

('expreso-13',
 ARRAY['norte','sur'],
 '["central","los-incas","chimpu-ocllo"]'::jsonb,
 '["chimpu-ocllo","andres-belaunde","uni","central"]'::jsonb,
 '{"norte":{"lun-vie":[{"start":"05:50","end":"10:00"}]},"sur":{"lun-vie":[{"start":"05:00","end":"10:00"}]}}'::jsonb),

('super-expreso',
 ARRAY['norte','sur'],
 '["aramburu","canaval-y-moreyra","naranjal"]'::jsonb,
 '["naranjal","canaval-y-moreyra","aramburu","angamos","benavides","28-de-julio"]'::jsonb,
 '{"norte":{"lun-vie":[{"start":"17:00","end":"21:00"}]},"sur":{"lun-vie":[{"start":"05:30","end":"09:00"}],"sab":[{"start":"06:00","end":"09:00"}]}}'::jsonb),

('super-expreso-norte-22-agosto',
 ARRAY['norte','sur'],
 '["central","espana","quilca","2-de-mayo","naranjal"]'::jsonb,
 '["22-de-agosto","universidad","naranjal","2-de-mayo","quilca","espana","central"]'::jsonb,
 '{"norte":{"lun-vie":[{"start":"05:00","end":"09:00"}]},"sur":{"lun-vie":[{"start":"06:00","end":"08:00"}]}}'::jsonb),

('super-expreso-norte-naranjal',
 ARRAY['norte','sur'],
 '["central","espana","quilca","2-de-mayo","naranjal"]'::jsonb,
 '["22-de-agosto","las-vegas","universidad","naranjal","2-de-mayo","quilca","espana","central"]'::jsonb,
 '{"norte":{"lun-vie":[{"start":"05:00","end":"09:00"}]},"sur":{"lun-vie":[{"start":"06:00","end":"08:00"}]}}'::jsonb),

('lechucero',
 ARRAY['norte','sur'],
 '["matellini","bulevar","balta","ricardo-palma","angamos","canada","jiron-de-la-union","ramon-castilla","uni","tomas-valle","izaguirre","naranjal"]'::jsonb,
 '["naranjal","izaguirre","tomas-valle","uni","ramon-castilla","jiron-de-la-union","canada","angamos","ricardo-palma","balta","bulevar","matellini"]'::jsonb,
 '{"norte":{"vie-sab":[{"start":"23:30","end":"04:00"}]},"sur":{"vie-sab":[{"start":"23:30","end":"04:00"}]}}'::jsonb),

('regular-a',
 ARRAY['norte','sur'],
 '["central","colmena","jiron-de-la-union","tacna","ramon-castilla","caqueta","parque-del-trabajo","uni","honorio-delgado","el-milagro","tomas-valle","los-jazmines","independencia","pacifico","izaguirre","naranjal"]'::jsonb,
 '["naranjal","izaguirre","pacifico","independencia","los-jazmines","tomas-valle","el-milagro","honorio-delgado","uni","parque-del-trabajo","caqueta","ramon-castilla","tacna","jiron-de-la-union","colmena","central"]'::jsonb,
 '{"norte":{"lun-vie":[{"start":"05:35","end":"23:00"}],"sab":[{"start":"05:35","end":"23:00"}],"dom":[{"start":"05:35","end":"22:00"}]},"sur":{"lun-vie":[{"start":"05:00","end":"23:00"}],"sab":[{"start":"05:00","end":"23:00"}],"dom":[{"start":"05:00","end":"22:00"}]}}'::jsonb),

('regular-b',
 ARRAY['norte','sur'],
 '["central","espana","quilca","2-de-mayo","caqueta","parque-del-trabajo","uni","honorio-delgado","el-milagro","tomas-valle","los-jazmines","independencia","pacifico","izaguirre","naranjal","universidad","22-de-agosto","andres-belaunde","los-incas","chimpu-ocllo"]'::jsonb,
 '["chimpu-ocllo","los-incas","andres-belaunde","22-de-agosto","las-vegas","universidad","naranjal","izaguirre","pacifico","independencia","los-jazmines","tomas-valle","el-milagro","honorio-delgado","uni","parque-del-trabajo","caqueta","2-de-mayo","quilca","espana","central"]'::jsonb,
 '{"norte":{"lun-vie":[{"start":"05:35","end":"23:00"}],"sab":[{"start":"05:35","end":"23:00"}],"dom":[{"start":"05:35","end":"22:00"}]},"sur":{"lun-vie":[{"start":"05:00","end":"23:00"}],"sab":[{"start":"05:00","end":"23:00"}],"dom":[{"start":"05:00","end":"22:00"}]}}'::jsonb),

('regular-c',
 ARRAY['norte','sur'],
 '["matellini","rosario-de-villa","teran","escuela-militar","estadio-union","bulevar","balta","plaza-de-flores","28-de-julio","benavides","ricardo-palma","angamos","domingo-orue","aramburu","canaval-y-moreyra","javier-prado","canada","mexico","estadio-nacional","central","colmena","jiron-de-la-union","tacna","ramon-castilla"]'::jsonb,
 '["ramon-castilla","tacna","jiron-de-la-union","colmena","central","estadio-nacional","mexico","canada","javier-prado","canaval-y-moreyra","aramburu","domingo-orue","angamos","ricardo-palma","benavides","28-de-julio","plaza-de-flores","balta","bulevar","estadio-union","escuela-militar","teran","rosario-de-villa","matellini"]'::jsonb,
 '{"norte":{"lun-vie":[{"start":"05:35","end":"23:00"}],"sab":[{"start":"05:35","end":"23:00"}],"dom":[{"start":"05:35","end":"22:00"}]},"sur":{"lun-vie":[{"start":"05:00","end":"23:00"}],"sab":[{"start":"05:00","end":"23:00"}],"dom":[{"start":"05:00","end":"22:00"}]}}'::jsonb),

('regular-d',
 ARRAY['norte','sur'],
 '["central","espana","quilca","2-de-mayo","caqueta","parque-del-trabajo","uni","honorio-delgado","el-milagro","tomas-valle","los-jazmines","independencia","pacifico","izaguirre","naranjal"]'::jsonb,
 '["naranjal","izaguirre","pacifico","independencia","los-jazmines","tomas-valle","el-milagro","honorio-delgado","uni","parque-del-trabajo","caqueta","2-de-mayo","quilca","espana","central"]'::jsonb,
 '{"norte":{"lun-vie":[{"start":"05:35","end":"11:00"}]},"sur":{"lun-vie":[{"start":"05:00","end":"10:30"}]}}'::jsonb);

-- ═══════════════════════════════════════════════════
-- SEED: LINE_STOPS (con line_id numérico)
-- El id se asigna por orden de inserción: expreso-1=1, expreso-2=2, etc.
-- ═══════════════════════════════════════════════════

-- Chimpu Ocllo (station id = 'chimpu-ocllo')
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(13, 'chimpu-ocllo', 'norte', 2),
(18, 'chimpu-ocllo', 'norte', 19),
(18, 'chimpu-ocllo', 'sur', 0);

-- Los Incas
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(11, 'los-incas', 'norte', 6),
(13, 'los-incas', 'norte', 1),
(18, 'los-incas', 'norte', 18),
(11, 'los-incas', 'sur', 0),
(18, 'los-incas', 'sur', 1);

-- Andrés Belaunde
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(11, 'andres-belaunde', 'norte', 5),
(18, 'andres-belaunde', 'norte', 17),
(11, 'andres-belaunde', 'sur', 1),
(13, 'andres-belaunde', 'sur', 1),
(18, 'andres-belaunde', 'sur', 2);

-- 22 de Agosto
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(11, '22-de-agosto', 'norte', 4),
(18, '22-de-agosto', 'norte', 16),
(11, '22-de-agosto', 'sur', 2),
(14, '22-de-agosto', 'sur', 0),
(15, '22-de-agosto', 'sur', 0),
(18, '22-de-agosto', 'sur', 3);

-- Las Vegas
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(11, 'las-vegas', 'norte', 3),
(11, 'las-vegas', 'sur', 3),
(15, 'las-vegas', 'sur', 1),
(18, 'las-vegas', 'sur', 4);

-- Universidad
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(11, 'universidad', 'norte', 2),
(18, 'universidad', 'norte', 15),
(11, 'universidad', 'sur', 4),
(14, 'universidad', 'sur', 1),
(15, 'universidad', 'sur', 2),
(18, 'universidad', 'sur', 5);

-- Naranjal
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(2, 'naranjal', 'norte', 3),
(4, 'naranjal', 'norte', 2),
(5, 'naranjal', 'norte', 12),
(11, 'naranjal', 'norte', 1),
(13, 'naranjal', 'norte', 2),
(14, 'naranjal', 'norte', 4),
(15, 'naranjal', 'norte', 4),
(16, 'naranjal', 'norte', 11),
(17, 'naranjal', 'norte', 15),
(18, 'naranjal', 'norte', 14),
(20, 'naranjal', 'norte', 14),
(2, 'naranjal', 'sur', 0),
(5, 'naranjal', 'sur', 0),
(10, 'naranjal', 'sur', 0),
(13, 'naranjal', 'sur', 0),
(14, 'naranjal', 'sur', 2),
(15, 'naranjal', 'sur', 3),
(16, 'naranjal', 'sur', 0),
(17, 'naranjal', 'sur', 0),
(18, 'naranjal', 'sur', 6),
(20, 'naranjal', 'sur', 0);

-- Izaguirre
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(5, 'izaguirre', 'norte', 11),
(8, 'izaguirre', 'norte', 0),
(17, 'izaguirre', 'norte', 14),
(18, 'izaguirre', 'norte', 13),
(20, 'izaguirre', 'norte', 13),
(5, 'izaguirre', 'sur', 1),
(6, 'izaguirre', 'sur', 0),
(8, 'izaguirre', 'sur', 9),
(16, 'izaguirre', 'sur', 1),
(17, 'izaguirre', 'sur', 1),
(18, 'izaguirre', 'sur', 7),
(20, 'izaguirre', 'sur', 1);

-- Pacífico
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(17, 'pacifico', 'norte', 13),
(18, 'pacifico', 'norte', 12),
(20, 'pacifico', 'norte', 12),
(11, 'pacifico', 'sur', 5),
(17, 'pacifico', 'sur', 2),
(18, 'pacifico', 'sur', 8),
(20, 'pacifico', 'sur', 2);

-- Independencia
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(8, 'independencia', 'norte', 1),
(17, 'independencia', 'norte', 12),
(18, 'independencia', 'norte', 11),
(20, 'independencia', 'norte', 11),
(6, 'independencia', 'sur', 1),
(8, 'independencia', 'sur', 8),
(17, 'independencia', 'sur', 3),
(18, 'independencia', 'sur', 9),
(20, 'independencia', 'sur', 3);

-- Los Jazmines
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(17, 'los-jazmines', 'norte', 11),
(18, 'los-jazmines', 'norte', 10),
(20, 'los-jazmines', 'norte', 10),
(17, 'los-jazmines', 'sur', 4),
(18, 'los-jazmines', 'sur', 10),
(20, 'los-jazmines', 'sur', 4);

-- Tomás Valle
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(5, 'tomas-valle', 'norte', 10),
(8, 'tomas-valle', 'norte', 2),
(16, 'tomas-valle', 'norte', 9),
(17, 'tomas-valle', 'norte', 10),
(18, 'tomas-valle', 'norte', 9),
(20, 'tomas-valle', 'norte', 9),
(5, 'tomas-valle', 'sur', 2),
(7, 'tomas-valle', 'sur', 0),
(8, 'tomas-valle', 'sur', 7),
(16, 'tomas-valle', 'sur', 2),
(17, 'tomas-valle', 'sur', 5),
(18, 'tomas-valle', 'sur', 11),
(20, 'tomas-valle', 'sur', 5);

-- El Milagro
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(17, 'el-milagro', 'norte', 9),
(18, 'el-milagro', 'norte', 8),
(20, 'el-milagro', 'norte', 8),
(17, 'el-milagro', 'sur', 6),
(18, 'el-milagro', 'sur', 12),
(20, 'el-milagro', 'sur', 6);

-- Honorio Delgado
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(17, 'honorio-delgado', 'norte', 8),
(18, 'honorio-delgado', 'norte', 7),
(20, 'honorio-delgado', 'norte', 7),
(17, 'honorio-delgado', 'sur', 7),
(18, 'honorio-delgado', 'sur', 13),
(20, 'honorio-delgado', 'sur', 7);

-- UNI
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(5, 'uni', 'norte', 9),
(8, 'uni', 'norte', 3),
(9, 'uni', 'norte', 8),
(16, 'uni', 'norte', 8),
(17, 'uni', 'norte', 7),
(18, 'uni', 'norte', 6),
(20, 'uni', 'norte', 6),
(5, 'uni', 'sur', 3),
(8, 'uni', 'sur', 6),
(9, 'uni', 'sur', 0),
(13, 'uni', 'sur', 2),
(16, 'uni', 'sur', 3),
(17, 'uni', 'sur', 8),
(18, 'uni', 'sur', 14),
(20, 'uni', 'sur', 8);

-- Parque del Trabajo
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(17, 'parque-del-trabajo', 'norte', 6),
(18, 'parque-del-trabajo', 'norte', 5),
(20, 'parque-del-trabajo', 'norte', 5),
(17, 'parque-del-trabajo', 'sur', 9),
(18, 'parque-del-trabajo', 'sur', 15),
(20, 'parque-del-trabajo', 'sur', 9);

-- Caquetá
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(5, 'caqueta', 'norte', 8),
(9, 'caqueta', 'norte', 7),
(17, 'caqueta', 'norte', 5),
(18, 'caqueta', 'norte', 4),
(20, 'caqueta', 'norte', 4),
(5, 'caqueta', 'sur', 4),
(9, 'caqueta', 'sur', 1),
(10, 'caqueta', 'sur', 1),
(17, 'caqueta', 'sur', 10),
(18, 'caqueta', 'sur', 16),
(20, 'caqueta', 'sur', 10);

-- Dos de Mayo
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(14, '2-de-mayo', 'norte', 3),
(15, '2-de-mayo', 'norte', 3),
(18, '2-de-mayo', 'norte', 3),
(20, '2-de-mayo', 'norte', 3),
(14, '2-de-mayo', 'sur', 3),
(15, '2-de-mayo', 'sur', 4),
(18, '2-de-mayo', 'sur', 17),
(20, '2-de-mayo', 'sur', 11);

-- Quilca
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(14, 'quilca', 'norte', 2),
(15, 'quilca', 'norte', 2),
(18, 'quilca', 'norte', 2),
(20, 'quilca', 'norte', 2),
(14, 'quilca', 'sur', 4),
(15, 'quilca', 'sur', 5),
(18, 'quilca', 'sur', 18),
(20, 'quilca', 'sur', 12);

-- España
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(5, 'espana', 'norte', 7),
(9, 'espana', 'norte', 6),
(14, 'espana', 'norte', 1),
(15, 'espana', 'norte', 1),
(18, 'espana', 'norte', 1),
(20, 'espana', 'norte', 1),
(5, 'espana', 'sur', 5),
(14, 'espana', 'sur', 5),
(15, 'espana', 'sur', 6),
(18, 'espana', 'sur', 19),
(20, 'espana', 'sur', 13);

-- Ramón Castilla
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(17, 'ramon-castilla', 'norte', 4),
(19, 'ramon-castilla', 'norte', 23),
(10, 'ramon-castilla', 'sur', 2),
(16, 'ramon-castilla', 'sur', 4),
(17, 'ramon-castilla', 'sur', 11),
(19, 'ramon-castilla', 'sur', 0);

-- Tacna
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(17, 'tacna', 'norte', 3),
(19, 'tacna', 'norte', 22),
(10, 'tacna', 'sur', 3),
(17, 'tacna', 'sur', 12),
(19, 'tacna', 'sur', 1);

-- Jirón de la Unión
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(16, 'jiron-de-la-union', 'norte', 7),
(17, 'jiron-de-la-union', 'norte', 2),
(19, 'jiron-de-la-union', 'norte', 21),
(10, 'jiron-de-la-union', 'sur', 4),
(16, 'jiron-de-la-union', 'sur', 5),
(17, 'jiron-de-la-union', 'sur', 13),
(19, 'jiron-de-la-union', 'sur', 2);

-- Colmena
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(17, 'colmena', 'norte', 1),
(19, 'colmena', 'norte', 20),
(10, 'colmena', 'sur', 5),
(17, 'colmena', 'sur', 14),
(19, 'colmena', 'sur', 3);

-- Estación Central
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(1, 'central', 'norte', 8),
(5, 'central', 'norte', 6),
(8, 'central', 'norte', 4),
(9, 'central', 'norte', 5),
(11, 'central', 'norte', 0),
(13, 'central', 'norte', 0),
(14, 'central', 'norte', 0),
(15, 'central', 'norte', 0),
(17, 'central', 'norte', 0),
(18, 'central', 'norte', 0),
(19, 'central', 'norte', 19),
(20, 'central', 'norte', 0),
(1, 'central', 'sur', 0),
(5, 'central', 'sur', 6),
(6, 'central', 'sur', 2),
(7, 'central', 'sur', 1),
(8, 'central', 'sur', 4),
(10, 'central', 'sur', 6),
(11, 'central', 'sur', 6),
(12, 'central', 'sur', 0),
(13, 'central', 'sur', 3),
(14, 'central', 'sur', 6),
(15, 'central', 'sur', 7),
(17, 'central', 'sur', 15),
(18, 'central', 'sur', 20),
(19, 'central', 'sur', 4),
(20, 'central', 'sur', 14);

-- Estadio Nacional
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(1, 'estadio-nacional', 'norte', 7),
(19, 'estadio-nacional', 'norte', 18),
(1, 'estadio-nacional', 'sur', 1),
(12, 'estadio-nacional', 'sur', 1),
(19, 'estadio-nacional', 'sur', 5);

-- México
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(19, 'mexico', 'norte', 17),
(19, 'mexico', 'sur', 6);

-- Canadá
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(2, 'canada', 'norte', 2),
(5, 'canada', 'norte', 5),
(16, 'canada', 'norte', 6),
(19, 'canada', 'norte', 16),
(2, 'canada', 'sur', 1),
(5, 'canada', 'sur', 7),
(9, 'canada', 'sur', 2),
(16, 'canada', 'sur', 6),
(19, 'canada', 'sur', 7);

-- Javier Prado
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(1, 'javier-prado', 'norte', 6),
(2, 'javier-prado', 'norte', 1),
(5, 'javier-prado', 'norte', 4),
(8, 'javier-prado', 'norte', 5),
(9, 'javier-prado', 'norte', 4),
(19, 'javier-prado', 'norte', 15),
(1, 'javier-prado', 'sur', 2),
(2, 'javier-prado', 'sur', 2),
(5, 'javier-prado', 'sur', 8),
(6, 'javier-prado', 'sur', 3),
(7, 'javier-prado', 'sur', 2),
(8, 'javier-prado', 'sur', 5),
(12, 'javier-prado', 'sur', 2),
(19, 'javier-prado', 'sur', 8);

-- Canaval y Moreyra
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(1, 'canaval-y-moreyra', 'norte', 5),
(5, 'canaval-y-moreyra', 'norte', 3),
(8, 'canaval-y-moreyra', 'norte', 6),
(9, 'canaval-y-moreyra', 'norte', 3),
(13, 'canaval-y-moreyra', 'norte', 1),
(19, 'canaval-y-moreyra', 'norte', 14),
(1, 'canaval-y-moreyra', 'sur', 3),
(5, 'canaval-y-moreyra', 'sur', 9),
(6, 'canaval-y-moreyra', 'sur', 4),
(7, 'canaval-y-moreyra', 'sur', 3),
(8, 'canaval-y-moreyra', 'sur', 6),
(9, 'canaval-y-moreyra', 'sur', 3),
(12, 'canaval-y-moreyra', 'sur', 3),
(13, 'canaval-y-moreyra', 'sur', 1),
(19, 'canaval-y-moreyra', 'sur', 9);

-- Aramburú
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(13, 'aramburu', 'norte', 0),
(19, 'aramburu', 'norte', 13),
(13, 'aramburu', 'sur', 2),
(19, 'aramburu', 'sur', 10);

-- Domingo Orué
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(19, 'domingo-orue', 'norte', 12),
(19, 'domingo-orue', 'sur', 11);

-- Angamos
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(1, 'angamos', 'norte', 4),
(4, 'angamos', 'norte', 1),
(5, 'angamos', 'norte', 2),
(8, 'angamos', 'norte', 7),
(9, 'angamos', 'norte', 2),
(16, 'angamos', 'norte', 5),
(19, 'angamos', 'norte', 11),
(1, 'angamos', 'sur', 4),
(5, 'angamos', 'sur', 10),
(6, 'angamos', 'sur', 5),
(7, 'angamos', 'sur', 4),
(8, 'angamos', 'sur', 7),
(9, 'angamos', 'sur', 4),
(12, 'angamos', 'sur', 4),
(13, 'angamos', 'sur', 3),
(16, 'angamos', 'sur', 7),
(19, 'angamos', 'sur', 12);

-- Ricardo Palma
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(2, 'ricardo-palma', 'norte', 0),
(5, 'ricardo-palma', 'norte', 1),
(19, 'ricardo-palma', 'norte', 10),
(2, 'ricardo-palma', 'sur', 3),
(5, 'ricardo-palma', 'sur', 11),
(16, 'ricardo-palma', 'sur', 8),
(19, 'ricardo-palma', 'sur', 13);

-- Benavides
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(4, 'benavides', 'norte', 0),
(8, 'benavides', 'norte', 8),
(9, 'benavides', 'norte', 1),
(19, 'benavides', 'norte', 9),
(6, 'benavides', 'sur', 6),
(8, 'benavides', 'sur', 8),
(9, 'benavides', 'sur', 5),
(12, 'benavides', 'sur', 5),
(13, 'benavides', 'sur', 4),
(19, 'benavides', 'sur', 14);

-- 28 de Julio
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(19, '28-de-julio', 'norte', 8),
(1, '28-de-julio', 'sur', 5),
(2, '28-de-julio', 'sur', 4),
(13, '28-de-julio', 'sur', 5),
(19, '28-de-julio', 'sur', 15);

-- Plaza de Flores
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(5, 'plaza-de-flores', 'norte', 0),
(8, 'plaza-de-flores', 'norte', 9),
(9, 'plaza-de-flores', 'norte', 0),
(19, 'plaza-de-flores', 'norte', 7),
(5, 'plaza-de-flores', 'sur', 12),
(8, 'plaza-de-flores', 'sur', 9),
(19, 'plaza-de-flores', 'sur', 16);

-- Balta
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(1, 'balta', 'norte', 3),
(19, 'balta', 'norte', 6),
(1, 'balta', 'sur', 6),
(16, 'balta', 'sur', 9),
(19, 'balta', 'sur', 17);

-- Bulevar
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(16, 'bulevar', 'norte', 1),
(19, 'bulevar', 'norte', 5),
(16, 'bulevar', 'sur', 10),
(19, 'bulevar', 'sur', 18);

-- Estadio Unión
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(1, 'estadio-union', 'norte', 2),
(19, 'estadio-union', 'norte', 4),
(1, 'estadio-union', 'sur', 7),
(19, 'estadio-union', 'sur', 19);

-- Escuela Militar
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(19, 'escuela-militar', 'norte', 3),
(19, 'escuela-militar', 'sur', 20);

-- Fernando Terán
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(1, 'teran', 'norte', 1),
(19, 'teran', 'norte', 2),
(1, 'teran', 'sur', 8),
(19, 'teran', 'sur', 21);

-- Rosario de Villa
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(19, 'rosario-de-villa', 'norte', 1),
(19, 'rosario-de-villa', 'sur', 22);

-- Terminal Matellini
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(1, 'matellini', 'norte', 0),
(16, 'matellini', 'norte', 0),
(19, 'matellini', 'norte', 0),
(1, 'matellini', 'sur', 9),
(16, 'matellini', 'sur', 11),
(19, 'matellini', 'sur', 23);
