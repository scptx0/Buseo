import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useChannel } from '@portalsdk/react'

import type { ReportDetail, RouteApi } from '../lib/types'
import { fetchRouteReports } from '../lib/supabase/api'
import {
  classifyRouteReports,
  getRouteStationIds,
  type SegmentIncidentMap,
  type StationIncidentMap,
} from '../lib/reports'
import { REPORTS_CHANNEL_ID, type ReportEvent } from '../lib/portal/reports'

export interface RouteReportsResult {
  reports: ReportDetail[]
  stationIncidents: StationIncidentMap
  segmentIncidents: SegmentIncidentMap
  total: number
  loading: boolean
}

const EMPTY_STATION_MAP: StationIncidentMap = new Map()
const EMPTY_SEGMENT_MAP: SegmentIncidentMap = new Map()

/** Reportes de la ruta en vivo: carga inicial + canal Portal + polling 10s. */
export function useRouteReports(route: RouteApi | null): RouteReportsResult {
  const [reports, setReports] = useState<ReportDetail[]>([])
  const [loading, setLoading] = useState(false)

  const stationIds = useMemo(() => (route ? getRouteStationIds(route) : []), [route])

  const refresh = useCallback(async () => {
    if (!route || stationIds.length === 0) return
    setLoading(true)
    try {
      const rows = await fetchRouteReports(stationIds)
      setReports(rows)
    } catch (e) {
      console.error('Error cargando reportes de la ruta:', e)
    } finally {
      setLoading(false)
    }
  }, [route, stationIds])

  useEffect(() => {
    if (!route) {
      setReports([])
      return
    }
    refresh()
    const interval = setInterval(refresh, 10_000)
    return () => clearInterval(interval)
  }, [route, refresh])

  // Canal Portal: refresco instantáneo cuando alguien reporta en esta ruta
  const { messages, status } = useChannel<ReportEvent>({
    channelId: route ? REPORTS_CHANNEL_ID : undefined,
    history: 'none',
  })
  const lastEventRef = useRef('')
  useEffect(() => {
    if (status !== 'ready' || messages.length === 0 || !route) return
    const last = messages[messages.length - 1]
    if (last.id === lastEventRef.current) return
    lastEventRef.current = last.id
    if (stationIds.includes(Number(last.content.targetId))) refresh()
  }, [messages, status, route, stationIds, refresh])

  const { stationIncidents, segmentIncidents } = useMemo(
    () => (route ? classifyRouteReports(route, reports) : { stationIncidents: EMPTY_STATION_MAP, segmentIncidents: EMPTY_SEGMENT_MAP }),
    [route, reports],
  )

  return { reports, stationIncidents, segmentIncidents, total: reports.length, loading }
}
