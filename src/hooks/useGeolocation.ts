import { useState, useEffect, useRef, useCallback } from 'react'
import type { UserLocation } from '../lib/types'

export type GeoPosition = UserLocation

export type GeoStatus = 'prompt' | 'granted' | 'denied' | 'unsupported'

export interface GeoState {
  status: GeoStatus
  position: GeoPosition | null
}

export function useGeolocation(): { state: GeoState; retry: () => void } {
  const [status, setStatus] = useState<GeoStatus>('prompt')
  const [position, setPosition] = useState<GeoPosition | null>(null)
  const watchId = useRef<number | null>(null)

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unsupported')
      return
    }

    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
    }

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          timestamp: pos.timestamp,
        })
        setStatus('granted')
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied')
        } else {
          setStatus('unsupported')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      },
    )
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus('unsupported')
      return
    }

    navigator.permissions
      .query({ name: 'geolocation' })
      .then((result) => {
        if (result.state === 'denied') {
          setStatus('denied')
          return
        }
        if (result.state === 'granted') {
          startWatching()
        }
      })
      .catch(() => {
        startWatching()
      })

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
      }
    }
  }, [startWatching])

  const retry = useCallback(() => {
    setStatus('prompt')
    startWatching()
  }, [startWatching])

  return { state: { status, position }, retry }
}
