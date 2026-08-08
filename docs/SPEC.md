# Especificación funcional

## 0. Información general

- **Nombre del proyecto:** -
- **Objetivo:** App web para planear rutas del Metropolitano (Lima, Perú), reportar incidentes y ver la ubicación de buses en tiempo real, usando **Portal** (https://docs.useportal.co/) como motor de datos en tiempo real.

### Fuentes de datos necesarias

|Dato|Fuente sugerida|Detalle requerido|
|---|---|---|
|Estaciones|Google Maps / ATU|Coordenadas + polígono delimitador (para saber si el usuario está dentro), nombre, línea(s) de bus que pasan por ahí|
|Rutas|Google Maps|Trayecto completo entre estaciones|
|Buses (líneas: A, B, C, Expresos 1, 2, etc.) y paradas|ATU|Asociación línea ↔ paradas|

### Reglas de ubicación (transversales a toda la app)

- La ubicación debe estar **siempre activada** mientras se usa la app, incluso en segundo plano.
- Debe existir una pantalla que enfatice esto: **sin ubicación activada, no se puede usar la app**.
- La ubicación del usuario **no es exacta** → siempre considerar su radio/margen de error al hacer cálculos (dentro/fuera de polígono, estación más cercana, etc.).

---

## 1. Pantalla principal (menú)

Saluda: `Hola <usuario>`. Opciones:

1. Planear ruta
2. Tu ruta actual
3. Reporte
4. ¿Dónde están los buses?
5. Canal

---

## 2. Módulo "Planear ruta"

### Búsqueda de trayecto

- Título: **¿A dónde vamos?**
- Selección de **Estación 1 (origen)** y **Estación 2 (destino)** — ambos campos obligatorios, vía dropdown.
    - Origen se autocompleta con la estación más cercana a la ubicación actual (si está disponible), pero siempre editable manualmente.
- Se muestran las **últimas 3 rutas** del usuario (reusar) o botón "Buscar rutas".
- Lista de rutas posibles, ordenada por **tiempo estimado de llegada**. Cada ítem:
    - Al seleccionarse, muestra detalle del trayecto.
    - Ícono en tiempo real que indica si hay reportes en esa ruta.

### Detalle de ruta e incidentes

- Instrucciones paso a paso (ej. "En estación X: tomar A hacia estación Y" → "En estación Y: tomar C hacia estación Z").
- Alerta si la ruta tiene incidentes ("Esta ruta tiene incidentes").
- Reportes en tiempo real dentro del trayecto (estaciones y tramos), generados por IA que agrupa reportes similares de usuarios en un solo reporte de incidente (ojo, no solo uno general, sino un por incidente).

### Verificaciones al presionar "Aceptar"

- El sistema revisa si el usuario ya tiene una ruta activa:
    - Si sí, y quiere cambiar: se pregunta si desea desactivar la actual y activar la nueva.
- **Confirmación final** + botón para volver al panel principal.

---

## 3. Módulo "Tu ruta actual"

### Sin ruta activa

- Mensaje: _"Parece que aún no tienes una ruta actual"_ + botón a "Planear ruta".

### Con ruta activa (vista gráfica)

- **Marcador de ubicación actual**, actualizado en tiempo real (Google Maps), de forma referencial.
- **Nodos** = estaciones de la ruta:
    - Verde = normal.
    - Naranja = con reporte activo (+ ícono de alerta).
- **Líneas punteadas** = tramos entre estaciones:
    - Resaltadas en naranja  + icono de alerta = hay reporte en ese tramo.
- Línea horizontal cruzando el nodo donde el usuario debe bajar (si hay estaciones intermedias; no aplica en la estación final).
- Nombre de estación visible en cada nodo.
- Todo se actualiza en tiempo real (si un reporte se elimina, el nodo/tramo vuelve a verde).

**Interacciones:**

- Click en nodo verde → estado de la estación ("Todo en orden").
- Click en nodo/tramo naranja → panel lateral con todos los reportes de la ruta, agrupados por estación/tramo (ya agrupados por IA si son similares).

**Otros elementos:**

- Tiempo estimado de llegada a la estación final (abajo de la pantalla), calculado con ubicación actual + tiempos estimados por tramo (Google Maps).
- Botón de notificaciones (arriba a la izquierda) a activar, para avisar:
    - Aparición de nodos/tramos naranjas en la ruta actual.
    - Cercanía a la estación final.
- Botón para **desactivar ruta actual** en cualquier momento (además del botón para volver al panel principal).
- La ruta se **desactiva automáticamente** si se detecta que el usuario ya está en la estación final (vía polígono + ubicación).

---

## 4. Módulo "Reporte"

### 4.1 Estado de mi bus

- Requiere ruta activa y que estemos dentro de un bus; si no, mensaje: _"Para reportar el estado de tu bus, primero debes planear una ruta y haber subido a algun bus"_ + botón a "Planear ruta" o al panel principal.
- Formulario:
    - Ícono de info → _"Este reporte es para reportar el estado del bus en el que te encuentras"_.
    - Ruta tomada automáticamente de la "ruta actual".
    - Pregunta: _¿Qué tan lleno está el bus?_ (escala 1–10).
- Casos según cantidad de reportes:
    - **0 reportes:** solo se conoce ubicación (según agregación de rutas activas) y línea del bus.
    - **1 reporte:** ubicación (basada en la del usuario) + línea + nivel de llenado.
    - **Varios reportes cercanos:** se debe inferir si es el mismo bus o buses distintos:
        - Rango de distancia (ej. 100 m) → dentro del rango = mismo bus (ubicación = promedio de ubicaciones dentro del rango).
        - Reportes muy contradictorios (ej. "lleno" vs "vacío") → asumir buses diferentes.
- Toda esta info alimenta el módulo "¿Dónde están los buses?".
- **No** alimenta la IA de incidentes (no son reportes de incidente).

### 4.2 Estado de una estación

- Verificar que el usuario esté dentro del polígono de una estación.
- Ícono de info → _"Este reporte es para reportar el estado de la estación en la que te encuentras"_.
- Si está en la estación:
    - _¿Qué bus esperas?_ (dropdown) — opcional.
    - _¿Qué tan larga es la cola?_ (1–10) — opcional.
    - _¿Qué tan llena está la estación?_ (1–10) — opcional.
    - Campo de texto libre opcional para comentar incidente/observaciones.

	Las 3 primeras preguntas son opcionales, ya que el usuario podria simplemente querer reportar un incidente en la estacion, sin dar informacion sobre el estado de la estacion.
- El nivel de ocupación de la estación también se puede inferir automáticamente por densidad de usuarios en el polígono, sin necesidad de reporte explícito.
- **Sí** alimenta la IA de incidentes (que filtra comentarios irrelevantes para evitar falsos positivos).

### 4.3 Incidente en la ruta

- Ícono de info → _"Este reporte es para reportar un incidente que ocurrió en alguna parte de la ruta"_.
- Selección de Estación 1 y Estación 2 (tramo donde ocurrió).
- Tipo de incidente (dropdown — tipos por definir).
- Caja de texto para describir el incidente.
- **Sí** alimenta la IA de incidentes (con el mismo filtro anti-falsos-positivos).

---

## 5. Módulo "¿Dónde están los buses?"

- Preguntas iniciales:
    - ¿En qué estación te encuentras? (autocompletada con la más cercana, editable).
    - ¿Qué bus esperas? (dropdown filtrado según la estación elegida).
- Botón "Ver buses" → misma interfaz visual que "Tu ruta actual" (nodos, tramos, reportes al click), pero mostrando **todos los buses de la línea seleccionada**, no solo el de la ruta del usuario.
    - Datos (ubicación, estado, reportes) en tiempo real, obtenidos de reportes de usuarios y, si no hay reporte, de la agregación de rutas activas de la misma línea.
    - Se muestra tiempo estimado de llegada (la estación elegida = destino).
- Botón para volver al panel principal → al salir, se debe **dejar de transmitir/consumir datos en tiempo real** de esta vista.

---

## 6. Módulo "Canal" (futuro / no bloqueante para MVP)

- Feed de reportes generados por IA (mismos que aparecen en "Tu ruta actual" y "¿Dónde están los buses?", pero agregados de todos los usuarios).
- Botón **Filtrar** por:
    - Tipo de reporte (estado de estación, incidente en ruta).
    - Ubicación (estación o tramo).
    - Fecha/hora.
- Cada publicación: resumen, tags, reacciones.
- Al abrir una publicación: título, descripción detallada (combinación de reportes similares), reacciones.
- Comentarios con jerarquía (respuestas anidadas) y reacciones por comentario.
- Moderación: reportar comentarios ofensivos → 5+ reportes contra un usuario = bloqueo temporal de comentarios (con notificación al bloqueado).
- Limpieza semanal (flush) de reportes antiguos para mantener info actualizada.

---

## 7. Lógica: ¿el usuario está en un bus o no? (sin reporte explícito)

Esta lógica corre de forma continua mientras hay una ruta activa, y complementa (no reemplaza) el reporte manual "Estado de mi bus".

### 7.1 Requisito previo: corredor por tramo

Para toda esta lógica se necesita, por cada tramo entre estaciones consecutivas, un **polígono de corredor** (buffer alrededor del carril segregado del Metropolitano) — ver sección de "Delimitación de tramos" más abajo. Esto es distinto del polígono de la estación en sí.

### 7.2 Cuándo aparece el marcador del usuario en "Tu ruta actual"

- **No aparece** si el usuario no está dentro del polígono de ninguna estación de la ruta.
- **Aparece** cuando entra al polígono de una estación de la ruta o está en medio de la ruta, y a partir de ahí se sigue actualizando en tiempo real mientras se mueve — incluyendo mientras viaja dentro del corredor de un tramo (no solo dentro de polígonos de estación), para que el marcador efectivamente recorra la línea punteada.

### 7.3 Señales para detectar que abordó un bus (tras salir de una estación)

Ninguna señal por sí sola es suficiente; se combinan para reducir falsos positivos/negativos:

1. **Dirección de salida.** El vector de movimiento tras salir del polígono apunta hacia el corredor del carril exclusivo (zona de abordaje), no hacia una salida peatonal (calle, vereda, otro edificio).
2. **Velocidad sostenida.** Pasa de velocidad de caminata (~4-6 km/h) a velocidad de vehículo (>15-20 km/h) de forma sostenida por varios segundos — no un solo punto GPS aislado. El campo `speed` de la Geolocation API del navegador ayuda aquí; si no está disponible, se calcula con distancia/tiempo entre lecturas.
3. **Contención en el corredor durante una ventana de gracia.** No decidir con la primera lectura tras salir del polígono. Dar una ventana (ej. 15-20 segundos o 30-50 metros) y evaluar toda la trayectoria en ese lapso: si se mantiene dentro del buffer del corredor y avanza hacia el siguiente nodo → confirma abordaje.
4. **Progreso hacia el siguiente nodo de la ruta planeada.** El movimiento debe ser congruente con el trayecto planeado, no cualquier desplazamiento.
5. **Cruce con reportes/otros usuarios.** Si la posición coincide con la de un bus ya reportado (por otro usuario de la misma línea), sube la confianza de que efectivamente está en un bus.

### 7.4 Señales para detectar que salió de la estación SIN abordar

Son básicamente el reverso de las señales anteriores, evaluadas en la misma ventana de gracia:

1. Se mantiene a velocidad de caminata después de salir del polígono (no acelera a velocidad de vehículo).
2. El vector de movimiento se desvía del corredor de forma consistente (no es solo ruido de GPS puntual) — ej. camina por una vereda paralela.
3. Se queda estático fuera del polígono y fuera del corredor (ej. fue a comprar algo cerca).
4. Se aleja de la ruta planeada en vez de avanzar hacia el siguiente nodo.

### 7.5 Qué hacer cuando las señales son ambiguas

- **No decidir de inmediato.** Mantener un estado intermedio ("esperando confirmación") mientras las señales no sean claras.
- **Timeout de inactividad de ruta.** Si pasan X minutos sin que el usuario esté ni en un polígono de estación de la ruta ni avanzando dentro de un corredor, sugerir (no forzar) desactivar la ruta: _"Parece que ya no estás en tu ruta, ¿deseas desactivarla?"_. Mejor preguntar que desactivar automáticamente, para evitar cancelaciones por errores puntuales de GPS.
- **Notificación como último recurso.** Solo si la ambigüedad se sostiene por mucho tiempo, mandar una notificación liviana tipo _"¿ya estás en el bus?"_ — nunca como mecanismo principal, sino como red de seguridad, para no interrumpir demasiado al usuario.

### 7.6 Reevaluación continua, no un flag binario

La detección no debe fijarse una sola vez ("ya subió, listo"). Debe reevaluarse constantemente durante todo el trayecto, para poder detectar también el caso inverso: que el usuario baje del bus antes de la estación planeada (ej. por una emergencia), usando la misma lógica de salida del corredor sin llegar al nodo esperado.

---

## Anexo: Delimitación técnica de los tramos (corredores) con Google Maps

1. **Obtener la geometría real del corredor.** Trazar manualmente con Google My Maps siguiendo el carril segregado sobre la imagen satelital (más confiable que el routing automático, que puede desviarse a calles paralelas), o usar la Routes API (`computeRoutes`) y su campo `routes.polyline.encodedPolyline` entre cada par de estaciones.
2. **Decodificar el polyline** a coordenadas lat/lng (ej. con `@mapbox/polyline`).
3. **Segmentar por tramo**, no por ruta completa — un polígono por cada par de estaciones consecutivas.
4. **Generar el buffer con turf.js**: `turf.buffer(linea, radioEnMetros, {units: 'meters'})`.
5. **Definir el ancho del buffer** = ancho físico real del carril (~7-10 m) + margen de error de GPS urbano (hasta 20-50 m). Mejor pecar de generoso y ajustar con pruebas de campo.
6. **Cruzar con OpenStreetMap** (tags de `busway` vía Overpass API) para validar o afinar el trazo, especialmente en curvas o cambios de lado de la avenida.
7. **Implementar el chequeo punto-en-polígono** con `turf.booleanPointInPolygon(puntoUsuario, poligonoTramo)` en cada actualización de ubicación.

---

## Preguntas / definiciones pendientes

- Lista cerrada de "tipos de incidente" para el dropdown del módulo 4.3.
- Umbral exacto de "densidad de usuarios" para inferir estación llena sin reportes.
- Duración del bloqueo por comentarios ofensivos.
- Frecuencia/mecanismo exacto del "flush" semanal (¿hard delete o archivado?).
- Umbral exacto de ventana de gracia y velocidad para la detección de abordaje (sección 7) — ajustar con pruebas reales en el corredor del Metropolitano.
- Ancho final del buffer por tramo, validado con datos de campo.