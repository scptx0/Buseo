# Design — Buseo

Sistema visual para la app del corredor del Metropolitano (Lima). Guía de implementación de la parte visual.

## 1. Sujeto y tesis

**Sujeto:** transporte público de alta capacidad — el BRT del Metropolitano: carriles segregados, estaciones de andén, líneas de expresión y un flujo de pasajeros constante a lo largo de una avenida troncal.

**Audiencia:** personas que se mueven a pie y en bus por Lima en un móvil, con prisa y datos móviles modestos.

**Trabajo de la página:** resolver "¿por dónde voy, cómo llego y está todo en orden?" en el menor tiempo posible, sin fricción.

**Tesis visual:** la **línea de viaje** como protagonista. La ruta no es un panel de formularios ni una tarjeta de resultados: es la troncal misma, dibujada de origen a destino como la infraestructura que la ciudad ya usa. Todo el UI se ordena alrededor de esa línea.

## 2. Identidad visual

En vez de la paleta "tecnológica" por defecto (blanco cálido + acento), la app adopta la **señalética vial del propio corredor** con una **paleta bebé/pastel de solo cuatro familias**: amarillo, celeste, azul y morado (y sus variaciones). No se usan rojos, naranjas ni verdes saturados.

- La troncal se dibuja como una **cinta continua** (azul bebé), igual que el carril segregado en el pavimento, sobre una base celeste bebé.
- Los estados del servicio se codifican solo con las cuatro familias permitidas: celeste bebé normal / amarillo bebé alerta / morado bebé crítico.

**Elemento firma — la línea de viaje:** un diagrama horizontal nodo↔nodo que reproduce conceptualmente el corredor: nodos (estaciones) y segmentos (tramos) sobre una banda continua. Toda la app (planear ruta, tu ruta actual, dónde están los buses) reutiliza el mismo diagrama; una sola pieza da identidad al producto completo.

## 3. Tokens de color

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-primary` | `#8FB4E8` | Banda continua, acentos de marca, estación de origen |
| `--color-primary-deep` | `#5F7EC9` | Texto/estados presionados sobre la troncal |
| `--ink` | `#353D5E` | Texto principal, contornos sobre blanco |
| `--ink-muted` | `#8A92AC` | Texto secundario, etiquetas |
| `--surface` | `#FFFFFF` | Superficie principal |
| `--color-bg` | `#F4F8FE` | Fondo de página (celeste bebé) |
| `--color-bg-lavender` | `#FAF6FE` | Fondo alterno (morado bebé) |
| `--color-border` | `#E2ECFB` | Bordes y separadores |
| `--color-yellow` | `#FBF3C7` | Acento bebé (amarillo pastel) |
| `--color-celeste` | `#D9EAFD` | Acento bebé (celeste pastel) |
| `--color-blue` | `#D7E5FB` | Acento bebé (azul pastel) |
| `--color-purple` | `#ECE5FB` | Acento bebé (morado pastel) |
| Estado normal | `#A9D9F7` | Nodo/tramo normal (celeste bebé) |
| Estado alerta | `#FDE29A` | Nodo/tramo con incidente (amarillo bebé) |
| Estado crítico | `#C4A8EC` | Incidente grave (morado bebé) |

La paleta se limita a cuatro familias en tonos bebé/pastel (amarillo, celeste, azul, morado); el rojo, naranja y verde saturado quedan fuera. Sobre esa base clara, los estados de nodos y tramos (celeste/amarillo/morado) saltan a la vista.

## 4. Tipografía

- **Display / titular:** `IBM Plex Sans` — carácter técnico y urbano, pesos 600–700. Solo para encabezado de módulo y saludo.
- **Body / UI:** `Inter` — lectura, formularios, listas, instrucciones. Peso 400–500.
- **Dato / números:** `IBM Plex Mono` — tiempos estimados, contadores, etiquetas de nodos (tono "tablero de señal").

Escala (mobile-first):
```
display   22–26px  / 700
h1        20px     / 600
body      15–16px  / 400
caption   13px     / 500  (+ dato mono 12px para ETA / números)
```

## 5. Layout

Concepto: **una columna "vía" móvil-primero**; el mapa y la línea de viaje ocupan el carril principal y la información se acumula en capas inferiores o paneles deslizantes.

```
┌──────────────────────────┐
│  [logo] Metropolitano    │  barra superior fija, compacta
├──────────────────────────┤
│                          │
│       LÍNEA DE VIAJE     │  ← protagonista (componente firma)
│   [●]───[●]──[◆]──[●]    │
│                          │
├──────────────────────────┤
│  instrucciones / datos   │
├──────────────────────────┤
│        [ CTA ]           │  acción primaria (fija, pulgar)
└──────────────────────────┘
```

- El CTA principal es fijo al fondo en pantallas táctiles.
- Elementos táctiles con altura mínima de 44px.

## 6. La línea de viaje (componente firma)

- **Nodo (estación):** círculo. Estado codificado por color:
  - celeste bebé = normal, amarillo bebé = con reporte, morado bebé = incidente grave.
  - El **nodo donde el usuario está** crece y se marca con un anillo.
  - El **destino** se marca con la casilla ◆.
- **Segmento (tramo):** línea continua; si hay incidente se vuelve un **guion amarillo bebé** (o morado bebé).
- **Banda:** la base de la troncal en `--color-primary` bajo nodos y segmentos, unificando el diagrama como una pieza de señalética.
- Interacción: click en nodo/segmento amarillo bebé abre el panel de reportes.

Este componente es el mismo en todos los módulos, garantizando coherencia y una identidad única.

## 7. Estados y vacíos

- **Sin ruta:** mensaje direccional + CTA: _"Parece que aún no tienes una ruta actual"_ → botón "Planear ruta".
- **Error:** lenguaje de servicio, nunca disculpa vaga: _"No encontramos la estación 'X'. Revisa el nombre o elige de la lista."_
- **GPS apagado:** pantalla de bloqueo "Activa tu ubicación para continuar" — es el portón de entrada, clara y sin opciones confusas.
- **Botones:** dicen exactamente lo que hacen ("Guardar ruta", "Desactivar ruta"). Vacío = invitación a actuar.

## 8. Movimiento

Uso mínimo y con propósito:

- La línea de viaje "viaja" de origen a destino con un suave `dash-motion` al render — una sola secuencia, no efectos dispersos.
- Cambios de estado (celeste bebé→amarillo bebé) hacen un **pulso corto**, no animación continua.
- Respetar `prefers-reduced-motion`; sin parallax ni ambientes decorativos.

## 9. Modo oscuro (opcional)

Aplazado. Si se hace, invertir superficies manteniendo los estados y la base bebé (amarillo, celeste, azul, morado). No es bloqueante para el MVP.

## 10. Implementación

- Tokens como CSS variables en `:root` (`src/index.css`).
- UI modular por feature en `src/app/{feature}/`, componentes en `src/components/` (ver `ARCHITECTURE.md`).
- Línea de viaje como componente reutilizable (`RouteGraph`).

## Riesgo asumido (justificación)

La elección de azul bebé + "línea de viaje" como dirección es específica al corredor, no genérica:
- No es el beige+negro por defecto; deriva de la infraestructura física real (vía segregada + estado vial).
- La paleta bebé (amarillo, celeste, azul, morado) es liviana y descansa la vista; los estados se distinguen sin colores saturados.