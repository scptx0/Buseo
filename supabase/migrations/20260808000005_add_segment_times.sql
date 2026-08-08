ALTER TABLE segments ADD COLUMN duration_seconds integer;
ALTER TABLE segments ADD COLUMN estimated_time_minutes integer;

-- Línea A
UPDATE segments SET duration_seconds = 344, estimated_time_minutes = 6 WHERE from_station = 7 AND to_station = 8 AND line_id = 17;
UPDATE segments SET duration_seconds = 102, estimated_time_minutes = 2 WHERE from_station = 8 AND to_station = 9 AND line_id = 17;
UPDATE segments SET duration_seconds = 69, estimated_time_minutes = 1 WHERE from_station = 9 AND to_station = 10 AND line_id = 17;
UPDATE segments SET duration_seconds = 43, estimated_time_minutes = 1 WHERE from_station = 10 AND to_station = 11 AND line_id = 17;
UPDATE segments SET duration_seconds = 159, estimated_time_minutes = 3 WHERE from_station = 11 AND to_station = 12 AND line_id = 17;
UPDATE segments SET duration_seconds = 196, estimated_time_minutes = 3 WHERE from_station = 12 AND to_station = 13 AND line_id = 17;
UPDATE segments SET duration_seconds = 330, estimated_time_minutes = 6 WHERE from_station = 13 AND to_station = 14 AND line_id = 17;
UPDATE segments SET duration_seconds = 490, estimated_time_minutes = 8 WHERE from_station = 14 AND to_station = 15 AND line_id = 17;
UPDATE segments SET duration_seconds = 513, estimated_time_minutes = 9 WHERE from_station = 15 AND to_station = 16 AND line_id = 17;
UPDATE segments SET duration_seconds = 377, estimated_time_minutes = 6 WHERE from_station = 16 AND to_station = 17 AND line_id = 17;
UPDATE segments SET duration_seconds = 298, estimated_time_minutes = 5 WHERE from_station = 17 AND to_station = 18 AND line_id = 17;
UPDATE segments SET duration_seconds = 323, estimated_time_minutes = 5 WHERE from_station = 18 AND to_station = 20 AND line_id = 17;
UPDATE segments SET duration_seconds = 613, estimated_time_minutes = 10 WHERE from_station = 20 AND to_station = 23 AND line_id = 17;
UPDATE segments SET duration_seconds = 725, estimated_time_minutes = 12 WHERE from_station = 23 AND to_station = 24 AND line_id = 17;
UPDATE segments SET duration_seconds = 356, estimated_time_minutes = 6 WHERE from_station = 24 AND to_station = 25 AND line_id = 17;

-- Línea B
UPDATE segments SET duration_seconds = 315, estimated_time_minutes = 5 WHERE from_station = 1 AND to_station = 2 AND line_id = 18;
UPDATE segments SET duration_seconds = 318, estimated_time_minutes = 5 WHERE from_station = 2 AND to_station = 3 AND line_id = 18;
UPDATE segments SET duration_seconds = 203, estimated_time_minutes = 3 WHERE from_station = 3 AND to_station = 4 AND line_id = 18;
UPDATE segments SET duration_seconds = 125, estimated_time_minutes = 2 WHERE from_station = 4 AND to_station = 5 AND line_id = 18;
UPDATE segments SET duration_seconds = 242, estimated_time_minutes = 4 WHERE from_station = 5 AND to_station = 6 AND line_id = 18;
UPDATE segments SET duration_seconds = 505, estimated_time_minutes = 8 WHERE from_station = 6 AND to_station = 7 AND line_id = 18;
UPDATE segments SET duration_seconds = 191, estimated_time_minutes = 3 WHERE from_station = 17 AND to_station = 19 AND line_id = 18;
UPDATE segments SET duration_seconds = 67, estimated_time_minutes = 1 WHERE from_station = 19 AND to_station = 21 AND line_id = 18;
UPDATE segments SET duration_seconds = 322, estimated_time_minutes = 5 WHERE from_station = 21 AND to_station = 22 AND line_id = 18;
UPDATE segments SET duration_seconds = 318, estimated_time_minutes = 5 WHERE from_station = 22 AND to_station = 25 AND line_id = 18;

-- Línea C
UPDATE segments SET duration_seconds = 88, estimated_time_minutes = 1 WHERE from_station = 25 AND to_station = 26 AND line_id = 19;
UPDATE segments SET duration_seconds = 57, estimated_time_minutes = 1 WHERE from_station = 26 AND to_station = 27 AND line_id = 19;
UPDATE segments SET duration_seconds = 48, estimated_time_minutes = 1 WHERE from_station = 27 AND to_station = 28 AND line_id = 19;
UPDATE segments SET duration_seconds = 120, estimated_time_minutes = 2 WHERE from_station = 28 AND to_station = 29 AND line_id = 19;
UPDATE segments SET duration_seconds = 68, estimated_time_minutes = 1 WHERE from_station = 29 AND to_station = 30 AND line_id = 19;
UPDATE segments SET duration_seconds = 52, estimated_time_minutes = 1 WHERE from_station = 30 AND to_station = 31 AND line_id = 19;
UPDATE segments SET duration_seconds = 318, estimated_time_minutes = 5 WHERE from_station = 31 AND to_station = 32 AND line_id = 19;
UPDATE segments SET duration_seconds = 392, estimated_time_minutes = 7 WHERE from_station = 32 AND to_station = 33 AND line_id = 19;
UPDATE segments SET duration_seconds = 330, estimated_time_minutes = 6 WHERE from_station = 33 AND to_station = 34 AND line_id = 19;
UPDATE segments SET duration_seconds = 47, estimated_time_minutes = 1 WHERE from_station = 34 AND to_station = 35 AND line_id = 19;
UPDATE segments SET duration_seconds = 28, estimated_time_minutes = 0 WHERE from_station = 35 AND to_station = 36 AND line_id = 19;
UPDATE segments SET duration_seconds = 72, estimated_time_minutes = 1 WHERE from_station = 36 AND to_station = 37 AND line_id = 19;
UPDATE segments SET duration_seconds = 314, estimated_time_minutes = 5 WHERE from_station = 37 AND to_station = 38 AND line_id = 19;
UPDATE segments SET duration_seconds = 747, estimated_time_minutes = 12 WHERE from_station = 38 AND to_station = 39 AND line_id = 19;
UPDATE segments SET duration_seconds = 503, estimated_time_minutes = 8 WHERE from_station = 39 AND to_station = 40 AND line_id = 19;
UPDATE segments SET duration_seconds = 190, estimated_time_minutes = 3 WHERE from_station = 40 AND to_station = 41 AND line_id = 19;
UPDATE segments SET duration_seconds = 323, estimated_time_minutes = 5 WHERE from_station = 41 AND to_station = 42 AND line_id = 19;
UPDATE segments SET duration_seconds = 52, estimated_time_minutes = 1 WHERE from_station = 42 AND to_station = 43 AND line_id = 19;
UPDATE segments SET duration_seconds = 423, estimated_time_minutes = 7 WHERE from_station = 43 AND to_station = 44 AND line_id = 19;
