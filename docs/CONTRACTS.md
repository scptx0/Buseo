# CONTRACTS — Contratos técnicos de integración

> Propósito: definir los contratos exactos de los canales Portal y sus payloads para el MVP.
> Es un documento técnico, referencia para agentes y desarrolladores. Para el estado de avance
> del proyecto ver `docs/STATUS.md`.

## 1. Canales Portal (Broadcast)

| Canal | Dirección de flujo | Emisor | Consumidor |
|-------|--------------------|--------|------------|
| `buses:{lineId}` | → clientes | Simulador / backend | Módulo "¿Dónde están los buses?" |
| `station:{stationId}` | → clientes | Simulador / backend | Tu ruta actual (nodo naranja) |
| `segment:{from}->{to}` | → clientes | Simulador / backend | Tu ruta actual (tramo naranja) |
| `line:{lineId}:status` | → clientes | Simulador / backend | Planear ruta, Tu ruta actual |
| `reportes:global` | clientes → clientes | App (formularios de reporte) | Planear ruta (resultados) |
| `reportes` (publicación) | clientes → | App (reportes) | Se publica hacia el emisor correspondiente (station/segment) |

## 2. Payloads (tipos TS de referencia)

```ts
import type { PortalMessage } from '@portalsdk/core'

type Severity = 'ok' | 'warning' | 'critical'

// buses:{lineId} — posición y estado de un bus en la línea
interface BusPosition extends PortalMessage {
  content: {
    busId: string
    lineId: string
    lat: number
    lng: number
    occupancy: number      // 0-10
    status: 'on_time' | 'delayed'
    etaMin: number | null
    ts: number             // epoch ms
  }
}

// station:{stationId} — estado de una estación
interface StationStatus extends PortalMessage {
  content: {
    stationId: string
    severity: Severity
    queue?: 'low' | 'medium' | 'high'
    occupancy?: 'low' | 'medium' | 'high'
    comment?: string
    summary: string
    ts: number
  }
}

// segment:{from}->{to} — estado de un tramo entre estaciones
interface SegmentStatus extends PortalMessage {
  content: {
    from: string
    to: string
    severity: Severity
    delayMin?: number
    summary: string
    ts: number
  }
}

// line:{lineId}:status — resumen de estado de una línea
interface LineStatus extends PortalMessage {
  content: {
    incidents: Array<{ from: string; to: string; severity: Severity; summary: string }>
    delays: Array<{ from: string; to: string; delayMin: number }>
    updatedAt: number
  }
}

// reportes:global — aviso efímero de un reporte recién creado.
// Lo publican los formularios de reporte tras submit_report; la pantalla de
// resultados de rutas lo escucha y re-consulta Supabase (la severidad inicial
// es un hint: infer-report la actualiza luego vía Bedrock).
interface ReportEvent extends PortalMessage {
  content: {
    type: 'station' | 'incident'
    targetId: string   // id numérico de estación como texto
    severity: Severity
  }
}
```

## 3. Convenciones

- Los canales se suscriben por exact key en tiempo de construcción: `portal.channel(`station:${id}`)`.
- Al desmontar una vista se debe hacer `unsubscribe` de los canales de esa vista (1 socket por canal en clientes anónimos).
- Los payloads usan un campo `ts` (epoch ms) del lado del emisor; el cliente no debe asumir `now`.
- `summary` es texto corto legible para humanos que la UI puede mostrar directamente.
- Referencia de uso del SDK en `docs/ARCHITECTURE.md` §5 y en la doc oficial de Portal (`https://docs.useportal.co/`).