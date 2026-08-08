import { useEffect, useRef } from 'react'
import { useChannel } from '@portalsdk/react'
import { getActiveRoute, getUserUUID, fetchStations } from '../lib/supabase/api'
import type { RouteApi } from '../lib/types'
import {
  loadPolygonCache,
  findCurrentStation,
  calcSpeed,
  startWatching,
  stopWatching,
} from '../lib/portal/gps'

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

const BUS_SPEED = 6

export function useGpsTracking() {
  const routeRef = useRef<RouteApi | null>(null)
  const lastPosRef = useRef<{ lat: number; lng: number; speed: number | null; timestamp: number } | null>(null)
  const prevStatusRef = useRef<GpsPing['status'] | null>(null)
  const userIdRef = useRef('')
  const lineIdRef = useRef(0)
  const originStationRef = useRef(0)
  const readyRef = useRef(false)

  const channelId = routeRef.current
    ? `bus:line:${lineIdRef.current}:pings`
    : undefined

  const { status: channelStatus } = useChannel<GpsPing>({ channelId })

  useEffect(() => {
    const uid = getUserUUID()
    userIdRef.current = uid

    getActiveRoute(uid).then(async (route: RouteApi | null) => {
      if (!route) return
      routeRef.current = route
      const firstStep = route.steps[0]
      lineIdRef.current = firstStep.lineId
      const originNode = firstStep.nodes.find(
        (n) => n.stopOrder === firstStep.fromStop,
      )
      if (originNode) {
        originStationRef.current = originNode.stationId
      }

      await loadPolygonCache(fetchStations)
      readyRef.current = true

      startWatching(
        (pos) => {
          if (!readyRef.current) return

          const stationId = findCurrentStation(pos.lat, pos.lng)
          const speed = lastPosRef.current
            ? calcSpeed(lastPosRef.current, pos)
            : (pos.speed ?? 0)

          let status: GpsPing['status'] = 'away'

          if (stationId === originStationRef.current) {
            status = speed > BUS_SPEED ? 'on_bus' : 'waiting'
          } else {
            status = speed > BUS_SPEED ? 'on_bus' : 'away'
          }

          lastPosRef.current = {
            lat: pos.lat,
            lng: pos.lng,
            speed: pos.speed,
            timestamp: pos.timestamp,
          }

          if (status !== prevStatusRef.current) {
            prevStatusRef.current = status
          }
        },
        (err: GeolocationPositionError) => {
          console.error('GPS error:', err.message)
        },
      )
    })

    return () => {
      stopWatching()
      readyRef.current = false
      prevStatusRef.current = null
      lastPosRef.current = null
    }
  }, [])

  return {
    channelStatus,
    hasRoute: routeRef.current !== null,
  }
}
