import type { RouteApi, RouteNodeApi, StationApi } from './types'

export interface PathEntry {
  row: number
  stationId: number
  stationName: string
  lineId: number
  lat: number
  lng: number
  isOrigin: boolean
  isDestination: boolean
}

function nodeKind(
  n: RouteNodeApi,
  step: RouteApi['steps'][number],
  stepIndex: number,
  steps: RouteApi['steps'],
): { isOrigin: boolean; isDestination: boolean } {
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === steps.length - 1
  const isLastNode = n.stopOrder === step.toStop
  const isFromNode = n.stopOrder === step.fromStop
  const isOrigin = isFirstStep && isFromNode
  const isDestination = isLastStep && isLastNode
  return { isOrigin, isDestination }
}

export function flattenRoute(route: RouteApi, stations: StationApi[]): PathEntry[] {
  const byId = new Map<number, StationApi>()
  for (const s of stations) byId.set(s.id, s)

  const out: PathEntry[] = []
  let row = 0
  for (let si = 0; si < route.steps.length; si++) {
    const step = route.steps[si]
    for (const n of step.nodes) {
      const meta = byId.get(n.stationId)
      const { isOrigin, isDestination } = nodeKind(n, step, si, route.steps)
      out.push({
        row,
        stationId: n.stationId,
        stationName: meta?.name ?? n.stationName,
        lineId: step.lineId,
        lat: meta?.lat ?? 0,
        lng: meta?.lng ?? 0,
        isOrigin,
        isDestination,
      })
      row++
    }
  }
  return out
}