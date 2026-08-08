import type { Station, NearestStationResult } from './types.ts'

const EARTH_RADIUS_M = 6_371_000

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function isInsidePolygon(
  lat: number,
  lng: number,
  polygon: [number, number][],
): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const yi = polygon[i][0]
    const xi = polygon[i][1]
    const yj = polygon[j][0]
    const xj = polygon[j][1]
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

export function findNearestStation(
  lat: number,
  lng: number,
  stations: Station[],
): NearestStationResult {
  let nearest = stations[0]
  let minDist = Infinity

  for (const station of stations) {
    const dist = haversineDistance(lat, lng, station.lat, station.lng)
    if (dist < minDist) {
      minDist = dist
      nearest = station
    }
  }

  return {
    station: nearest,
    distanceMeters: Math.round(minDist),
    isInsidePolygon: isInsidePolygon(lat, lng, nearest.polygon),
  }
}
