import type { ReportDetail, ReportRow, RouteApi } from './types'

export interface RouteIncidents {
  count: number
  critical: number
  warning: number
}

/** Ids de estación por los que pasa una ruta (sin repetidos). */
export function getRouteStationIds(route: RouteApi): number[] {
  const ids = new Set<number>()
  for (const step of route.steps) {
    for (const node of step.nodes) ids.add(node.stationId)
  }
  return [...ids]
}

/**
 * Agrupa los reportes recientes por ruta: cuántos incidentes hay en las
 * estaciones por las que pasa cada ruta y cuántos son críticos/advertencia.
 * Devuelve un map routeId → RouteIncidents (solo rutas con al menos 1 reporte).
 */
export function aggregateRouteIncidents(
  routes: RouteApi[],
  rows: ReportRow[],
): Record<string, RouteIncidents> {
  const byTarget = new Map<string, RouteIncidents>()
  for (const row of rows) {
    if (row.type !== 'station' && row.type !== 'incident') continue
    const cur = byTarget.get(row.target_id) ?? { count: 0, critical: 0, warning: 0 }
    cur.count++
    if (row.severity === 'critical') cur.critical++
    else if (row.severity === 'warning') cur.warning++
    byTarget.set(row.target_id, cur)
  }

  const result: Record<string, RouteIncidents> = {}
  for (const route of routes) {
    const acc: RouteIncidents = { count: 0, critical: 0, warning: 0 }
    for (const id of getRouteStationIds(route)) {
      const cur = byTarget.get(String(id))
      if (!cur) continue
      acc.count += cur.count
      acc.critical += cur.critical
      acc.warning += cur.warning
    }
    if (acc.count > 0) result[route.id] = acc
  }
  return result
}

// ---- Detalle de ruta: incidentes por estación y por tramo ----

export interface RouteIncidentBadge {
  count: number
  critical: boolean
}

export type StationIncidentMap = Map<number, RouteIncidentBadge>
export type SegmentIncidentMap = Map<string, RouteIncidentBadge>

/**
 * Pares consecutivos de estaciones (tramos) que la ruta realmente recorre:
 * solo los nodos entre el origen y el destino del paso (excluye los grises
 * anteriores al abordaje y los posteriores al descenso).
 */
export function getRouteSegments(route: RouteApi): Array<[number, number]> {
  const pairs: Array<[number, number]> = []
  for (const step of route.steps) {
    const lo = Math.min(step.fromStop, step.toStop)
    const hi = Math.max(step.fromStop, step.toStop)
    for (let i = 0; i < step.nodes.length - 1; i++) {
      const a = step.nodes[i]
      const b = step.nodes[i + 1]
      const traveled =
        a.stopOrder >= lo && a.stopOrder <= hi &&
        b.stopOrder >= lo && b.stopOrder <= hi
      if (traveled) pairs.push([a.stationId, b.stationId])
    }
  }
  return pairs
}

export function segmentKey(a: number, b: number): string {
  return `${Math.min(a, b)}-${Math.max(a, b)}`
}

/**
 * Clasifica los reportes de una ruta en dos mapas:
 * - `stationIncidents`: reportes de estación (type='station') por estación.
 * - `segmentIncidents`: reportes de incidente (type='incident', entre dos
 *   estaciones) por tramo, solo si el par coincide con un tramo de la ruta.
 */
export function classifyRouteReports(
  route: RouteApi,
  rows: ReportDetail[],
): { stationIncidents: StationIncidentMap; segmentIncidents: SegmentIncidentMap } {
  const segmentKeys = new Set(getRouteSegments(route).map(([a, b]) => segmentKey(a, b)))
  const stationIncidents: StationIncidentMap = new Map()
  const segmentIncidents: SegmentIncidentMap = new Map()

  const bumpStation = (stationId: number, severity: string | null) => {
    const cur = stationIncidents.get(stationId) ?? { count: 0, critical: false }
    cur.count++
    if (severity === 'critical') cur.critical = true
    stationIncidents.set(stationId, cur)
  }

  const bumpSegment = (key: string, severity: string | null) => {
    const cur = segmentIncidents.get(key) ?? { count: 0, critical: false }
    cur.count++
    if (severity === 'critical') cur.critical = true
    segmentIncidents.set(key, cur)
  }

  for (const row of rows) {
    if (row.type === 'station') {
      const stationId = Number(row.target_id)
      if (stationId > 0) bumpStation(stationId, row.severity)
    } else if (row.type === 'incident') {
      const meta = row.metadata ?? {}
      const s1 = Number(meta.station1Id)
      const s2 = Number(meta.station2Id)
      if (s1 > 0 && s2 > 0) {
        const key = segmentKey(s1, s2)
        if (segmentKeys.has(key)) bumpSegment(key, row.severity)
      }
    }
  }

  return { stationIncidents, segmentIncidents }
}
