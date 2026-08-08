-- ============================================================
-- Buseo — Esquema + Datos iniciales del Metropolitano de Lima
-- Fuente: info-buses.txt (datos verificados)
-- ============================================================

-- ═══════════════════════════════════════════════════
-- SCHEMA
-- ═══════════════════════════════════════════════════

CREATE TABLE stations (
  id TEXT PRIMARY KEY,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  polygon JSONB
);

CREATE TABLE lines (
  id TEXT PRIMARY KEY,
  directions TEXT[] NOT NULL,
  path_norte_sur JSONB NOT NULL,
  path_sur_norte JSONB,
  schedule JSONB
);

CREATE TABLE line_stops (
  line_id TEXT REFERENCES lines(id) ON DELETE CASCADE,
  station_id TEXT REFERENCES stations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('norte', 'sur')),
  stop_order INTEGER NOT NULL,
  PRIMARY KEY (line_id, station_id, direction)
);

CREATE TABLE segments (
  from_station TEXT REFERENCES stations(id),
  to_station TEXT REFERENCES stations(id),
  line_id TEXT REFERENCES lines(id),
  distance_meters DOUBLE PRECISION,
  PRIMARY KEY (from_station, to_station, line_id)
);

CREATE TABLE active_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  origin TEXT REFERENCES stations(id),
  destination TEXT REFERENCES stations(id),
  steps JSONB,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_line_stops_station ON line_stops(station_id);
CREATE INDEX idx_line_stops_line ON line_stops(line_id);
CREATE INDEX idx_segments_from ON segments(from_station);
CREATE INDEX idx_segments_to ON segments(to_station);
CREATE INDEX idx_active_routes_user ON active_routes(user_id);

-- ═══════════════════════════════════════════════════
-- SEED: STATIONS (44 estaciones)
-- polygon se deja NULL por ahora; se llena con coordenadas reales después
-- ═══════════════════════════════════════════════════

INSERT INTO stations (id, lat, lng, polygon) VALUES
-- Tramo Norte y Extensión
('chimpu-ocllo', -12.0130, -77.0520, NULL),
('los-incas', -12.0180, -77.0490, NULL),
('andres-belaunde', -12.0250, -77.0450, NULL),
('22-de-agosto', -12.0320, -77.0410, NULL),
('las-vegas', -12.0370, -77.0380, NULL),
('universidad', -12.0420, -77.0350, NULL),
('naranjal', -12.0480, -77.0310, NULL),
('izaguirre', -12.0540, -77.0280, NULL),
('pacifico', -12.0600, -77.0250, NULL),
('independencia', -12.0660, -77.0220, NULL),
('los-jazmines', -12.0720, -77.0190, NULL),
('tomas-valle', -12.0780, -77.0160, NULL),
('el-milagro', -12.0840, -77.0130, NULL),
('honorio-delgado', -12.0900, -77.0100, NULL),
('uni', -12.0960, -77.0070, NULL),
('parque-del-trabajo', -12.1010, -77.0030, NULL),
('caqueta', -12.1060, -76.9990, NULL),

-- Centro e Histórico
('2-de-mayo', -12.1120, -76.9950, NULL),
('quilca', -12.1170, -76.9910, NULL),
('espana', -12.1220, -76.9870, NULL),
('ramon-castilla', -12.1270, -76.9830, NULL),
('tacna', -12.1310, -76.9800, NULL),
('jiron-de-la-union', -12.1340, -76.9780, NULL),
('colmena', -12.1370, -76.9760, NULL),
('central', -12.1400, -76.9740, NULL),

-- Vía Expresa / Troncal Sur
('estadio-nacional', -12.1450, -76.9710, NULL),
('mexico', -12.1500, -76.9680, NULL),
('canada', -12.1550, -76.9650, NULL),
('javier-prado', -12.1600, -76.9620, NULL),
('canaval-y-moreyra', -12.1650, -76.9590, NULL),
('aramburu', -12.1700, -76.9560, NULL),
('domingo-orue', -12.1750, -76.9530, NULL),
('angamos', -12.1800, -76.9500, NULL),
('ricardo-palma', -12.1850, -76.9470, NULL),
('benavides', -12.1900, -76.9440, NULL),
('28-de-julio', -12.1950, -76.9410, NULL),
('plaza-de-flores', -12.2000, -76.9380, NULL),
('balta', -12.2050, -76.9350, NULL),
('bulevar', -12.2100, -76.9320, NULL),
('estadio-union', -12.2150, -76.9290, NULL),
('escuela-militar', -12.2200, -76.9260, NULL),
('teran', -12.2250, -76.9230, NULL),
('rosario-de-villa', -12.2300, -76.9200, NULL),
('matellini', -12.2350, -76.9170, NULL);

-- ═══════════════════════════════════════════════════
-- SEED: LINES (18 líneas)
-- Super Expreso Norte se divide en 2 variantes
-- ═══════════════════════════════════════════════════

INSERT INTO lines (id, directions, path_norte_sur, path_sur_norte, schedule) VALUES

-- ─── EXPRESOS ────────────────────────────────────

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

-- ─── SÚPER EXPRESO ──────────────────────────────

('super-expreso',
 ARRAY['norte','sur'],
 '["aramburu","canaval-y-moreyra","naranjal"]'::jsonb,
 '["naranjal","canaval-y-moreyra","aramburu","angamos","benavides","28-de-julio"]'::jsonb,
 '{"norte":{"lun-vie":[{"start":"17:00","end":"21:00"}]},"sur":{"lun-vie":[{"start":"05:30","end":"09:00"}],"sab":[{"start":"06:00","end":"09:00"}]}}'::jsonb),

-- ─── SÚPER EXPRESO NORTE (2 variantes) ──────────

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

-- ─── LECHUCERO ──────────────────────────────────

('lechucero',
 ARRAY['norte','sur'],
 '["matellini","bulevar","balta","ricardo-palma","angamos","canada","jiron-de-la-union","ramon-castilla","uni","tomas-valle","izaguirre","naranjal"]'::jsonb,
 '["naranjal","izaguirre","tomas-valle","uni","ramon-castilla","jiron-de-la-union","canada","angamos","ricardo-palma","balta","bulevar","matellini"]'::jsonb,
 '{"norte":{"vie-sab":[{"start":"23:30","end":"04:00"}]},"sur":{"vie-sab":[{"start":"23:30","end":"04:00"}]}}'::jsonb),

-- ─── REGULARES ──────────────────────────────────

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
-- SEED: LINE_STOPS (junction table)
-- Generado desde la sección de estaciones de info-buses.txt
-- ═══════════════════════════════════════════════════

-- ─── Terminal Chimpu Ocllo ──────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-13', 'chimpu-ocllo', 'norte', 2),
('regular-b', 'chimpu-ocllo', 'norte', 19),
('regular-b', 'chimpu-ocllo', 'sur', 0);

-- ─── Los Incas ─────────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-11', 'los-incas', 'norte', 6),
('expreso-13', 'los-incas', 'norte', 1),
('regular-b', 'los-incas', 'norte', 18),
('expreso-11', 'los-incas', 'sur', 0),
('regular-b', 'los-incas', 'sur', 1);

-- ─── Andrés Belaunde ───────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-11', 'andres-belaunde', 'norte', 5),
('regular-b', 'andres-belaunde', 'norte', 17),
('expreso-11', 'andres-belaunde', 'sur', 1),
('expreso-13', 'andres-belaunde', 'sur', 1),
('regular-b', 'andres-belaunde', 'sur', 2);

-- ─── 22 de Agosto ──────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-11', '22-de-agosto', 'norte', 4),
('regular-b', '22-de-agosto', 'norte', 16),
('expreso-11', '22-de-agosto', 'sur', 2),
('super-expreso-norte-22-agosto', '22-de-agosto', 'sur', 0),
('super-expreso-norte-naranjal', '22-de-agosto', 'sur', 0),
('regular-b', '22-de-agosto', 'sur', 3);

-- ─── Las Vegas ─────────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-11', 'las-vegas', 'norte', 3),
('expreso-11', 'las-vegas', 'sur', 3),
('super-expreso-norte-naranjal', 'las-vegas', 'sur', 1),
('regular-b', 'las-vegas', 'sur', 4);

-- ─── Universidad ───────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-11', 'universidad', 'norte', 2),
('regular-b', 'universidad', 'norte', 15),
('expreso-11', 'universidad', 'sur', 4),
('super-expreso-norte-22-agosto', 'universidad', 'sur', 1),
('super-expreso-norte-naranjal', 'universidad', 'sur', 2),
('regular-b', 'universidad', 'sur', 5);

-- ─── Terminal Naranjal ─────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-2', 'naranjal', 'norte', 3),
('expreso-3', 'naranjal', 'norte', 2),
('expreso-5', 'naranjal', 'norte', 12),
('expreso-11', 'naranjal', 'norte', 1),
('super-expreso', 'naranjal', 'norte', 2),
('super-expreso-norte-22-agosto', 'naranjal', 'norte', 4),
('super-expreso-norte-naranjal', 'naranjal', 'norte', 4),
('lechucero', 'naranjal', 'norte', 11),
('regular-a', 'naranjal', 'norte', 15),
('regular-b', 'naranjal', 'norte', 14),
('regular-d', 'naranjal', 'norte', 14),
('expreso-2', 'naranjal', 'sur', 0),
('expreso-5', 'naranjal', 'sur', 0),
('expreso-10', 'naranjal', 'sur', 0),
('super-expreso', 'naranjal', 'sur', 0),
('super-expreso-norte-22-agosto', 'naranjal', 'sur', 2),
('super-expreso-norte-naranjal', 'naranjal', 'sur', 3),
('lechucero', 'naranjal', 'sur', 0),
('regular-a', 'naranjal', 'sur', 0),
('regular-b', 'naranjal', 'sur', 6),
('regular-d', 'naranjal', 'sur', 0);

-- ─── Izaguirre ─────────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-5', 'izaguirre', 'norte', 11),
('expreso-8', 'izaguirre', 'norte', 0),
('regular-a', 'izaguirre', 'norte', 14),
('regular-b', 'izaguirre', 'norte', 13),
('regular-d', 'izaguirre', 'norte', 13),
('expreso-5', 'izaguirre', 'sur', 1),
('expreso-6', 'izaguirre', 'sur', 0),
('expreso-8', 'izaguirre', 'sur', 9),
('lechucero', 'izaguirre', 'sur', 1),
('regular-a', 'izaguirre', 'sur', 1),
('regular-b', 'izaguirre', 'sur', 7),
('regular-d', 'izaguirre', 'sur', 1);

-- ─── Pacífico ──────────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('regular-a', 'pacifico', 'norte', 13),
('regular-b', 'pacifico', 'norte', 12),
('regular-d', 'pacifico', 'norte', 12),
('expreso-11', 'pacifico', 'sur', 5),
('regular-a', 'pacifico', 'sur', 2),
('regular-b', 'pacifico', 'sur', 8),
('regular-d', 'pacifico', 'sur', 2);

-- ─── Independencia ─────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-8', 'independencia', 'norte', 1),
('regular-a', 'independencia', 'norte', 12),
('regular-b', 'independencia', 'norte', 11),
('regular-d', 'independencia', 'norte', 11),
('expreso-6', 'independencia', 'sur', 1),
('expreso-8', 'independencia', 'sur', 8),
('regular-a', 'independencia', 'sur', 3),
('regular-b', 'independencia', 'sur', 9),
('regular-d', 'independencia', 'sur', 3);

-- ─── Los Jazmines ──────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('regular-a', 'los-jazmines', 'norte', 11),
('regular-b', 'los-jazmines', 'norte', 10),
('regular-d', 'los-jazmines', 'norte', 10),
('regular-a', 'los-jazmines', 'sur', 4),
('regular-b', 'los-jazmines', 'sur', 10),
('regular-d', 'los-jazmines', 'sur', 4);

-- ─── Tomás Valle ───────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-5', 'tomas-valle', 'norte', 10),
('expreso-8', 'tomas-valle', 'norte', 2),
('lechucero', 'tomas-valle', 'norte', 9),
('regular-a', 'tomas-valle', 'norte', 10),
('regular-b', 'tomas-valle', 'norte', 9),
('regular-d', 'tomas-valle', 'norte', 9),
('expreso-5', 'tomas-valle', 'sur', 2),
('expreso-7', 'tomas-valle', 'sur', 0),
('expreso-8', 'tomas-valle', 'sur', 7),
('lechucero', 'tomas-valle', 'sur', 2),
('regular-a', 'tomas-valle', 'sur', 5),
('regular-b', 'tomas-valle', 'sur', 11),
('regular-d', 'tomas-valle', 'sur', 5);

-- ─── El Milagro ────────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('regular-a', 'el-milagro', 'norte', 9),
('regular-b', 'el-milagro', 'norte', 8),
('regular-d', 'el-milagro', 'norte', 8),
('regular-a', 'el-milagro', 'sur', 6),
('regular-b', 'el-milagro', 'sur', 12),
('regular-d', 'el-milagro', 'sur', 6);

-- ─── Honorio Delgado ───────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('regular-a', 'honorio-delgado', 'norte', 8),
('regular-b', 'honorio-delgado', 'norte', 7),
('regular-d', 'honorio-delgado', 'norte', 7),
('regular-a', 'honorio-delgado', 'sur', 7),
('regular-b', 'honorio-delgado', 'sur', 13),
('regular-d', 'honorio-delgado', 'sur', 7);

-- ─── UNI ───────────────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-5', 'uni', 'norte', 9),
('expreso-8', 'uni', 'norte', 3),
('expreso-9', 'uni', 'norte', 8),
('lechucero', 'uni', 'norte', 8),
('regular-a', 'uni', 'norte', 7),
('regular-b', 'uni', 'norte', 6),
('regular-d', 'uni', 'norte', 6),
('expreso-5', 'uni', 'sur', 3),
('expreso-8', 'uni', 'sur', 6),
('expreso-9', 'uni', 'sur', 0),
('expreso-13', 'uni', 'sur', 2),
('lechucero', 'uni', 'sur', 3),
('regular-a', 'uni', 'sur', 8),
('regular-b', 'uni', 'sur', 14),
('regular-d', 'uni', 'sur', 8);

-- ─── Parque del Trabajo ────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('regular-a', 'parque-del-trabajo', 'norte', 6),
('regular-b', 'parque-del-trabajo', 'norte', 5),
('regular-d', 'parque-del-trabajo', 'norte', 5),
('regular-a', 'parque-del-trabajo', 'sur', 9),
('regular-b', 'parque-del-trabajo', 'sur', 15),
('regular-d', 'parque-del-trabajo', 'sur', 9);

-- ─── Caquetá ───────────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-5', 'caqueta', 'norte', 8),
('expreso-9', 'caqueta', 'norte', 7),
('regular-a', 'caqueta', 'norte', 5),
('regular-b', 'caqueta', 'norte', 4),
('regular-d', 'caqueta', 'norte', 4),
('expreso-5', 'caqueta', 'sur', 4),
('expreso-9', 'caqueta', 'sur', 1),
('expreso-10', 'caqueta', 'sur', 1),
('regular-a', 'caqueta', 'sur', 10),
('regular-b', 'caqueta', 'sur', 16),
('regular-d', 'caqueta', 'sur', 10);

-- ─── Dos de Mayo ───────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('super-expreso-norte-22-agosto', '2-de-mayo', 'norte', 3),
('super-expreso-norte-naranjal', '2-de-mayo', 'norte', 3),
('regular-b', '2-de-mayo', 'norte', 3),
('regular-d', '2-de-mayo', 'norte', 3),
('super-expreso-norte-22-agosto', '2-de-mayo', 'sur', 3),
('super-expreso-norte-naranjal', '2-de-mayo', 'sur', 4),
('regular-b', '2-de-mayo', 'sur', 17),
('regular-d', '2-de-mayo', 'sur', 11);

-- ─── Quilca ────────────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('super-expreso-norte-22-agosto', 'quilca', 'norte', 2),
('super-expreso-norte-naranjal', 'quilca', 'norte', 2),
('regular-b', 'quilca', 'norte', 2),
('regular-d', 'quilca', 'norte', 2),
('super-expreso-norte-22-agosto', 'quilca', 'sur', 4),
('super-expreso-norte-naranjal', 'quilca', 'sur', 5),
('regular-b', 'quilca', 'sur', 18),
('regular-d', 'quilca', 'sur', 12);

-- ─── España ────────────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-5', 'espana', 'norte', 7),
('expreso-9', 'espana', 'norte', 6),
('super-expreso-norte-22-agosto', 'espana', 'norte', 1),
('super-expreso-norte-naranjal', 'espana', 'norte', 1),
('regular-b', 'espana', 'norte', 1),
('regular-d', 'espana', 'norte', 1),
('expreso-5', 'espana', 'sur', 5),
('super-expreso-norte-22-agosto', 'espana', 'sur', 5),
('super-expreso-norte-naranjal', 'espana', 'sur', 6),
('regular-b', 'espana', 'sur', 19),
('regular-d', 'espana', 'sur', 13);

-- ─── Ramón Castilla ────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('regular-a', 'ramon-castilla', 'norte', 4),
('regular-c', 'ramon-castilla', 'norte', 23),
('expreso-10', 'ramon-castilla', 'sur', 2),
('lechucero', 'ramon-castilla', 'sur', 4),
('regular-a', 'ramon-castilla', 'sur', 11),
('regular-c', 'ramon-castilla', 'sur', 0);

-- ─── Tacna ─────────────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('regular-a', 'tacna', 'norte', 3),
('regular-c', 'tacna', 'norte', 22),
('expreso-10', 'tacna', 'sur', 3),
('regular-a', 'tacna', 'sur', 12),
('regular-c', 'tacna', 'sur', 1);

-- ─── Jirón de la Unión ─────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('lechucero', 'jiron-de-la-union', 'norte', 7),
('regular-a', 'jiron-de-la-union', 'norte', 2),
('regular-c', 'jiron-de-la-union', 'norte', 21),
('expreso-10', 'jiron-de-la-union', 'sur', 4),
('lechucero', 'jiron-de-la-union', 'sur', 5),
('regular-a', 'jiron-de-la-union', 'sur', 13),
('regular-c', 'jiron-de-la-union', 'sur', 2);

-- ─── Colmena ───────────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('regular-a', 'colmena', 'norte', 1),
('regular-c', 'colmena', 'norte', 20),
('expreso-10', 'colmena', 'sur', 5),
('regular-a', 'colmena', 'sur', 14),
('regular-c', 'colmena', 'sur', 3);

-- ─── Estación Central ──────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-1', 'central', 'norte', 8),
('expreso-5', 'central', 'norte', 6),
('expreso-8', 'central', 'norte', 4),
('expreso-9', 'central', 'norte', 5),
('expreso-11', 'central', 'norte', 0),
('expreso-13', 'central', 'norte', 0),
('super-expreso-norte-22-agosto', 'central', 'norte', 0),
('super-expreso-norte-naranjal', 'central', 'norte', 0),
('regular-a', 'central', 'norte', 0),
('regular-b', 'central', 'norte', 0),
('regular-c', 'central', 'norte', 19),
('regular-d', 'central', 'norte', 0),
('expreso-1', 'central', 'sur', 0),
('expreso-5', 'central', 'sur', 6),
('expreso-6', 'central', 'sur', 2),
('expreso-7', 'central', 'sur', 1),
('expreso-8', 'central', 'sur', 4),
('expreso-10', 'central', 'sur', 6),
('expreso-11', 'central', 'sur', 6),
('expreso-12', 'central', 'sur', 0),
('expreso-13', 'central', 'sur', 3),
('super-expreso-norte-22-agosto', 'central', 'sur', 6),
('super-expreso-norte-naranjal', 'central', 'sur', 7),
('regular-a', 'central', 'sur', 15),
('regular-b', 'central', 'sur', 20),
('regular-c', 'central', 'sur', 4),
('regular-d', 'central', 'sur', 14);

-- ─── Estadio Nacional ──────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-1', 'estadio-nacional', 'norte', 7),
('regular-c', 'estadio-nacional', 'norte', 18),
('expreso-1', 'estadio-nacional', 'sur', 1),
('expreso-12', 'estadio-nacional', 'sur', 1),
('regular-c', 'estadio-nacional', 'sur', 5);

-- ─── México ────────────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('regular-c', 'mexico', 'norte', 17),
('regular-c', 'mexico', 'sur', 6);

-- ─── Canadá ────────────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-2', 'canada', 'norte', 2),
('expreso-5', 'canada', 'norte', 5),
('lechucero', 'canada', 'norte', 6),
('regular-c', 'canada', 'norte', 16),
('expreso-2', 'canada', 'sur', 1),
('expreso-5', 'canada', 'sur', 7),
('expreso-9', 'canada', 'sur', 2),
('lechucero', 'canada', 'sur', 6),
('regular-c', 'canada', 'sur', 7);

-- ─── Javier Prado ──────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-1', 'javier-prado', 'norte', 6),
('expreso-2', 'javier-prado', 'norte', 1),
('expreso-5', 'javier-prado', 'norte', 4),
('expreso-8', 'javier-prado', 'norte', 5),
('expreso-9', 'javier-prado', 'norte', 4),
('regular-c', 'javier-prado', 'norte', 15),
('expreso-1', 'javier-prado', 'sur', 2),
('expreso-2', 'javier-prado', 'sur', 2),
('expreso-5', 'javier-prado', 'sur', 8),
('expreso-6', 'javier-prado', 'sur', 3),
('expreso-7', 'javier-prado', 'sur', 2),
('expreso-8', 'javier-prado', 'sur', 5),
('expreso-12', 'javier-prado', 'sur', 2),
('regular-c', 'javier-prado', 'sur', 8);

-- ─── Canaval y Moreyra ─────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-1', 'canaval-y-moreyra', 'norte', 5),
('expreso-5', 'canaval-y-moreyra', 'norte', 3),
('expreso-8', 'canaval-y-moreyra', 'norte', 6),
('expreso-9', 'canaval-y-moreyra', 'norte', 3),
('super-expreso', 'canaval-y-moreyra', 'norte', 1),
('regular-c', 'canaval-y-moreyra', 'norte', 14),
('expreso-1', 'canaval-y-moreyra', 'sur', 3),
('expreso-5', 'canaval-y-moreyra', 'sur', 9),
('expreso-6', 'canaval-y-moreyra', 'sur', 4),
('expreso-7', 'canaval-y-moreyra', 'sur', 3),
('expreso-8', 'canaval-y-moreyra', 'sur', 6),
('expreso-9', 'canaval-y-moreyra', 'sur', 3),
('expreso-12', 'canaval-y-moreyra', 'sur', 3),
('super-expreso', 'canaval-y-moreyra', 'sur', 1),
('regular-c', 'canaval-y-moreyra', 'sur', 9);

-- ─── Aramburú ──────────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('super-expreso', 'aramburu', 'norte', 0),
('regular-c', 'aramburu', 'norte', 13),
('super-expreso', 'aramburu', 'sur', 2),
('regular-c', 'aramburu', 'sur', 10);

-- ─── Domingo Orué ──────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('regular-c', 'domingo-orue', 'norte', 12),
('regular-c', 'domingo-orue', 'sur', 11);

-- ─── Angamos ───────────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-1', 'angamos', 'norte', 4),
('expreso-3', 'angamos', 'norte', 1),
('expreso-5', 'angamos', 'norte', 2),
('expreso-8', 'angamos', 'norte', 7),
('expreso-9', 'angamos', 'norte', 2),
('lechucero', 'angamos', 'norte', 5),
('regular-c', 'angamos', 'norte', 11),
('expreso-1', 'angamos', 'sur', 4),
('expreso-5', 'angamos', 'sur', 10),
('expreso-6', 'angamos', 'sur', 5),
('expreso-7', 'angamos', 'sur', 4),
('expreso-8', 'angamos', 'sur', 7),
('expreso-9', 'angamos', 'sur', 4),
('expreso-12', 'angamos', 'sur', 4),
('super-expreso', 'angamos', 'sur', 3),
('lechucero', 'angamos', 'sur', 7),
('regular-c', 'angamos', 'sur', 12);

-- ─── Ricardo Palma ─────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-2', 'ricardo-palma', 'norte', 0),
('expreso-5', 'ricardo-palma', 'norte', 1),
('regular-c', 'ricardo-palma', 'norte', 10),
('expreso-2', 'ricardo-palma', 'sur', 3),
('expreso-5', 'ricardo-palma', 'sur', 11),
('lechucero', 'ricardo-palma', 'sur', 8),
('regular-c', 'ricardo-palma', 'sur', 13);

-- ─── Benavides ─────────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-3', 'benavides', 'norte', 0),
('expreso-8', 'benavides', 'norte', 8),
('expreso-9', 'benavides', 'norte', 1),
('regular-c', 'benavides', 'norte', 9),
('expreso-6', 'benavides', 'sur', 6),
('expreso-8', 'benavides', 'sur', 8),
('expreso-9', 'benavides', 'sur', 5),
('expreso-12', 'benavides', 'sur', 5),
('super-expreso', 'benavides', 'sur', 4),
('regular-c', 'benavides', 'sur', 14);

-- ─── 28 de Julio ───────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('regular-c', '28-de-julio', 'norte', 8),
('expreso-1', '28-de-julio', 'sur', 5),
('expreso-2', '28-de-julio', 'sur', 4),
('super-expreso', '28-de-julio', 'sur', 5),
('regular-c', '28-de-julio', 'sur', 15);

-- ─── Plaza de Flores ───────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-5', 'plaza-de-flores', 'norte', 0),
('expreso-8', 'plaza-de-flores', 'norte', 9),
('expreso-9', 'plaza-de-flores', 'norte', 0),
('regular-c', 'plaza-de-flores', 'norte', 7),
('expreso-5', 'plaza-de-flores', 'sur', 12),
('expreso-8', 'plaza-de-flores', 'sur', 9),
('regular-c', 'plaza-de-flores', 'sur', 16);

-- ─── Balta ─────────────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-1', 'balta', 'norte', 3),
('regular-c', 'balta', 'norte', 6),
('expreso-1', 'balta', 'sur', 6),
('lechucero', 'balta', 'sur', 9),
('regular-c', 'balta', 'sur', 17);

-- ─── Bulevar ───────────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('lechucero', 'bulevar', 'norte', 1),
('regular-c', 'bulevar', 'norte', 5),
('lechucero', 'bulevar', 'sur', 10),
('regular-c', 'bulevar', 'sur', 18);

-- ─── Estadio Unión ─────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-1', 'estadio-union', 'norte', 2),
('regular-c', 'estadio-union', 'norte', 4),
('expreso-1', 'estadio-union', 'sur', 7),
('regular-c', 'estadio-union', 'sur', 19);

-- ─── Escuela Militar ───────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('regular-c', 'escuela-militar', 'norte', 3),
('regular-c', 'escuela-militar', 'sur', 20);

-- ─── Fernando Terán ────────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-1', 'teran', 'norte', 1),
('regular-c', 'teran', 'norte', 2),
('expreso-1', 'teran', 'sur', 8),
('regular-c', 'teran', 'sur', 21);

-- ─── Rosario de Villa ──────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('regular-c', 'rosario-de-villa', 'norte', 1),
('regular-c', 'rosario-de-villa', 'sur', 22);

-- ─── Terminal Matellini ────────────────────────
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
('expreso-1', 'matellini', 'norte', 0),
('lechucero', 'matellini', 'norte', 0),
('regular-c', 'matellini', 'norte', 0),
('expreso-1', 'matellini', 'sur', 9),
('lechucero', 'matellini', 'sur', 11),
('regular-c', 'matellini', 'sur', 23);
