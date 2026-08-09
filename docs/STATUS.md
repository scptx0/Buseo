# STATUS — Estado del proyecto

> **Propósito:** bitácora de avance compartida por todo el equipo. Dice **cómo va** el proyecto.
> Este archivo es humano, no técnico: no contiene IDs de entornos, secretos ni contratos.
> Información técnica: contratos en `docs/CONTRACTS.md`, arquitectura en `docs/ARCHITECTURE.md`,
> funcional en `docs/SPEC.md`, diseño en `docs/DESIGN.md`.
> Se actualiza al cerrar cada hito.

## Alcance del MVP (hackathon)

5 módulos: **Menú**, **Planear ruta**, **Tu ruta actual**, **Reporte**, **¿Dónde están los buses?**
— con **Portal realtime real**, **Google Maps real**, **Supabase Edge Function + AWS Bedrock**
(alimentando la IA de reportes), datos de mocks para estaciones/rutas. Visual según `DESIGN.md`
(línea de viaje).

**Incluido en la hackathon:**
- Fase 0–2 (base, menú, planear ruta, tiempo real, reportes, buses) — núcleo de la app.
- Fase 3 **IA**: Supabase Edge Function que valida reportes, llama a AWS Bedrock
  (filtro anti-falsos-positivos + agrupación de incidentes) y publica el resultado a Portal.
- Fase 3.5 **Corredores y abordaje**: polígonos de corredor con Turf (buffer sobre
  polylines), punto-en-polígono y detección de abordaje/descenso + desactivación automática
  al llegar a destino.

**Fuera del alcance:** solo el módulo **Canal** (Fase 4) y el sistema de moderación asociado.
Quedan como *seam* documentado para una futura versión (ver "Fase 4" más abajo).

## Tablero de avance

| Paso | Descripción | Estado |
|------|-------------|--------|
| W0 | Setup del repo para el MVP (deps, rutas base, inicio de UI) | ☑ |
| W1 | Portón de entrada GPS (`LocationGate`) + ubicación + estación más cercana | ☑ |
| W2 | Planear ruta: buscar origen/destino, lista por tiempo, activar | ☑ |
| W3 | Línea de viaje (SVG) + mapa | ☐ |
| W4 | Buses en tiempo real (marcadores, clustering) | ☐ |
| W5 | Canal de reportes (lista, creación, filtros) | ☐ |
| W6 | Pantalla de perfil + configuración de nombre | ☐ |
| W7 | Integrar credenciales reales (maps, Supabase, Portal) | ☐ |
| W8 | QA en celular, bug-fixing, pulido final | ☐ |
| W4 | Tu ruta actual + avisos en vivo (estación/tramo) | ☐ |
| W5 | Reportes de bus / estación / incidente | ☐ |
| W6 | ¿Dónde están los buses? (seguimiento en vivo) | ☐ |
| W7 | Pulido: verificación (build/typecheck) + demo 2 pestañas | ☐ |
| W8 | Corredores (Turf) + detección de abordaje/descenso | ☐ |

## Estado por fase

### Fase 0 — Base ✅
- ☑️ Scaffold Vite + React 19 + TS con tipo estricto.
- ☑️ Estructura `src/`, mocks en `src/lib/mockData.ts`, `.env.example`, `.gitignore`.
- ☑️ Debe instalarse: `@googlemaps/js-api-loader`, `@portalsdk/react`, `@supabase/supabase-js`, `@turf/turf`.
- ☑️ Portal configurado y probado de punta a punta (canal `hello-world` en vivo).
- ☑️ Docs: `AGENTS.md`, `SPEC.md`, `DESIGN.md`, `ARCHITECTURE.md`, `STATUS.md`, `CONTRACTS.md`.
- ☑️ Build y typecheck verificados.

### Fase 1 — Menú y Planear ruta (W0–W2) ✅
- ☑️ Pantalla principal (saludo + acceso a los 5 módulos).
- ☑️ Portón de entrada GPS.
- ☑️ Búsqueda de origen/destino con estación más cercana.
- ☑️ Lista de rutas ordenadas por tiempo, detalle y activación.

### Fase 2 — Tiempo real y reportes (W3–W6)
- ✅ Resultados de rutas: contador de incidentes en vivo por ruta (carga desde
  Supabase + canal Portal `reportes:global` + polling de respaldo 10s).
- ✅ Detalle de ruta: botón de reportes con overlay de todos los reportes e
  iconos de incidentes en nodos de estaciones y en tramos del grafo.
- ✅ Incidentes solo entre estaciones consecutivas: el formulario filtra la
  estación 2 por adyacencia y `submit_report` valida el par en `segments`.
- ✅ Canal: nombres de estación en vez de ids y botón de filtro por tipo de
  incidente (Demora/Incidente/Cierre) y por estación o tramo.
- ☐ Línea de viaje + mapa.
- ☐ Tu ruta actual: nodos/tramos y marcador en vivo.
- ☐ suscripción a canales de estación/tramo.
- ☐ Reportes de bus/estación/incidente.
- ☐ ¿Dónde están los buses?

### Fase 3 — Inteligencia (Bedrock + Supabase Edge Function) 🎯 en alcance
- ☐ Edge Function `reportes-ia`: recibir reporte → filtrar falsos positivos → agrupar por
      estación/tramo → publicar resumen a Portal.
- ☐ Conexión AWS Bedrock (modelo por definir; candidato DeepSeek v3.2) desde la Edge Function.
- ☐ Consumo del resumen en "Tu ruta actual": nodos/tramos naranjas agrupados por IA.
- ☐ TDB (tabla) en Supabase para reportes consolidados (semilla de la persistencia).

### Fase 3.5 — Corredores y abordaje 🎯 en alcance
- ☐ Corredores con Turf (buffer sobre polylines) y punto-en-polígono.
- ☐ Detección de abordaje / descenso.
- ☐ Desactivar ruta automáticamente al llegar.

### Fase 4 — Canal y moderación (futuro / fuera de alcance)
- ☐ Feed del Canal · ☐ comentarios · ☐ moderación · ☐ flush.

## Decisiones de producto pendientes

> Preguntas que deben resolver **el equipo** (no los agentes). Ver también `docs/SPEC.md`.

- Definir la lista cerrada de "tipos de incidente" para el formulario de reporte.
- Umbral de densidad (usuarios que reportan) para considerar una estación llena.
- Duración del bloqueo por comentarios ofensivos.
- Frecuencia y mecanismo del flush semanal de datos.
- Umbrales de velocidad/gradillas para la detección de abordaje.
- Ancho del buffer por tramo (corredores).

## Dónde se guardan las credenciales

| Servicio | Quién lo provee | Uso |
|----------|-----------------|-----|
| Portal | owner (ya activo) | Realtime (cliente + backend) |
| Google Maps | owner | Mapa y rutas (cliente) |
| Supabase | owner | Edge Function + tablas (backend) |
| AWS Bedrock | owner (ya tiene acceso) | IA de reportes (solo en la Edge Function) |

Los **valores reales** viven solo en `.env.local` (gitignored) y en las variables de entorno de
Supabase/AWS. Nombres de variable: ver `.env.example`. Nunca commitear valores.

## Cómo verificar

- Después de cada W: `npm run typecheck` y `npm run build`.
- Demo final: en 2 pestañas, reportar un problema en una y ver el nodo ponerse naranja en la
  otra en vivo (Portal + Bedrock).
- Bonus: con posición simulada, recorrer un corredor y ver el cambio de estado
  "esperando bus → en bus" (detección de abordaje).

## Corriendo

- `npm run dev` — desarrollo.
- `npm run build` / `npm run typecheck` — verificación.