# Test — Ruta actual con punto rojo (progreso del usuario)

Implementación del monitoreo de avance del usuario sobre su ruta en la pantalla **Ruta actual**.
El punto rojo oscuro representa la ubicación del usuario y avanza proporcionalmente sobre el grafo.

## Cómo funciona

- Se calcula el **camino plano** de la ruta (todos los nodos de todos los pasos en orden).
- Con cada fix GPS se proyecta el punto del usuario sobre cada arista consecutive `[i, i+1]`.
- **Activación:** el punto rojo **no aparece** hasta que el usuario esté dentro del radio
  del nodo **origen** (`AT_STATION_RADIUS_M = 55 m`). Antes, el grafo queda como siempre.
- Una vez activo, para cada arista `[i, i+1]` se calcula la **proyección punto-segmento**:
  `t = clamp(dot(P−A, B−A) / |B−A|², 0, 1)` (en coordenadas lat/lng planas — válido cerca
  de Lima donde 1° lat/lng ≈ 111 km). Se elige la arista con **menor distancia**
  de proyección, y `frac = t`.
- `progress = (i + frac) / (N − 1)`, con guarda **monótona** (nunca retrocede).
- Si el usuario está dentro del radio de un nodo **intermedio** → **snap** a ese nodo.
- Al llegar al destino (`dist ≤ radio`) → `progress = 1`.
- El render interpola `y = TOP_PAD + progress · (N−1) · ROW_H` (los nodos están alineados
  verticalmente en `x = LEFT_PAD`, así que interpolar Y coincide exactamente con la arista).
- El punto rojo se **suaviza** con un lerp (`SMOORTH_LERP = 0.18`) vía `requestAnimationFrame`
  para que se deslice, no salte.

## Modo demo (datos inyectados)

Como no se puede probar con GPS real de escritorio, se inyecta una **traza GPS simulada**
que **asume que ya estás tomando tu ruta**: arranca en el **origen** y recorre la ruta hasta
el **destino** a velocidad **real** según los `duration_seconds` de la tabla `segments`
en Supabase (ej. tramo 10→25 línea 5 = 14 min → el punto tarda 14 min reales en cruzarlo).

- **Tiempo total** = suma de `duration_seconds` de cada arista de la ruta (según línea).
- Si una arista no existe en `segments`, se usa un fallback de 120 s.
- El punto avanza linealmente dentro de cada tramo (velocidad constante) — realista del
  corredor exclusivo del Metropolitano.
- **Velocidad de reproducción** configurable para test rápido:
  ```js
  // tiempo real (default)
  localStorage.setItem('buseo:demoRate', '1')
  // 60x más rápido (test en segundos)
  localStorage.setItem('buseo:demoRate', '60')
  ```

### Cómo activar el modo demo

Agrega `?demo=1` a la URL de Ruta actual, o en la consola del navegador:

```js
localStorage.setItem('buseo:demo', '1'); location.reload()
```

Para desactivarlo:

```js
localStorage.removeItem('buseo:demo'); location.reload()
```

## Ruta sugerida para el test

Para ver bien el avance, usa una ruta **larga** con varios nodos intermedios.

1. Entra a **Planear**.
2. Elige una ruta con **≥ 6 estaciones**, por ejemplo:
   - **Origen:** Naranjal → **Destino:** Central (línea **Regular A**, sentido sur).
   - Alternativa corta: **Caquetá → Central**.
3. Confirma la ruta (botón *Guardar / Iniciar*).
4. Ve a **Ruta actual**.
5. Sigue las instrucciones de *Modo demo* (agrega `?demo=1`).

Deberías ver:
- El **punto rojo oscuro** aparece en el origen y desciende por el grafo hasta el
  destino a velocidad real. Sin texto de estado (solo el punto).
- Al **entrar al último tramo** (a una estación del destino), el navegador lanza una
  notificación: *"Ya vas a llegar a tu destino en X minutos"* ( X = `duration_seconds`
  del último tramo). Si las notificaciones estaban en `default`, se pide permiso.

## Archivos nuevos / modificados

- `src/lib/routePath.ts` — `flattenRoute()`: aplana la ruta con `row` + lat/lng.
- `src/lib/userProgress.ts` — `computeProgress()`: cálculo haversine + monotocidad.
- `src/lib/demoTrace.ts` — `startDemoTrace()`: reproductor de traza simulada.
- `src/hooks/useUserProgress.ts` — hook que une GPS demo, progreso y smoothing.
- `src/app/planear/RouteGraphView.tsx` — render del punto rojo.
- `src/app/ruta-actual/page.tsx` — conecta el hook y muestra estado.
- `src/index.css` — estilos del punto rojo y pill de estado.

## Notas

- Decisión: **haversine puro** (sin Google Maps). El grafo es esquemático (x constante);
  snapping a la calzada no aporta nada. Google Roads sería overkill y costaría cuota.
- La lógica de polígonos de `lib/portal/gps.ts` se deja intacta; el nuevo flujo usa
  solo `lat/lng` central de cada estación vía `flattenRoute`.
- `useUserProgress` corre **en paralelo** a `useGpsTracking` (pings Portal); no lo reemplaza.