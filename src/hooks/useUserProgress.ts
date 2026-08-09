import { useEffect, useMemo, useState } from 'react'

import type { RouteApi, StationApi } from '../lib/types'
import { flattenRoute, type PathEntry } from '../lib/routePath'

export interface UserProgressState {
  active: boolean
  progress: number
  smooth: number
  status: string
  nearStationId: number | null
  demo: boolean
}

export function useUserProgress(
  route: RouteApi | null,
  stations: StationApi[],
): UserProgressState {
  const [value, setValue] = useState(0)

  const path: PathEntry[] = useMemo(() => {
    if (!route || stations.length === 0) return []
    return flattenRoute(route, stations)
  }, [route, stations])

  const PER_SEG_MS = 2000

  useEffect(() => {
    if (path.length < 2) return
    const totalSeg = path.length - 1
    const totalMs = totalSeg * PER_SEG_MS
    const started = performance.now()
    let raf = 0

    function tick() {
      const elapsed = performance.now() - started
      const v = Math.min(1, elapsed / totalMs)
      setValue(v)
      if (v < 1) {
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(raf)
  }, [path.length])

  return {
    active: path.length >= 2,
    progress: value,
    smooth: value,
    status: value >= 1 ? 'arrived' : 'traveling',
    nearStationId: null,
    demo: true,
  }
}