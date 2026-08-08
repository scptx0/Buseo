-- ============================================================
-- Buseo — Migración: stations con id numérico
-- ============================================================

-- ═══════════════════════════════════════════════════
-- 1. ELIMINAR TABLAS QUE REFERENCIAN stations
-- ═══════════════════════════════════════════════════

DROP TABLE IF EXISTS line_stops CASCADE;
DROP TABLE IF EXISTS segments CASCADE;
DROP TABLE IF EXISTS active_routes CASCADE;
DROP TABLE IF EXISTS route_history CASCADE;
DROP TABLE IF EXISTS stations CASCADE;

-- ═══════════════════════════════════════════════════
-- 2. RECREAR STATIONS CON ID NUMÉRICO
-- ═══════════════════════════════════════════════════

CREATE TABLE stations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  polygon JSONB
);

-- ═══════════════════════════════════════════════════
-- 3. RECREAR LINE_STOPS CON STATION_ID INTEGER
-- ═══════════════════════════════════════════════════

CREATE TABLE line_stops (
  line_id INTEGER REFERENCES lines(id) ON DELETE CASCADE,
  station_id INTEGER REFERENCES stations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('norte', 'sur')),
  stop_order INTEGER NOT NULL,
  PRIMARY KEY (line_id, station_id, direction)
);

CREATE INDEX idx_line_stops_station ON line_stops(station_id);
CREATE INDEX idx_line_stops_line ON line_stops(line_id);

-- ═══════════════════════════════════════════════════
-- 4. RECREAR SEGMENTS CON STATION IDs INTEGER
-- ═══════════════════════════════════════════════════

CREATE TABLE segments (
  from_station INTEGER REFERENCES stations(id),
  to_station INTEGER REFERENCES stations(id),
  line_id INTEGER REFERENCES lines(id),
  distance_meters DOUBLE PRECISION,
  PRIMARY KEY (from_station, to_station, line_id)
);

CREATE INDEX idx_segments_from ON segments(from_station);
CREATE INDEX idx_segments_to ON segments(to_station);

-- ═══════════════════════════════════════════════════
-- 5. RECREAR ACTIVE_ROUTES CON INTEGER
-- ═══════════════════════════════════════════════════

CREATE TABLE active_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  origin INTEGER REFERENCES stations(id),
  destination INTEGER REFERENCES stations(id),
  steps JSONB,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_active_routes_user ON active_routes(user_id);

-- ═══════════════════════════════════════════════════
-- 6. RECREAR ROUTE_HISTORY CON INTEGER
-- ═══════════════════════════════════════════════════

CREATE TABLE route_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  origin INTEGER REFERENCES stations(id),
  destination INTEGER REFERENCES stations(id),
  lines_used INTEGER[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_route_history_user ON route_history(user_id);

-- ═══════════════════════════════════════════════════
-- SEED: STATIONS (id numérico, name = id text anterior)
-- Orden: norte a sur, igual que el archivo original
-- ═══════════════════════════════════════════════════

INSERT INTO stations (name, lat, lng, polygon) VALUES
('chimpu-ocllo', -11.896386, -77.03743, NULL),
('los-incas', -11.915449, -77.048052, NULL),
('andres-belaunde', -11.935048, -77.056403, NULL),
('22-de-agosto', -11.946645, -77.060592, NULL),
('las-vegas', -11.954885, -77.059925, NULL),
('universidad', -11.962783, -77.062314, NULL),
('naranjal', -11.98259, -77.058706, NULL),
('izaguirre', -11.989526, -77.056969, NULL),
('pacifico', -11.99476, -77.056085, NULL),
('independencia', -11.998489, -77.055262, NULL),
('los-jazmines', -12.00168, -77.054864, NULL),
('tomas-valle', -12.006676, -77.05395, NULL),
('el-milagro', -12.011229, -77.052935, NULL),
('honorio-delgado', -12.017861, -77.051436, NULL),
('uni', -12.023357, -77.049769, NULL),
('parque-del-trabajo', -12.029878, -77.044205, NULL),
('caqueta', -12.036364, -77.04366, NULL),
('ramon-castilla', -12.043976, -77.041472, NULL),
('2-de-mayo', -12.047405, -77.042681, NULL),
('tacna', -12.046525, -77.037216, NULL),
('quilca', -12.051502, -77.042307, NULL),
('espana', -12.057767, -77.041733, NULL),
('jiron-de-la-union', -12.048388, -77.034247, NULL),
('colmena', -12.052377, -77.032914, NULL),
('central', -12.057661, -77.035973, NULL),
('estadio-nacional', -12.068592, -77.032122, NULL),
('mexico', -12.076622, -77.028973, NULL),
('canada', -12.082242, -77.026665, NULL),
('javier-prado', -12.089966, -77.023191, NULL),
('canaval-y-moreyra', -12.096455, -77.024887, NULL),
('aramburu', -12.10344, -77.027382, NULL),
('domingo-orue', -12.108526, -77.026417, NULL),
('angamos', -12.113139, -77.025939, NULL),
('ricardo-palma', -12.118356, -77.026035, NULL),
('benavides', -12.12511, -77.024203, NULL),
('28-de-julio', -12.129396, -77.022829, NULL),
('plaza-de-flores', -12.136401, -77.018673, NULL),
('balta', -12.140887, -77.017748, NULL),
('bulevar', -12.148398, -77.020121, NULL),
('estadio-union', -12.153355, -77.019642, NULL),
('escuela-militar', -12.159453, -77.018905, NULL),
('teran', -12.168793, -77.018591, NULL),
('rosario-de-villa', -12.172704, -77.015422, NULL),
('matellini', -12.17893, -77.009938, NULL);

-- ═══════════════════════════════════════════════════
-- SEED: LINE_STOPS (con station_id numérico)
-- station_id: chimpu-ocllo=1, los-incas=2, ..., matellini=44
-- ═══════════════════════════════════════════════════

-- Chimpu Ocllo (1)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(13, 1, 'norte', 2),
(18, 1, 'norte', 19),
(18, 1, 'sur', 0);

-- Los Incas (2)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(11, 2, 'norte', 6),
(13, 2, 'norte', 1),
(18, 2, 'norte', 18),
(11, 2, 'sur', 0),
(18, 2, 'sur', 1);

-- Andrés Belaunde (3)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(11, 3, 'norte', 5),
(18, 3, 'norte', 17),
(11, 3, 'sur', 1),
(13, 3, 'sur', 1),
(18, 3, 'sur', 2);

-- 22 de Agosto (4)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(11, 4, 'norte', 4),
(18, 4, 'norte', 16),
(11, 4, 'sur', 2),
(14, 4, 'sur', 0),
(15, 4, 'sur', 0),
(18, 4, 'sur', 3);

-- Las Vegas (5)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(11, 5, 'norte', 3),
(11, 5, 'sur', 3),
(15, 5, 'sur', 1),
(18, 5, 'sur', 4);

-- Universidad (6)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(11, 6, 'norte', 2),
(18, 6, 'norte', 15),
(11, 6, 'sur', 4),
(14, 6, 'sur', 1),
(15, 6, 'sur', 2),
(18, 6, 'sur', 5);

-- Naranjal (7)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(2, 7, 'norte', 3),
(4, 7, 'norte', 2),
(5, 7, 'norte', 12),
(11, 7, 'norte', 1),
(13, 7, 'norte', 2),
(14, 7, 'norte', 4),
(15, 7, 'norte', 4),
(16, 7, 'norte', 11),
(17, 7, 'norte', 15),
(18, 7, 'norte', 14),
(20, 7, 'norte', 14),
(2, 7, 'sur', 0),
(5, 7, 'sur', 0),
(10, 7, 'sur', 0),
(13, 7, 'sur', 0),
(14, 7, 'sur', 2),
(15, 7, 'sur', 3),
(16, 7, 'sur', 0),
(17, 7, 'sur', 0),
(18, 7, 'sur', 6),
(20, 7, 'sur', 0);

-- Izaguirre (8)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(5, 8, 'norte', 11),
(8, 8, 'norte', 0),
(17, 8, 'norte', 14),
(18, 8, 'norte', 13),
(20, 8, 'norte', 13),
(5, 8, 'sur', 1),
(6, 8, 'sur', 0),
(8, 8, 'sur', 9),
(16, 8, 'sur', 1),
(17, 8, 'sur', 1),
(18, 8, 'sur', 7),
(20, 8, 'sur', 1);

-- Pacífico (9)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(17, 9, 'norte', 13),
(18, 9, 'norte', 12),
(20, 9, 'norte', 12),
(11, 9, 'sur', 5),
(17, 9, 'sur', 2),
(18, 9, 'sur', 8),
(20, 9, 'sur', 2);

-- Independencia (10)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(8, 10, 'norte', 1),
(17, 10, 'norte', 12),
(18, 10, 'norte', 11),
(20, 10, 'norte', 11),
(6, 10, 'sur', 1),
(8, 10, 'sur', 8),
(17, 10, 'sur', 3),
(18, 10, 'sur', 9),
(20, 10, 'sur', 3);

-- Los Jazmines (11)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(17, 11, 'norte', 11),
(18, 11, 'norte', 10),
(20, 11, 'norte', 10),
(17, 11, 'sur', 4),
(18, 11, 'sur', 10),
(20, 11, 'sur', 4);

-- Tomás Valle (12)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(5, 12, 'norte', 10),
(8, 12, 'norte', 2),
(16, 12, 'norte', 9),
(17, 12, 'norte', 10),
(18, 12, 'norte', 9),
(20, 12, 'norte', 9),
(5, 12, 'sur', 2),
(7, 12, 'sur', 0),
(8, 12, 'sur', 7),
(16, 12, 'sur', 2),
(17, 12, 'sur', 5),
(18, 12, 'sur', 11),
(20, 12, 'sur', 5);

-- El Milagro (13)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(17, 13, 'norte', 9),
(18, 13, 'norte', 8),
(20, 13, 'norte', 8),
(17, 13, 'sur', 6),
(18, 13, 'sur', 12),
(20, 13, 'sur', 6);

-- Honorio Delgado (14)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(17, 14, 'norte', 8),
(18, 14, 'norte', 7),
(20, 14, 'norte', 7),
(17, 14, 'sur', 7),
(18, 14, 'sur', 13),
(20, 14, 'sur', 7);

-- UNI (15)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(5, 15, 'norte', 9),
(8, 15, 'norte', 3),
(9, 15, 'norte', 8),
(16, 15, 'norte', 8),
(17, 15, 'norte', 7),
(18, 15, 'norte', 6),
(20, 15, 'norte', 6),
(5, 15, 'sur', 3),
(8, 15, 'sur', 6),
(9, 15, 'sur', 0),
(13, 15, 'sur', 2),
(16, 15, 'sur', 3),
(17, 15, 'sur', 8),
(18, 15, 'sur', 14),
(20, 15, 'sur', 8);

-- Parque del Trabajo (16)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(17, 16, 'norte', 6),
(18, 16, 'norte', 5),
(20, 16, 'norte', 5),
(17, 16, 'sur', 9),
(18, 16, 'sur', 15),
(20, 16, 'sur', 9);

-- Caquetá (17)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(5, 17, 'norte', 8),
(9, 17, 'norte', 7),
(17, 17, 'norte', 5),
(18, 17, 'norte', 4),
(20, 17, 'norte', 4),
(5, 17, 'sur', 4),
(9, 17, 'sur', 1),
(10, 17, 'sur', 1),
(17, 17, 'sur', 10),
(18, 17, 'sur', 16),
(20, 17, 'sur', 10);

-- Ramón Castilla (18)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(17, 18, 'norte', 4),
(19, 18, 'norte', 23),
(10, 18, 'sur', 2),
(16, 18, 'sur', 4),
(17, 18, 'sur', 11),
(19, 18, 'sur', 0);

-- Dos de Mayo (19)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(14, 19, 'norte', 3),
(15, 19, 'norte', 3),
(18, 19, 'norte', 3),
(20, 19, 'norte', 3),
(14, 19, 'sur', 3),
(15, 19, 'sur', 4),
(18, 19, 'sur', 17),
(20, 19, 'sur', 11);

-- Tacna (20)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(17, 20, 'norte', 3),
(19, 20, 'norte', 22),
(10, 20, 'sur', 3),
(17, 20, 'sur', 12),
(19, 20, 'sur', 1);

-- Quilca (21)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(14, 21, 'norte', 2),
(15, 21, 'norte', 2),
(18, 21, 'norte', 2),
(20, 21, 'norte', 2),
(14, 21, 'sur', 4),
(15, 21, 'sur', 5),
(18, 21, 'sur', 18),
(20, 21, 'sur', 12);

-- España (22)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(5, 22, 'norte', 7),
(9, 22, 'norte', 6),
(14, 22, 'norte', 1),
(15, 22, 'norte', 1),
(18, 22, 'norte', 1),
(20, 22, 'norte', 1),
(5, 22, 'sur', 5),
(14, 22, 'sur', 5),
(15, 22, 'sur', 6),
(18, 22, 'sur', 19),
(20, 22, 'sur', 13);

-- Jirón de la Unión (23)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(16, 23, 'norte', 7),
(17, 23, 'norte', 2),
(19, 23, 'norte', 21),
(10, 23, 'sur', 4),
(16, 23, 'sur', 5),
(17, 23, 'sur', 13),
(19, 23, 'sur', 2);

-- Colmena (24)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(17, 24, 'norte', 1),
(19, 24, 'norte', 20),
(10, 24, 'sur', 5),
(17, 24, 'sur', 14),
(19, 24, 'sur', 3);

-- Estación Central (25)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(1, 25, 'norte', 8),
(5, 25, 'norte', 6),
(8, 25, 'norte', 4),
(9, 25, 'norte', 5),
(11, 25, 'norte', 0),
(13, 25, 'norte', 0),
(14, 25, 'norte', 0),
(15, 25, 'norte', 0),
(17, 25, 'norte', 0),
(18, 25, 'norte', 0),
(19, 25, 'norte', 19),
(20, 25, 'norte', 0),
(1, 25, 'sur', 0),
(5, 25, 'sur', 6),
(6, 25, 'sur', 2),
(7, 25, 'sur', 1),
(8, 25, 'sur', 4),
(10, 25, 'sur', 6),
(11, 25, 'sur', 6),
(12, 25, 'sur', 0),
(13, 25, 'sur', 3),
(14, 25, 'sur', 6),
(15, 25, 'sur', 7),
(17, 25, 'sur', 15),
(18, 25, 'sur', 20),
(19, 25, 'sur', 4),
(20, 25, 'sur', 14);

-- Estadio Nacional (26)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(1, 26, 'norte', 7),
(19, 26, 'norte', 18),
(1, 26, 'sur', 1),
(12, 26, 'sur', 1),
(19, 26, 'sur', 5);

-- México (27)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(19, 27, 'norte', 17),
(19, 27, 'sur', 6);

-- Canadá (28)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(2, 28, 'norte', 2),
(5, 28, 'norte', 5),
(16, 28, 'norte', 6),
(19, 28, 'norte', 16),
(2, 28, 'sur', 1),
(5, 28, 'sur', 7),
(9, 28, 'sur', 2),
(16, 28, 'sur', 6),
(19, 28, 'sur', 7);

-- Javier Prado (29)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(1, 29, 'norte', 6),
(2, 29, 'norte', 1),
(5, 29, 'norte', 4),
(8, 29, 'norte', 5),
(9, 29, 'norte', 4),
(19, 29, 'norte', 15),
(1, 29, 'sur', 2),
(2, 29, 'sur', 2),
(5, 29, 'sur', 8),
(6, 29, 'sur', 3),
(7, 29, 'sur', 2),
(8, 29, 'sur', 5),
(12, 29, 'sur', 2),
(19, 29, 'sur', 8);

-- Canaval y Moreyra (30)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(1, 30, 'norte', 5),
(5, 30, 'norte', 3),
(8, 30, 'norte', 6),
(9, 30, 'norte', 3),
(13, 30, 'norte', 1),
(19, 30, 'norte', 14),
(1, 30, 'sur', 3),
(5, 30, 'sur', 9),
(6, 30, 'sur', 4),
(7, 30, 'sur', 3),
(8, 30, 'sur', 6),
(9, 30, 'sur', 3),
(12, 30, 'sur', 3),
(13, 30, 'sur', 1),
(19, 30, 'sur', 9);

-- Aramburú (31)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(13, 31, 'norte', 0),
(19, 31, 'norte', 13),
(13, 31, 'sur', 2),
(19, 31, 'sur', 10);

-- Domingo Orué (32)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(19, 32, 'norte', 12),
(19, 32, 'sur', 11);

-- Angamos (33)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(1, 33, 'norte', 4),
(4, 33, 'norte', 1),
(5, 33, 'norte', 2),
(8, 33, 'norte', 7),
(9, 33, 'norte', 2),
(16, 33, 'norte', 5),
(19, 33, 'norte', 11),
(1, 33, 'sur', 4),
(5, 33, 'sur', 10),
(6, 33, 'sur', 5),
(7, 33, 'sur', 4),
(8, 33, 'sur', 7),
(9, 33, 'sur', 4),
(12, 33, 'sur', 4),
(13, 33, 'sur', 3),
(16, 33, 'sur', 7),
(19, 33, 'sur', 12);

-- Ricardo Palma (34)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(2, 34, 'norte', 0),
(5, 34, 'norte', 1),
(19, 34, 'norte', 10),
(2, 34, 'sur', 3),
(5, 34, 'sur', 11),
(16, 34, 'sur', 8),
(19, 34, 'sur', 13);

-- Benavides (35)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(4, 35, 'norte', 0),
(8, 35, 'norte', 8),
(9, 35, 'norte', 1),
(19, 35, 'norte', 9),
(6, 35, 'sur', 6),
(8, 35, 'sur', 8),
(9, 35, 'sur', 5),
(12, 35, 'sur', 5),
(13, 35, 'sur', 4),
(19, 35, 'sur', 14);

-- 28 de Julio (36)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(19, 36, 'norte', 8),
(1, 36, 'sur', 5),
(2, 36, 'sur', 4),
(13, 36, 'sur', 5),
(19, 36, 'sur', 15);

-- Plaza de Flores (37)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(5, 37, 'norte', 0),
(8, 37, 'norte', 9),
(9, 37, 'norte', 0),
(19, 37, 'norte', 7),
(5, 37, 'sur', 12),
(8, 37, 'sur', 9),
(19, 37, 'sur', 16);

-- Balta (38)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(1, 38, 'norte', 3),
(19, 38, 'norte', 6),
(1, 38, 'sur', 6),
(16, 38, 'sur', 9),
(19, 38, 'sur', 17);

-- Bulevar (39)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(16, 39, 'norte', 1),
(19, 39, 'norte', 5),
(16, 39, 'sur', 10),
(19, 39, 'sur', 18);

-- Estadio Unión (40)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(1, 40, 'norte', 2),
(19, 40, 'norte', 4),
(1, 40, 'sur', 7),
(19, 40, 'sur', 19);

-- Escuela Militar (41)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(19, 41, 'norte', 3),
(19, 41, 'sur', 20);

-- Fernando Terán (42)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(1, 42, 'norte', 1),
(19, 42, 'norte', 2),
(1, 42, 'sur', 8),
(19, 42, 'sur', 21);

-- Rosario de Villa (43)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(19, 43, 'norte', 1),
(19, 43, 'sur', 22);

-- Terminal Matellini (44)
INSERT INTO line_stops (line_id, station_id, direction, stop_order) VALUES
(1, 44, 'norte', 0),
(16, 44, 'norte', 0),
(19, 44, 'norte', 0),
(1, 44, 'sur', 9),
(16, 44, 'sur', 11),
(19, 44, 'sur', 23);
