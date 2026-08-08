-- ============================================================
-- Buseo — Fix: intercambiar path y schedule para líneas con dirección invertida
-- ============================================================

-- Primero: remover NOT NULL de path_norte_sur para permitir rutas unidireccionales
ALTER TABLE lines ALTER COLUMN path_norte_sur DROP NOT NULL;

-- Para líneas bidireccionales: intercambiar paths y schedules
UPDATE lines SET
  path_norte_sur = path_sur_norte,
  path_sur_norte = path_norte_sur,
  schedule = jsonb_build_object(
    'norte', schedule->'sur',
    'sur', schedule->'norte'
  )
WHERE id IN (1, 2, 4, 8, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20);

-- Para expreso-3 (id=3): solo tiene ruta S→N
-- Actualmente: path_norte_sur=[35,33,7], path_sur_norte=NULL
-- Después: path_norte_sur=NULL, path_sur_norte=[35,33,7]
UPDATE lines SET
  path_norte_sur = path_sur_norte,
  path_sur_norte = path_norte_sur
WHERE id = 3;
