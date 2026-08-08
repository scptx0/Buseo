// Supabase Edge Function: aggregate-bus
// Recibe pings GPS de usuarios y devuelve posiciones inferidas de buses.
//
// Entrada: POST { pings: GpsPing[], lines: number[] }
// Salida:  { buses: InferredBus[] }
//
// Invocar cada 30s desde un cron job o desde el frontend.

interface GpsPing {
  userId: string
  lat: number
  lng: number
  speed: number
  status: 'waiting' | 'on_bus' | 'away'
  stationId: number | null
  lineId: number
  originStationId: number
  timestamp: number
}

interface InferredBus {
  busId: string
  lineId: number
  lat: number
  lng: number
  speed: number
  heading: string
  confidence: 'low' | 'medium' | 'high'
  usersOnboard: number
  timestamp: number
}

const CLUSTER_RADIUS_M = 50
const MIN_CONFIDENCE_USERS = 2

function clusterPings(pings: GpsPing[]): Map<string, GpsPing[]> {
  const clusters = new Map<string, GpsPing[]>()

  for (const ping of pings) {
    if (ping.status !== 'on_bus') continue

    let assigned = false
    for (const [key, members] of clusters) {
      const keyLineId = parseInt(key.split('-')[1])
      if (keyLineId !== ping.lineId) continue

      const center = members[0]
      const dist = haversine(center.lat, center.lng, ping.lat, ping.lng)
      if (dist <= CLUSTER_RADIUS_M) {
        members.push(ping)
        assigned = true
        break
      }
    }

    if (!assigned) {
      const key = `bus-${ping.lineId}-${clusters.size}`
      clusters.set(key, [ping])
    }
  }

  return clusters
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function inferBus(
  busId: string,
  lineId: number,
  members: GpsPing[],
): InferredBus {
  const avgLat = members.reduce((s, p) => s + p.lat, 0) / members.length
  const avgLng = members.reduce((s, p) => s + p.lng, 0) / members.length
  const avgSpeed = members.reduce((s, p) => s + p.speed, 0) / members.length
  const count = members.length

  let confidence: InferredBus['confidence'] = 'low'
  if (count >= 3) confidence = 'high'
  else if (count >= 2) confidence = 'medium'

  return {
    busId,
    lineId,
    lat: Math.round(avgLat * 1e6) / 1e6,
    lng: Math.round(avgLng * 1e6) / 1e6,
    speed: Math.round(avgSpeed * 10) / 10,
    heading: 'unknown',
    confidence,
    usersOnboard: count,
    timestamp: Date.now(),
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body: { pings: GpsPing[] }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!body.pings || !Array.isArray(body.pings)) {
    return new Response(JSON.stringify({ error: 'pings array required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const clusters = clusterPings(body.pings)
  const buses: InferredBus[] = []

  for (const [busId, members] of clusters) {
    if (members.length < MIN_CONFIDENCE_USERS) continue
    const bus = inferBus(busId, members[0].lineId, members)
    buses.push(bus)
  }

  buses.sort((a, b) => b.confidence.localeCompare(a.confidence) || b.usersOnboard - a.usersOnboard)

  return new Response(JSON.stringify({ buses }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
})
