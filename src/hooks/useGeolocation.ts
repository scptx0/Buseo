import { useCallback, useEffect, useRef, useState } from 'react'

export type GeoStatus = 'unsupported' | 'prompt' | 'granted' | 'denied'

export interface GeoPosition {
  lat: number
  lng: number
  accuracy: number
}

export interface GeoState {
  status: GeoStatus
  position: GeoPosition | null
}

type GeoWatch = { clear: () => void }

function startWatch(onPosition: (p: GeoPosition) => void, onDenied: () => void): GeoWatch {
  const id = navigator.geolocation.watchPosition(
    (pos) => {
      onPosition({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      })
    },
    (err) => {
      if (err.code === err.PERMISSION_DENIED) onDenied()
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
  )
  return { clear: () => navigator.geolocation.clearWatch(id) }
}

export function useGeolocation(): { state: GeoState; retry: () => void } {
  const [state, setState] = useState<GeoState>({ status: 'prompt', position: null })
  const watchRef = useRef<GeoWatch | null>(null)
  const permissionRef = useRef<PermissionStatus | null>(null)

  const stop = useCallback(() => {
    watchRef.current?.clear()
    watchRef.current = null
  }, [])

  const start = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState({ status: 'unsupported', position: null })
      return
    }
    if (watchRef.current) return
    watchRef.current = startWatch(
      (p) => setState({ status: 'granted', position: p }),
      () => setState((s) => ({ ...s, status: 'denied' })),
    )
  }, [])

  useEffect(() => {
    start()
    return stop
  }, [start, stop])

  useEffect(() => {
    if (!('permissions' in navigator)) return
    let cancelled = false
    void navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((p) => {
        if (cancelled) return
        permissionRef.current = p
        p.onchange = () => {
          if (p.state === 'granted') {
            start()
          } else if (p.state === 'denied') {
            stop()
            setState((s) => ({ ...s, status: 'denied' }))
          } else {
            start()
          }
        }
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
      const p = permissionRef.current
      if (p) p.onchange = null
      permissionRef.current = null
    }
  }, [start, stop])

  const retry = useCallback(() => {
    stop()
    setState((s) => ({ ...s, status: 'prompt' }))
    start()
  }, [start, stop])

  return { state, retry }
}