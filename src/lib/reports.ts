import type { ReportRow, RouteApi } from './types'

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
