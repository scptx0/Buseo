# Despliegue de Funciones SQL — Buseo Fase 2

## Único paso manual requerido

### 1. Ejecutar migración SQL

Abrí el SQL Editor de Supabase y pegá el contenido completo del archivo:

**Archivo:** `supabase/migrations/001_functions.sql`  
**URL:** https://supabase.com/dashboard/project/yrxnbjusfnpdbdvibbnp/sql/new

Copiá TODO el contenido del archivo `.sql`, pegalo en el editor, y ejecutalo (Ctrl+Enter o botón "Run").

Esto creará:
- 6 funciones SQL (`get_stations`, `search_all_routes`, `get_route_nodes`, `segment_eta`, `start_trip`)
- 4 índices para rendimiento
- El job de `pg_cron` comentado (requiere habilitar la extensión)

### 2. Verificar

Después de ejecutar la migración, abrí la app. Al entrar a "Planear Ruta" debería cargar las 44 estaciones desde Supabase. Si ves "Cargando estaciones..." por más de 5 segundos, verificá que la migración se ejecutó correctamente.

### 3. (Opcional) Limpieza automática de rutas

Ejecutá por separado en el SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```
Y luego descomentá la línea `SELECT cron.schedule(...)` al final del archivo de migración.
