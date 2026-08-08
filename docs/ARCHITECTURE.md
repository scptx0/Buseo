# Propuesta Técnica

## 1. Stack Tecnológico

| Capa | Tecnología | Rol |
|------|-----------|-----|
| **Frontend** | React 19 + Vite | Interfaz de usuario, mapas, geolocalización en tiempo real |
| **Backend** | Supabase (PostgreSQL + PostGIS + Edge Functions + Auth) | Persistencia, autenticación, lógica de negocio, API serverless |
| **Tiempo real** | Portal (`@portalsdk/react` / `@portalsdk/admin`) | Canales broadcast, inbox per-user, infraestructura de eventos en vivo |
| **IA** | AWS Bedrock (modelo por definir; candidato DeepSeek v3.2) | Agrupación de reportes, filtrado de falsos positivos, generación de resúmenes |
| **Base de datos operativa** | PostgreSQL + PostGIS (Supabase) | Datos estructurados: estaciones, corredores, rutas, usuarios, reportes consolidados |
| **Base de datos de alta velocidad** | Amazon DynamoDB | Posiciones GPS en bruto, estados temporales de buses, reportes en caliente antes de procesar |
| **Mapas y rutas** | Google Maps JavaScript API + Routes API | Renderizado, polylines, cálculo de tiempos estimados |
| **Geoespacial** | Turf.js | Buffer de corredores, punto-en-polígono, cálculos de proximidad y vector de movimiento |
| **Hosting** | Vercel (frontend) + Supabase (backend) | Despliegue serverless, escalado automático |

---

## 2. Arquitectura General

El sistema opera en tres planos diferenciados:

- **Plano de persistencia:** Supabase PostgreSQL como fuente de verdad para estaciones, corredores, rutas, usuarios e incidentes consolidados.
- **Plano de alta frecuencia:** DynamoDB absorbe el volumen de escrituras de ubicación GPS y reportes instantáneos sin bloquear PostgreSQL.
- **Plano de tiempo real:** Portal recibe publicaciones desde Supabase Edge Functions y las distribuye a clientes conectados vía canales e inbox.

El frontend se suscribe directamente a Portal para recibir eventos en vivo, mientras que consulta Supabase vía REST/GraphQL para operaciones CRUD y datos estáticos. Las Edge Functions de Supabase actúan como orquestadoras: validan reglas de negocio, invocan AWS Bedrock, escriben en DynamoDB cuando el volumen lo amerita, y publican resultados a Portal.

---

## 3. Supabase — Esquema y Lógica Serverless

### 3.1 Base de Datos (PostgreSQL + PostGIS)

| Tabla | Propósito | Notas clave |
|-------|-----------|-------------|
| `users` | Perfiles, preferencias | Vinculado a Supabase Auth (`auth.users`) |
| `stations` | Estaciones del Metropolitano | Campo `polygon` tipo `GEOMETRY(POLYGON)` PostGIS, líneas asociadas |
| `segments` | Tramos entre estaciones consecutivas | `corridor` tipo `GEOMETRY(POLYGON)` (buffer del corredor), tiempo estimado |
| `lines` | Líneas A, B, C, Expresos | Lista ordenada de `station_ids` |
| `active_routes` | Rutas activas por usuario | Estado, estaciones, líneas, timestamp de inicio |
| `route_history` | Últimas rutas del usuario | Para autocompletar búsquedas |
| `reports_incident` | Incidentes validados | Tipo, descripción, tramo, expiración |
| `aggregated_incidents` | Incidentes agrupados por IA | Resumen generado por Bedrock, reportes relacionados |
| `feed_posts` | Publicaciones del Canal | Derivadas de incidentes agrupados, tags, reacciones |
| `comments` | Comentarios jerárquicos | `parent_id` para anidación |
| `moderation_logs` | Reportes de moderación | Contadores por usuario, bloqueos temporales |

### 3.2 Row Level Security (RLS)

Todas las tablas con datos sensibles operan con políticas RLS:
- `active_routes`: usuario solo lee/escribe su propia ruta.
- `reports_incident`: lectura pública, inserción solo para usuarios autenticados.
- `route_history`: acceso restringido al `user_id` propietario.

### 3.3 Edge Functions (Deno)

Reemplazan un backend tradicional. Se despliegan en Supabase y se invocan desde el frontend o por triggers de base de datos.

| Endpoint | Método | Responsabilidad |
|----------|--------|-----------------|
| `/portal-token` | POST | Valida sesión Supabase, firma JWT para Portal |
| `/routes/search` | GET | Calcula rutas posibles origen-destino con transbordos |
| `/routes/activate` | POST | Activa ruta, valida que no exista otra activa |
| `/routes/deactivate` | DELETE | Desactiva ruta manual o automáticamente |
| `/reports/bus` | POST | Recibe reporte de bus, escribe en DynamoDB + PostgreSQL |
| `/reports/station` | POST | Recibe reporte de estación, valida polígono PostGIS |
| `/reports/incident` | POST | Recibe incidente de tramo, inicia pipeline de IA |
| `/buses/aggregate` | POST | Orquesta agregación de posiciones desde DynamoDB |
| `/feed/generate` | POST | Invoca Bedrock para generar resumen de incidentes agrupados |
| `/moderation/report` | POST | Registra reporte de comentario, evalúa umbral de bloqueo |

---

## 4. DynamoDB — Datos de Alta Velocidad

DynamoDB complementa PostgreSQL en escenarios de escritura masiva y datos efímeros.

| Tabla | Clave de partición | Clave de orden | Atributos | TTL |
|-------|-------------------|----------------|-----------|-----|
| `user_locations` | `user_id` | `timestamp` | `lat`, `lng`, `speed`, `route_id` | 24 horas |
| `bus_reports_raw` | `line_id` | `timestamp` | `user_id`, `occupancy`, `lat`, `lng` | 1 hora |
| `station_reports_raw` | `station_id` | `timestamp` | `user_id`, `queue_level`, `occupancy`, `comment` | 6 horas |
| `bus_inferred_positions` | `line_id` | `bus_id` | `lat`, `lng`, `occupancy_avg`, `confidence`, `last_update` | 30 minutos |

**Patrón de uso:**
1. El frontend envía ubicación cada 5-10 segundos a una Edge Function.
2. La Edge Function escribe en DynamoDB (baja latencia, sin bloquear PostgreSQL).
3. Un proceso periódico (Edge Function programada o trigger) lee ventanas de tiempo de DynamoDB, infiere posiciones de buses, y publica el resultado en Portal.
4. TTL elimina automáticamente datos obsoletos.

---

## 5. Portal — Infraestructura de Tiempo Real

Portal es el único canal de distribución de eventos en vivo. No se usa Supabase Realtime para evitar duplicidad de infraestructura.

### 5.1 Canales (Broadcast)

| Canal | Patrón | Publicado por | Consumido por | Payload |
|-------|--------|---------------|---------------|---------|
| Reportes por estación | `station:{station_id}` | Edge Function (tras validación) | Usuarios con ruta activa que pasa por la estación | `{ type, severity, summary, timestamp }` |
| Reportes por tramo | `segment:{a}:{b}` | Edge Function | Usuarios en ruta activa dentro del tramo | `{ incident_summary, delay_minutes }` |
| Posiciones de buses | `buses:{line_id}` | Edge Function (agregación DynamoDB) | Módulo "¿Dónde están los buses?" | `{ bus_id, lat, lng, occupancy, eta_next_station }` |
| Estado de línea | `line:{line_id}:status` | Edge Function | Planear ruta, Tu ruta actual | `{ incidents[], delays[], updated_at }` |
| Feed global | `feed:global` | Edge Function (post generado por IA) | Módulo Canal | `{ post_id, summary, tags }` |

### 5.2 Inbox (Notificaciones Per-User)

| Evento | Contenido | Disparador |
|--------|-----------|------------|
| Incidente en ruta | `"Incidente reportado en {estación}"` | Reporte validado en estación/tramo de la ruta activa |
| Cercanía a destino | `"Estás cerca de {estación}"` | Entrada al polígono de estación final |
| Ruta inactiva | `"¿Sigues en tu ruta?"` | Timeout: sin ubicación en corredor ni estación por X minutos |
| Bloqueo por moderación | `"Tus comentarios han sido bloqueados"` | Umbral de 5+ reportes contra el usuario |

**Flujo de autenticación con Portal:**
1. Usuario inicia sesión en Supabase Auth.
2. Frontend solicita `/portal-token` a Edge Function.
3. Edge Function verifica JWT de Supabase, firma nuevo JWT con `user_id`, y lo retorna.
4. Frontend inicializa Portal con ese token: `portal.setToken(jwt)`.

---

## 6. AWS Bedrock — Motor de Inteligencia

Bedrock procesa reportes en bruto para generar inteligencia accionable. Se invoca desde Edge Functions de Supabase mediante el SDK de AWS.

### 6.1 Casos de Uso

| Caso | Entrada | Salida | Frecuencia |
|------|---------|--------|------------|
| **Agrupación de incidentes** | Lote de reportes de texto de un tramo/estación (últimos 15 min) | JSON con grupos de reportes similares, gravedad inferida, resumen consolidado | Cada 5 minutos o al acumular N reportes |
| **Filtro anti-falsos-positivos** | Texto libre de reporte de estación o incidente | Clasificación: `relevante` / `irrelevante` / `spam` + justificación | En tiempo real al recibir reporte |
| **Generación de posts para el Canal** | Incidente agrupado con metadata | Título, descripción narrativa, tags sugeridos | Tras consolidar un grupo de incidentes |
| **Inferencia de múltiples buses** | Reportes de ocupación + ubicaciones dentro de un radio de 100m | Determinación: `mismo_bus` / `buses_distintos` + nivel de confianza | Cada ciclo de agregación (30-60s) |

### 6.2 Modelo Recomendado

**Modelo por definir, candidato DeepSeek v3.2** (vía Bedrock) para tareas de razonamiento y
agrupación de texto. Al momento de escribir esto aún no se fija: decidir antes de la Fase 3 y
registrarlo en `docs/STATUS.md`. Para clasificación rápida de falsos positivos puede evaluarse
un modelo de menor latencia.

### 6.3 Pipeline de Reportes

```
Reporte crudo (frontend)
    → DynamoDB (almacenamiento temporal)
    → Edge Function (recolecta ventana de tiempo)
    → Bedrock (agrupación + filtrado)
    → PostgreSQL (incidente consolidado guardado)
    → Portal (publicación a canal correspondiente)
```

---

## 7. Frontend — Componentes y Hooks

### 7.1 Estructura

```
src/
├── app/
│   ├── page.tsx                    # Menú principal
│   ├── planear-ruta/page.tsx       # Búsqueda origen-destino
│   ├── ruta-actual/page.tsx        # Vista gráfica con nodos y tramos
│   ├── reporte/bus/page.tsx
│   ├── reporte/estacion/page.tsx
│   ├── reporte/incidente/page.tsx
│   ├── buses/page.tsx              # ¿Dónde están los buses?
│   └── canal/page.tsx              # Feed y detalle
├── components/
│   ├── map/
│   │   ├── RouteMap.tsx
│   │   ├── StationNode.tsx
│   │   ├── SegmentLine.tsx
│   │   └── UserMarker.tsx
│   ├── route/
│   │   ├── RouteGraph.tsx
│   │   └── RouteStepList.tsx
│   ├── report/
│   │   ├── OccupancySlider.tsx
│   │   └── ReportPanel.tsx
│   └── LocationGate.tsx            # Bloqueo si GPS está apagado
├── hooks/
│   ├── useGeolocation.ts           # Watchdog GPS con watchPosition
│   ├── useUserState.ts             # Máquina de estados: EN_ESTACIÓN → ESPERANDO_BUS → EN_BUS
│   ├── useBoardingDetection.ts     # Lógica de abordaje con Turf.js
│   ├── usePortalChannels.ts        # Suscripción a canales Portal
│   └── useNearestStation.ts        # Cálculo con Turf.js + datos de Supabase
└── lib/
    ├── portal.ts
    ├── supabase.ts
    ├── geo.ts                      # Turf.js helpers
    └── api.ts                      # Cliente hacia Edge Functions
```

### 7.2 Geolocalización y Detección de Estado

La lógica de detección de abordaje (sección 7 de la especificación) reside principalmente en el frontend:

- `navigator.geolocation.watchPosition()` con `enableHighAccuracy: true`.
- Turf.js calcula: `booleanPointInPolygon` (estación/corredor), `bearing` (vector de salida), `nearestPointOnLine` (progreso hacia siguiente nodo).
- Velocidad sostenida evaluada en ventana de 15-20 segundos.
- Estados ambiguos mantienen bandera `ESPERANDO_CONFIRMACIÓN` sin forzar transiciones.

Los polígonos de estaciones y corredores se cargan una vez desde Supabase y se cachean en `IndexedDB`.

---

## 8. Flujos de Datos Clave

### 8.1 Planear Ruta y Activar

1. Frontend carga estaciones desde Supabase (cache local).
2. Usuario selecciona origen y destino.
3. Frontend solicita `/routes/search` a Edge Function.
4. Edge Function consulta PostgreSQL (estaciones, líneas, segmentos) y calcula rutas posibles con transbordos.
5. Resultado ordenado por tiempo estimado (Google Routes API o tiempos almacenados en `segments`).
6. Usuario selecciona ruta; frontend envía `/routes/activate`.
7. Edge Function valida que no exista otra ruta activa, crea registro en `active_routes`.

### 8.2 Reporte de Incidente en Tiempo Real

1. Usuario envía reporte desde frontend.
2. Edge Function valida autenticación y datos mínimos.
3. Bedrock clasifica el texto: si es `irrelevante`, se descarta con feedback al usuario.
4. Si es válido, se escribe en `reports_incident` (PostgreSQL) y `station_reports_raw` (DynamoDB).
5. Edge Function evalúa si hay reportes similares recientes en el mismo tramo/estación.
6. Si se alcanza umbral, invoca Bedrock para agrupar y generar resumen.
7. Resultado guardado en `aggregated_incidents`.
8. Edge Function publica en canal Portal correspondiente (`station:{id}` o `segment:{a}:{b}`).
9. Clientes suscritos reciben actualización inmediata; nodos/tramos cambian a naranja.

### 8.3 ¿Dónde están los buses?

1. Usarios con ruta activa envían ubicación periódicamente.
2. Edge Function recibe lat/lng, valida que esté dentro de un corredor (`segments.corridor` PostGIS).
3. Escribe en DynamoDB `user_locations`.
4. Proceso de agregación (cada 10-30s) lee ventana de DynamoDB, filtra por `line_id`.
5. Bedrock infiere si reportes cercanos corresponden al mismo bus o a varios.
6. Posiciones inferidas publicadas en canal `buses:{line_id}`.
7. Frontend suscrito a ese canal actualiza marcadores en tiempo real.

---

## 9. Fases de Implementación

### Fase 1 — Fundamento
- Setup Vite + React + Supabase + Portal SDK.
- Configurar autenticación Supabase (email/social).
- Edge Function `/portal-token` para integrar auth con Portal.
- Cargar datos estáticos de estaciones y líneas en PostgreSQL + PostGIS.
- Pantalla principal y LocationGate (bloqueo sin GPS).
- Módulo "Planear ruta" con búsqueda y detalle.

### Fase 2 — Tiempo Real y Reportes
- Geolocalización continua y cálculo de estación más cercana.
- Módulo "Tu ruta actual": nodos, tramos, marcador de usuario.
- Conexión a canales Portal para reportes por estación y tramo.
- Formularios de reporte (bus, estación, incidente).
- Escritura en DynamoDB para datos de alta frecuencia.
- Módulo "¿Dónde están los buses?" con suscripción a canales de posición.

### Fase 3 — Inteligencia y Corredores
- Generación de polígonos de corredores con Turf.js (buffer de polylines Google Routes API).
- Almacenar corredores en PostGIS (`segments.corridor`).
- Lógica de detección de abordaje con máquina de estados.
- Integración AWS Bedrock: filtro de falsos positivos y agrupación de reportes.
- Agregación de posiciones de buses desde DynamoDB.
- Desactivación automática de ruta al llegar a destino.

### Fase 4 — Canal y Moderación
- Feed del Canal con posts generados por Bedrock.
- Comentarios jerárquicos y reacciones.
- Sistema de moderación: reportes de comentarios, bloqueos temporales.
- Flush automatizado de reportes antiguos (DynamoDB TTL + PostgreSQL cron).
- Notificaciones push via Portal inbox.

---

## 10. Factibilidad y Consideraciones

### Ventajas de esta arquitectura

- **Supabase reduce operación:** Auth, base de datos, funciones serverless y seguridad (RLS) en una sola plataforma. No se gestiona infraestructura de servidores ni conexiones a PostgreSQL.
- **DynamoDB desacopla la carga de escritura:** Las ubicaciones GPS y reportes instantáneos no impactan el rendimiento de PostgreSQL. TTL automatiza la limpieza.
- **Bedrock ofrece modelos enterprise sin gestionar infraestructura de IA:** el modelo elegido
  (candidato DeepSeek v3.2) maneja bien el razonamiento sobre texto en español para agrupar reportes.
- **Portal mantiene el stack de tiempo real simple:** Sin WebSockets propios, sin gestión de reconexiones ni escalado de sockets.

### Consideraciones técnicas

- **Costo de Bedrock:** La agrupación de reportes cada pocos minutos genera invocaciones constantes. Para el MVP, puede acumularse un lote de reportes antes de invocar el modelo, reduciendo costo.
- **Latencia de Edge Functions + Bedrock:** El filtrado en tiempo real de reportes individuales puede añadir 500ms-2s. Para el MVP, el filtro puede aplicarse en batch cada 30-60 segundos en lugar de síncrono por reporte.
- **DynamoDB desde Supabase Edge Functions:** Requiere configurar IAM Role o credenciales AWS en variables de entorno de Supabase. Es un patrón estándar pero requiere atención a permisos.
- **PostGIS en Supabase:** Soportado nativamente. Las consultas de `booleanPointInPolygon` y nearest neighbor deben indexarse con `GIST` para mantener latencia baja en producción.

### Conclusión

La arquitectura es viable y escala sin fricciones mayores. Supabase cubre el 80% de las necesidades de backend tradicional. DynamoDB actúa como cola operativa para datos efímeros de alta velocidad. AWS Bedrock aporta la capa de inteligencia sin requerir infraestructura propia de modelos. Portal permanece como el eje central de la experiencia en tiempo real, exactamente como el proyecto lo requiere.