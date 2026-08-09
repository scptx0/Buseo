import { haversineDistance } from './geo'
import type { PathEntry } from './routePath'

export const AT_STATION_RADIUS_M = 55

export type UserStatus = 'far' | 'at_origin' | 'traveling' | 'arrived'

export interface ProgressInput {
  path: PathEntry[]
  lat: number
  lng: number
  /** accuracy del GPS en metros (opcional); si se provee, se usa max(55, accuracy) como radio */
  accuracy?: number
  /** último progress encontrado (para monotocidad) */
  lastProgress: number
  lastStatus: UserStatus
  radius?: number
}

export interface ProgressResult {
  active: boolean
  progress: number
  status: UserStatus
  segmentFrom: number
  segmentTo: number
  frac: number
  nearestStationId: number | null
  distanceToNearest: number
}

export function computeProgress(input: ProgressInput): ProgressResult {
  const { path, lat, lng, accuracy, lastProgress, lastStatus } = input
  const empty: ProgressResult = {
    active: false,
    progress: 0,
    status: 'far',
    segmentFrom: 0,
    segmentTo: 0,
    frac: 0,
    nearestStationId: null,
    distanceToNearest: Infinity,
  }
  if (path.length < 2) return empty

  const baseRadius = input.radius ?? AT_STATION_RADIUS_M
  const radius = accuracy ? Math.max(baseRadius, accuracy) : baseRadius

  const dist: number[] = path.map((p) =>
    p.lat === 0 && p.lng === 0 ? Infinity : haversineDistance(lat, lng, p.lat, p.lng),
  )

  let nearestIdx = 0
  let nearestDist = dist[0]
  for (let i = 1; i < dist.length; i++) {
    if (dist[i] < nearestDist) {
      nearestIdx = i
      nearestDist = dist[i]
    }
  }

  const dest = path[path.length - 1]
  const distOrigin = dist[0]
  const distDest = dist[dist.length - 1]

  // Activación: solo cuando el usuario está en el origen
  if (lastStatus === 'far' && distOrigin > radius) {
    return {
      ...empty,
      status: 'far',
      nearestStationId: nearestIdx,
      distanceToNearest: nearestDist,
    }
  }

  // Llegada al destino
  if (distDest <= radius) {
    return {
      active: true,
      progress: Math.max(1, lastProgress),
      status: 'arrived',
      segmentFrom: path.length - 2,
      segmentTo: path.length - 1,
      frac: 1,
      nearestStationId: dest.stationId,
      distanceToNearest: distDest,
    }
  }

  // En ruta: proyección punto-segmento sobre cada arista [i, i+1].
  const N = path.length
  let segFrom = 0
  let segTo = 1
  let segFrac = 0
  let bestDist = Infinity
  for (let i = 0; i < N - 1; i++) {
    const aLat = path[i].lat
    const aLng = path[i].lng
    const bLat = path[i + 1].lat
    const bLng = path[i + 1].lng
    if (aLat === 0 && aLng === 0) continue
    if (bLat === 0 && bLng === 0) continue
    const abLat = bLat - aLat
    const abLng = bLng - aLng
    const ab2 = abLat * abLat + abLng * abLng
    let t = ab2 > 0 ? ((lat - aLat) * abLat + (lng - aLng) * abLng) / ab2 : 0
    if (t < 0) t = 0
    else if (t > 1) t = 1
    const projLat = aLat + abLat * t
    const projLng = aLng + abLng * t
    const d = haversineDistance(lat, lng, projLat, projLng)
    if (d < bestDist) {
      bestDist = d
      segFrom = i
      segTo = i + 1
      segFrac = t
    }
  }

  let status: UserStatus = 'traveling'

  // Snap a nodo si estamos dentro del radio de un nodo intermedio
  if (nearestDist <= radius && nearestIdx !== 0 && nearestIdx !== N - 1) {
    const nodeProgress = nearestIdx / (N - 1)
    return {
      active: true,
      progress: Math.max(nodeProgress, lastProgress),
      status,
      segmentFrom: nearestIdx,
      segmentTo: nearestIdx,
      frac: 0,
      nearestStationId: path[nearestIdx].stationId,
      distanceToNearest: nearestDist,
    }
  }

  const rawProgress = (segFrom + segFrac) / (N - 1)
  const progress = Math.max(rawProgress, lastProgress)

  return {
    active: true,
    progress,
    status: progress >= 1 ? 'arrived' : status,
    segmentFrom: segFrom,
    segmentTo: segTo,
    frac: segFrac,
    nearestStationId: path[nearestIdx].stationId,
    distanceToNearest: nearestDist,
  }
}