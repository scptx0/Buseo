import { useEffect, useRef } from 'react'
import { useChannel } from '@portalsdk/react'
import { getUserUUID, fetchStations } from '../lib/supabase/api'
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

export function useGpsTracking(route: RouteApi | null) {
  const lastPosRef = useRef<{ lat: number; lng: number; speed: number | null; timestamp: number } | null>(null)
  const pingRef = useRef<GpsPing | null>(null)
  const statusRef = useRef<GpsPing['status']>('away')
  const userIdRef = useRef('')
  const lineIdRef = useRef(0)
  const originStationRef = useRef(0)
  const readyRef = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const channelId = route
    ? `bus:line:${route.steps[0]?.lineId ?? 0}:pings`
    : undefined

  const { send, status: channelStatus } = useChannel<GpsPing>({ channelId })

  useEffect(() => {
    if (!route) return
    const uid = getUserUUID()
    userIdRef.current = uid
    const firstStep = route.steps[0]
    lineIdRef.current = firstStep.lineId
    const originNode = firstStep.nodes.find((n) => n.stopOrder === firstStep.fromStop)
    if (originNode) originStationRef.current = originNode.stationId

    loadPolygonCache(fetchStations).then(() => {
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

          lastPosRef.current = { lat: pos.lat, lng: pos.lng, speed: pos.speed, timestamp: pos.timestamp }
          statusRef.current = status

          pingRef.current = {
            userId: uid,
            lat: pos.lat,
            lng: pos.lng,
            speed: Math.round(speed * 10) / 10,
            status,
            stationId,
            lineId: lineIdRef.current,
            originStationId: originStationRef.current,
            timestamp: pos.timestamp,
          }
        },
        (err: GeolocationPositionError) => console.error('GPS error:', err.message),
      )
    })

    intervalRef.current = setInterval(() => {
      if (!pingRef.current || channelStatus !== 'ready') return
      send({
        ephemeral: true,
        content: pingRef.current,
      })
    }, 1000)

    return () => {
      stopWatching()
      readyRef.current = false
      lastPosRef.current = null
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [route, channelStatus, send])

  return { status: statusRef, channelStatus }
}
