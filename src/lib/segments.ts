import { supabase } from './supabase/client'
import type { PathEntry } from './routePath'

export const DEFAULT_SEG_SEC = 120

interface SegmentRow {
  from_station: number
  to_station: number
  line_id: number
  duration_seconds: number
}

export async function fetchRouteDurations(path: PathEntry[]): Promise<number[]> {
  const out: number[] = []
  if (path.length < 2) return out

  const lineIds = [...new Set(path.map((p) => p.lineId))]
  const { data, error } = await supabase
    .from('segments')
    .select('from_station, to_station, line_id, duration_seconds')
    .in('line_id', lineIds)

  if (error || !data) {
    for (let i = 0; i < path.length - 1; i++) out.push(DEFAULT_SEG_SEC)
    return out
  }

  const map = new Map<string, number>()
  for (const s of data as SegmentRow[]) {
    map.set(`${s.from_station}-${s.to_station}-${s.line_id}`, s.duration_seconds)
  }

  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i]
    const b = path[i + 1]
    const direct = map.get(`${a.stationId}-${b.stationId}-${a.lineId}`)
    if (direct !== undefined) { out.push(direct); continue }
    const reverse = map.get(`${b.stationId}-${a.stationId}-${a.lineId}`)
    if (reverse !== undefined) { out.push(reverse); continue }
    out.push(DEFAULT_SEG_SEC)
  }
  return out
}