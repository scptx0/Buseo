# Reporte de Rutas y Segmentos — Metropolitano Lima

**Fecha:** 2026-08-08
**Fuente:** Supabase (44 estaciones, 20 lineas, 342 line_stops)

---

## Resumen

| Metrica | Valor |
|---------|-------|
| Estaciones totales | 44 |
| Lineas totales | 20 |
| Paradas registradas (line_stops) | 342 |
| Segmentos con datos (Google Maps) | 306 |
| Lineas con datos completos | 19/20 |

## Segmentos por linea

| Linea | Tipo | Direcciones | Paradas | Tramos | Estado |
|-------|------|-------------|---------|--------|--------|
| regular-a (17) | Regular | norte/sur | 16+16 | 30 | Completo |
| regular-b (18) | Regular | norte/sur | 20+21 | 39 | Completo |
| regular-c (19) | Regular | norte/sur | 24+24 | 46 | Completo |
| regular-d (20) | Regular | norte/sur | 15+15 | 28 | Completo |
| expreso-1 | Expreso | norte/sur | 9+10 | 17 | Completo |
| expreso-2 | Expreso | norte/sur | 4+5 | 7 | Completo |
| expreso-3 | Expreso | sur | 3 | 0 | Sin datos |
| expreso-5 | Expreso | norte/sur | 13+13 | 2 | Completo |
| expreso-6 | Expreso | sur | 12+12 | 24 | Completo |
| expreso-7 | Expreso | sur | 6 | 6 | Completo |
| expreso-8 | Expreso | sur | 4 | 4 | Completo |
| expreso-9 | Expreso | norte/sur | 9+9 | 15 | Completo |
| expreso-10 | Expreso | sur | 5+8 | 13 | Completo |
| expreso-11 | Expreso | sur | 6 | 6 | Completo |
| expreso-12 | Expreso | sur | 6+6 | 12 | Completo |
| expreso-13 | Expreso | sur | 5 | 5 | Completo |
| super-expreso | Expreso | sur | 8+5 | 13 | Completo |
| super-expreso-norte-22-agosto | Expreso | norte/sur | 7+7 | 10 | Completo |
| super-expreso-norte-naranjal | Expreso | norte/sur | 8+7 | 11 | Completo |
| lechucero | Expreso | sur | 12+11 | 18 | Completo |

**Pendiente:** expreso-3 (line_id=3) no tiene paradas en ambas direcciones en `line_stops`. La linea esta registrada pero solo tiene `path_sur_norte` (3 paradas) y `path_norte_sur` es null.

## Metodologia

1. Se extrajeron las 342 paradas de `line_stops` agrupadas por linea y direccion
2. Se identificaron 265 pares de estaciones consecutivas sin registro en `segments`
3. Se calculo distancia y duracion via Google Routes API (mode: DRIVE, TRAFFIC_AWARE)
4. Se insertaron los 265 segmentos faltantes en la tabla `segments`

## Costo Google Maps API

265 llamadas a Routes API `computeRoutes` (~$0.005/request) = ~$1.33 USD.
