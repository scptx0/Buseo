import { distance } from '@turf/distance'
import { point } from '@turf/helpers'

import {
  lines,
  stationById,
  stations,
  travelMin,
  mockAlerts,
} from './mockData'
import type { PlannedRoute, Station } from './types'

const TRANSFER_PENALTY_MIN = 3

type RouteStep = { kind: 'board'; lineId: string; from: string; to: string }

function legStats(
  lineId: string,
  fromId: string,
  toId: string,
): { etaMin: number; pairs: Array<{ from: string; to: string }> } | null {
  const line = lines.find((l) => l.id === lineId)
  if (!line) return null
  const i = line.stationIds.indexOf(fromId)
  const j = line.stationIds.indexOf(toId)
  if (i === -1 || j === -1 || i === j) return null
  const [start, end] = [i, j].sort((a, b) => a - b)
  const ids = line.stationIds.slice(start, end + 1)
  const pairs: Array<{ from: string; to: string }> = []
  let etaMin = 0
  for (let k = 0; k < ids.length - 1; k++) {
    etaMin += travelMin(ids[k], ids[k + 1])
    pairs.push({ from: ids[k], to: ids[k + 1] })
  }
  return { etaMin, pairs }
}

interface Candidate {
  steps: RouteStep[]
  segments: Array<{ from: string; to: string }>
  etaMin: number
  sig: string
}

function buildCandidate(steps: RouteStep[]): Candidate | null {
  if (steps.length === 0) return null
  const segments = steps.flatMap((s) => legStats(s.lineId, s.from, s.to)?.pairs ?? [])
  const boardMin = steps.reduce(
    (acc, s) => acc + (legStats(s.lineId, s.from, s.to)?.etaMin ?? 0),
    0,
  )
  const sig = steps.map((s) => s.lineId).join('|')
  return {
    steps,
    segments,
    etaMin: boardMin + Math.max(0, steps.length - 1) * TRANSFER_PENALTY_MIN,
    sig,
  }
}

export function searchRoutes(fromId: string, toId: string): PlannedRoute[] {
  if (!fromId || !toId || fromId === toId) return []

  const candidates: Candidate[] = []

  for (const line of lines) {
    const direct = legStats(line.id, fromId, toId)
    if (direct) {
      const c = buildCandidate([{ kind: 'board', lineId: line.id, from: fromId, to: toId }])
      if (c) candidates.push(c)
    }
  }

  for (const l1 of lines) {
    if (!l1.stationIds.includes(fromId)) continue
    for (const l2 of lines) {
      if (l2.id === l1.id || !l2.stationIds.includes(toId)) continue
      const transferAt = l1.stationIds.find(
        (id) => l2.stationIds.includes(id) && id !== fromId && id !== toId,
      )
      if (!transferAt) continue
      const c = buildCandidate([
        { kind: 'board', lineId: l1.id, from: fromId, to: transferAt },
        { kind: 'board', lineId: l2.id, from: transferAt, to: toId },
      ])
      if (c) candidates.push(c)
    }
  }

  const seen = new Set<string>()
  const routes: PlannedRoute[] = []
  for (const c of candidates.sort((a, b) => a.etaMin - b.etaMin)) {
    if (seen.has(c.sig)) continue
    seen.add(c.sig)

    const alerts = mockAlerts.filter((alert) =>
      c.steps.some(
        (step) =>
          step.from === alert.stationId ||
          step.to === alert.stationId ||
          step.lineId === 'a',
      ),
    )

    routes.push({
      id: `ruta-${routes.length + 1}`,
      steps: c.steps,
      segments: c.segments,
      etaMin: c.etaMin,
      alerts: alerts.length > 0 ? alerts : undefined,
    })
  }
  return routes
}

export function stationName(id: string): string {
  return stationById[id]?.name ?? id
}

export function lineName(id: string): string {
  return lines.find((l) => l.id === id)?.name ?? id
}

export function nearestStation(lat: number, lng: number): Station | undefined {
  let best: { s: Station; d: number } | null = null
  for (const s of stations) {
    const d = distance(point([lng, lat]), point([s.lng, s.lat]), { units: 'kilometers' })
    if (!best || d < best.d) best = { s, d }
  }
  return best?.s
}