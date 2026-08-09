import { useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase/client'

interface Props {
  stationCount: number
  lineId: number
  direction: string
  onProgress: (p: number) => void
}

const PAUSE_SECONDS = 30

export function BusTracker({ stationCount, lineId, direction, onProgress }: Props) {
  const animRef = useRef(0)
  const timelineRef = useRef<Array<{ fromIdx: number; toIdx: number; duration: number }>>([])
  const totalRef = useRef(0)
  const startRef = useRef(0)

  useEffect(() => {
    if (stationCount < 2) return
    // Fetch segments to get real durations
    supabase.rpc('get_line_stations', { p_line_id: lineId, p_direction: direction }).then(({ data }: { data: Array<{ station_id: number }> | null }) => {
      if (!data || data.length < 2) return
      const stationIds = data.map(s => s.station_id)
      supabase.from('segments').select('from_station, to_station, duration_seconds').eq('line_id', lineId).then(({ data: segData }: { data: Array<{ from_station: number; to_station: number; duration_seconds: number }> | null }) => {
          const segMap = new Map<string, number>()
          if (segData) {
            for (const s of segData) segMap.set(`${s.from_station}-${s.to_station}`, s.duration_seconds)
          }
          const timeline: Array<{ fromIdx: number; toIdx: number; duration: number }> = []
          for (let i = 0; i < stationIds.length - 1; i++) {
            const key = `${stationIds[i]}-${stationIds[i + 1]}`
            timeline.push({ fromIdx: i, toIdx: i + 1, duration: segMap.get(key) ?? 60 })
          }
          timelineRef.current = timeline
          // Calculate total: sum(travel + 30s pause at each destination)
          let total = 0
          for (const seg of timeline) total += seg.duration + PAUSE_SECONDS
          totalRef.current = total
          // Start at random station
          const startSeg = Math.floor(Math.random() * timeline.length)
          // Offset = cumulative time up to start of this segment
          let offset = 0
          for (let i = 0; i < startSeg; i++) offset += timeline[i].duration + PAUSE_SECONDS
          startRef.current = Date.now() - offset * 1000

          function animate() {
            const elapsed = (Date.now() - startRef.current) / 1000
            const t = ((elapsed % total) + total) % total
            onProgress(t / total)
            animRef.current = requestAnimationFrame(animate)
          }
          if (animRef.current) cancelAnimationFrame(animRef.current)
          animRef.current = requestAnimationFrame(animate)
        })
      })
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [stationCount, lineId, direction, onProgress])

  return null
}
