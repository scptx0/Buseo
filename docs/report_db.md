# Reporte de Base de Datos — Buseo (Supabase)

**Fecha:** 2026-08-08  
**Proyecto:** Metropolitano Lima — app de rutas, reportes y tiempo real  
**Host:** `yrxnbjusfnpdbdvibbnp.supabase.co`

---

## 1. Visión general

| # | Tabla | Filas | Función |
|---|-------|-------|---------|
| 1 | `stations` | 44 | Catálogo de estaciones del Metropolitano |
| 2 | `lines` | 20 | Líneas de bus (regular + expreso) |
| 3 | `line_stops` | 342 | Paradas por línea, dirección y orden |
| 4 | `segments` | 0 | Tramos entre estaciones consecutivas |
| 5 | `active_routes` | 0 | Rutas activas de usuarios |
| 6 | `route_history` | 0 | Historial de rutas tomadas |
| 7 | `users` | 0 | Perfiles de usuario |
| 8 | `reports` | 0 | Reportes de bus / estación / incidente |
| 9 | `aggregated_incidents` | 0 | Incidentes agrupados por IA |
| 10 | `feed_posts` | 0 | Posts del canal público |
| 11 | `comments` | 0 | Comentarios en posts del canal |
| 12 | `moderation_logs` | 0 | Registro de moderación |

---

## 2. Modelo detallado por tabla

### 2.1 `stations` — Estaciones

| Columna | Tipo | PK | Descripción |
|---------|------|:--:|------------|
| `id` | `int32` | ✓ | ID numérico secuencial (1–44) |
| `name` | `text` | | Nombre slug (ej. `naranjal`, `caqueta`) |
| `lat` | `double` | | Latitud |
| `lng` | `double` | | Longitud |
| `polygon` | `jsonb` | | Polígono geoespacial (⚠️ siempre `null`) |

**Relaciones salientes:**  
- Referenciada por `line_stops.station_id`, `segments.from_station`, `segments.to_station`, `route_history.origin`, `route_history.destination`, `active_routes.origin`, `active_routes.destination`

---

### 2.2 `lines` — Líneas de bus

| Columna | Tipo | PK | Descripción |
|---------|------|:--:|------------|
| `id` | `int32` | ✓ | 1–20 |
| `name` | `text` | | Nombre (ej. `regular-a`, `expreso-1`) |
| `directions` | `text[]` | | `["norte", "sur"]` o `["sur"]` |
| `path_norte_sur` | `jsonb` | | Array de strings con nombres de estaciones |
| `path_sur_norte` | `jsonb` | | Array de strings con nombres de estaciones |
| `schedule` | `jsonb` | | Horarios por dirección y día |

**Ejemplo (regular-a, id=17):**
```json
"path_norte_sur": ["naranjal", "izaguirre", "pacifico", "independencia", ..., "central"]
"path_sur_norte": ["central", "colmena", ..., "naranjal"]
"schedule": {"sur": {"lun-vie": [{"start": "05:35", "end": "23:00"}], ...}}
```

**20 líneas registradas:**
- 3 regulares: A (id=17), B (id=18), C (id=19) + D (id=20)
- 16 expresos + super-expresos + lechucero (id=1–16)

---

### 2.3 `line_stops` — Paradas por línea

| Columna | Tipo | PK | FK | Descripción |
|---------|------|:--:|:--:|------------|
| `line_id` | `int32` | ✓ | `lines.id` | Línea |
| `station_id` | `int32` | ✓ | `stations.id` | Estación |
| `direction` | `text` | ✓ | — | `"norte"` o `"sur"` |
| `stop_order` | `int32` | | — | Orden dentro de la línea/dirección |

**342 registros.** Ejemplo para `expreso-1 norte`:
```
stop_order 0 → station 44 (matellini)
stop_order 1 → station 42 (teran)
stop_order 2 → station 40 (estadio-union)
...
```

> ⚠️ Esta tabla es redundante con `lines.path_norte_sur` y `lines.path_sur_norte` que también almacenan el orden de estaciones como arrays de strings.

---

### 2.4 `segments` — Tramos

| Columna | Tipo | PK | FK | Descripción |
|---------|------|:--:|:--:|------------|
| `from_station` | `int32` | ✓ | `stations.id` | Estación origen |
| `to_station` | `int32` | ✓ | `stations.id` | Estación destino |
| `line_id` | `int32` | ✓ | `lines.id` | Línea |
| `distance_meters` | `double` | | — | Distancia en metros |

**⚠️ 0 registros.** Tabla vacía. No hay datos de distancias ni tiempos entre estaciones.

---

### 2.5 `active_routes` — Rutas activas

| Columna | Tipo | PK | FK |
|---------|------|:--:|:--:|
| `id` | `uuid` | ✓ | — |
| `user_id` | `uuid` | | ⚠️ sin FK |
| `origin` | `int32` | | `stations.id` |
| `destination` | `int32` | | `stations.id` |
| `steps` | `jsonb` | | Pasos de la ruta |
| `status` | `text` | | `"active"` (default) |
| `created_at` | `timestamptz` | | |

---

### 2.6 `route_history` — Historial

| Columna | Tipo | PK | FK |
|---------|------|:--:|:--:|
| `id` | `uuid` | ✓ | — |
| `user_id` | `uuid` | | `users.id` |
| `origin` | `int32` | | `stations.id` |
| `destination` | `int32` | | `stations.id` |
| `lines_used` | `int[]` | | IDs de líneas usadas |
| `created_at` | `timestamptz` | | |

---

### 2.7 `users` — Usuarios

| Columna | Tipo | PK |
|---------|------|:--:|
| `id` | `uuid` | ✓ |
| `display_name` | `text` | |
| `avatar_url` | `text` | |
| `preferences` | `jsonb` | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

---

### 2.8 `reports` — Reportes

| Columna | Tipo | PK | FK |
|---------|------|:--:|:--:|
| `id` | `uuid` | ✓ | — |
| `user_id` | `uuid` | | `users.id` |
| `type` | `text` | | `bus` / `station` / `incident` |
| `target_id` | `text` | | ⚠️ string genérico |
| `severity` | `text` | | `ok` / `warning` / `critical` |
| `description` | `text` | | Texto libre |
| `metadata` | `jsonb` | | Datos adicionales |
| `created_at` | `timestamptz` | | |

---

### 2.9 `aggregated_incidents` — Incidentes agrupados (IA)

| Columna | Tipo | PK | FK |
|---------|------|:--:|:--:|
| `id` | `uuid` | ✓ | — |
| `target_type` | `text` | | `station` / `segment` |
| `target_id` | `text` | | ⚠️ string genérico |
| `summary` | `text` | | Resumen generado por IA |
| `severity` | `text` | | |
| `report_ids` | `uuid[]` | | IDs de reportes fuente |
| `created_at` | `timestamptz` | | |

---

### 2.10 `feed_posts` — Canal público

| Columna | Tipo | PK | FK |
|---------|------|:--:|:--:|
| `id` | `uuid` | ✓ | — |
| `title` | `text` | | |
| `content` | `text` | | |
| `tags` | `text[]` | | |
| `incident_id` | `uuid` | | `aggregated_incidents.id` |
| `created_at` | `timestamptz` | | |

---

### 2.11 `comments` — Comentarios

| Columna | Tipo | PK | FK |
|---------|------|:--:|:--:|
| `id` | `uuid` | ✓ | — |
| `post_id` | `uuid` | | `feed_posts.id` |
| `parent_id` | `uuid` | | `comments.id` (auto-referencia) |
| `user_id` | `uuid` | | `users.id` |
| `content` | `text` | | |
| `created_at` | `timestamptz` | | |

---

### 2.12 `moderation_logs` — Moderación

| Columna | Tipo | PK | FK |
|---------|------|:--:|:--:|
| `id` | `uuid` | ✓ | — |
| `user_id` | `uuid` | | `users.id` |
| `action` | `text` | | |
| `reason` | `text` | | |
| `created_at` | `timestamptz` | | |

---

## 3. Diagrama de relaciones

```
users ─────────────┬─── active_routes ─────── stations
                   ├─── route_history ──────── stations
                   ├─── reports ────────────── (target_id genérico)
                   ├─── comments ───────────── feed_posts
                   └─── moderation_logs

lines ──┬────────── line_stops ────────────── stations
        └────────── segments ──────────────── stations

aggregated_incidents ─── feed_posts ──────── comments (auto-ref)
```

**PK compuestas:**
- `line_stops`: `(line_id, station_id, direction)`
- `segments`: `(from_station, to_station, line_id)`

---

## 4. Problemas identificados

### 🔴 Críticos

| # | Problema | Impacto |
|---|----------|---------|
| 1 | **`segments` vacía** — 0 registros. Sin distancias ni tiempos de viaje, el planificador de rutas no puede calcular ETAs ni comparar alternativas. | Bloquea la feature principal (planear ruta). |
| 2 | **IDs inconsistentes con el frontend** — `stations.id` es `int32` (1–44), pero nuestro `mockData.ts` usa slugs string (`"naranjal"`, `"caqueta"`). `lines.path_norte_sur` usa strings, `line_stops` usa ints. Hay dos sistemas de identificación coexistiendo. | El frontend no puede consumir la API sin un mapeo. |
| 3 | **`stations.polygon` siempre `null`** — 44 estaciones sin datos geoespaciales. Sin polígonos no se puede hacer detección de abordaje con Turf.js. | Bloquea la detección automática de llegada/salida. |

### 🟡 Medios

| # | Problema | Impacto |
|---|----------|---------|
| 4 | **Redundancia `lines.path_norte_sur` vs `line_stops`** — Ambas almacenan el orden de estaciones por línea/dirección. `line_stops` usa IDs numéricos; `lines.path` usa strings. Son fuentes de verdad contradictorias. | Riesgo de desincronización. |
| 5 | **`active_routes.user_id` sin FK** — No referencia `users.id`. | Inconsistencia de datos si se borra un usuario. |
| 6 | **`reports.target_id` y `aggregated_incidents.target_id` son `text` genérico** — Deberían ser FK condicionales (a `stations.id` o `segments`) según el `type`/`target_type`. Con `text` se puede insertar cualquier valor. | Imposible hacer joins confiables. |
| 7 | **Sin índice espacial** — `stations.lat`/`stations.lng` no tienen índice GiST. Las queries de "estación más cercana" escanean toda la tabla. | Rendimiento degradado con muchos usuarios. |
| 8 | **`segments` no tiene `estimated_time`** — Solo `distance_meters`. Sin tiempo estimado no se puede calcular ETA realista (el tráfico y paradas afectan). | Planificación imprecisa. |
| 9 | **La app usa slugs, la DB usa ints** — `mockData.ts` usa `"linea-a"`, `"naranjal"`, pero la DB real tiene `id=17` (`regular-a`), `id=7` (`naranjal`). Hay que migrar los IDs del frontend o crear una capa de traducción. | Fricción en la integración. |

### 🟢 Menores

| # | Problema | Impacto |
|---|----------|---------|
| 10 | **Tablas operativas vacías** — `users`, `active_routes`, `route_history`, `reports` sin datos de prueba. | Dificulta testear flujos completos. |
| 11 | **`lines.directions` vs `line_stops.direction`** — La misma información en dos lugares. | Redundancia. |
| 12 | **Sin tabla de posiciones GPS** — No existe tabla para `user_locations` ni `bus_positions` mencionadas en la arquitectura. | El tracking en tiempo real no tiene dónde persistir. |
| 13 | **`lines.schedule` usa strings para rangos horarios** — Ej: `{"lun-vie": [{"start": "05:35", "end": "23:00"}]}`. Sería mejor usar tipos nativos `time` o `timerange`. | Validación débil, difícil de consultar. |
| 14 | **`comments.parent_id` permite anidación infinita** — Sin límite de profundidad. | Riesgo de queries recursivas costosas. |

---

## 5. Recomendaciones (sin modificar la DB)

1. **Crear una capa de mapeo** `stationSlugToId` y `lineSlugToId` en el frontend para traducir entre el sistema de slugs del mock y los IDs numéricos de la DB.
2. **Poblar `segments`** con distancias y tiempos estimados antes de integrar el planificador.
3. **Poblar `stations.polygon`** con datos GeoJSON reales para habilitar Turf.js.
4. **Unificar el sistema de referencia**: elegir entre `lines.path_norte_sur` (strings) o `line_stops` (ints) como fuente única de verdad para el orden de estaciones.
5. **Agregar FK** en `active_routes.user_id → users.id`.
6. **Crear tablas de alta frecuencia**: `user_locations`, `bus_reports_raw`, `station_reports_raw` para tracking GPS.
7. **Agregar índices GiST** en `stations(lat, lng)` para queries de proximidad.
