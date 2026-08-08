import type { StationApi } from '../types'

interface GpsPosition {
  lat: number
  lng: number
  speed: number | null
  timestamp: number
}

let polygonCache: Map<number, [number, number][]> | null = null

export async function loadPolygonCache(
  fetchStations: () => Promise<StationApi[]>,
): Promise<void> {
  if (polygonCache) return
  const stations = await fetchStations()
  polygonCache = new Map()
  for (const s of stations) {
    if (s.polygon) {
      polygonCache.set(s.id, s.polygon as [number, number][])
    }
  }
}

export function isInsideStation(
  lat: number,
  lng: number,
  stationId: number,
): boolean {
  if (!polygonCache) return false
  const poly = polygonCache.get(stationId)
  if (!poly || poly.length < 3) return false

  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0]
    const yi = poly[i][1]
    const xj = poly[j][0]
    const yj = poly[j][1]
    const intersect =
      yi > lng !== yj > lng &&
      lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export function findCurrentStation(
  lat: number,
  lng: number,
): number | null {
  if (!polygonCache) return null
  for (const [id] of polygonCache) {
    if (isInsideStation(lat, lng, id)) return id
  }
  return null
}

export function calcSpeed(prev: GpsPosition, curr: GpsPosition): number {
  const R = 6371000
  const dLat = ((curr.lat - prev.lat) * Math.PI) / 180
  const dLng = ((curr.lng - prev.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((prev.lat * Math.PI) / 180) *
      Math.cos((curr.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  const dt = (curr.timestamp - prev.timestamp) / 1000
  return dt > 0 ? distance / dt : 0
}

let watchId: number | null = null

export function startWatching(
  onPosition: (pos: GpsPosition) => void,
  onError: (err: GeolocationPositionError) => void,
): void {
  if (watchId !== null) return
  watchId = navigator.geolocation.watchPosition(
    (p) => {
      onPosition({
        lat: p.coords.latitude,
        lng: p.coords.longitude,
        speed: p.coords.speed,
        timestamp: p.timestamp,
      })
    },
    onError,
    {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 5000,
    },
  )
}

export function stopWatching(): void {
  if (watchId === null) return
  navigator.geolocation.clearWatch(watchId)
  watchId = null
}
