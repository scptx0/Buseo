import { supabase } from './client'
import type { StationApi, RouteApi } from '../types'

export async function fetchStations(): Promise<StationApi[]> {
  const { data, error } = await supabase.functions.invoke<StationApi[]>('stations', {
    method: 'GET',
  })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function searchRoutes(
  origin: number,
  dest: number,
): Promise<RouteApi[]> {
  const { data, error } = await supabase.functions.invoke<RouteApi[]>(
    'planear-buscar',
    {
      method: 'POST',
      body: { origin, dest },
    },
  )

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function startTrip(params: {
  userId: string
  origin: number
  dest: number
  steps: unknown
}): Promise<{ success: boolean; routeId: string }> {
  const { data, error } = await supabase.functions.invoke<{
    success: boolean
    routeId: string
  }>('viaje-iniciar', {
    method: 'POST',
    body: {
      user_id: params.userId,
      origin: params.origin,
      dest: params.dest,
      steps: params.steps,
    },
  })

  if (error) throw new Error(error.message)
  return data ?? { success: false, routeId: '' }
}

export function getUserUUID(): string {
  const key = 'buseo:user-uuid'
  let uuid = localStorage.getItem(key)
  if (!uuid) {
    uuid = crypto.randomUUID()
    localStorage.setItem(key, uuid)
  }
  return uuid
}
