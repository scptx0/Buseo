import { useState, useEffect, useRef } from 'react'
import type { UserLocation } from '../lib/types.ts'

type PermissionState = 'loading' | 'granted' | 'denied' | 'prompt'

interface UseGeolocationResult {
  location: UserLocation | null
  error: string | null
  permission: PermissionState
}

export function useGeolocation(): UseGeolocationResult {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [permission, setPermission] = useState<PermissionState>('loading')
  const watchId = useRef<number | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no disponible en este navegador')
      setPermission('denied')
      return
    }

    navigator.permissions
      .query({ name: 'geolocation' })
      .then((result) => {
        if (result.state === 'denied') {
          setError('Permiso de ubicación denegado')
          setPermission('denied')
          return
        }
        setPermission(result.state as PermissionState)

        result.addEventListener('change', () => {
          setPermission(result.state as PermissionState)
        })
      })
      .catch(() => {
        setPermission('prompt')
      })

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
          timestamp: position.timestamp,
        })
        setError(null)
        setPermission('granted')
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Permiso de ubicación denegado')
            setPermission('denied')
            break
          case err.POSITION_UNAVAILABLE:
            setError('Ubicación no disponible')
            break
          case err.TIMEOUT:
            setError('Tiempo de espera agotado al obtener ubicación')
            break
          default:
            setError(err.message)
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      },
    )

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
      }
    }
  }, [])

  return { location, error, permission }
}
