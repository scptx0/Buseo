import { supabase } from './client'
import type { StationApi, RouteApi } from '../types'

export async function fetchStations(): Promise<StationApi[]> {
  const { data, error } = await supabase.rpc('get_stations')

  if (error) throw new Error(error.message)
  return (data as StationApi[]) ?? []
}

export async function searchRoutes(
  origin: number,
  dest: number,
): Promise<RouteApi[]> {
  const { data, error } = await supabase.rpc('search_all_routes', {
    p_origin: origin,
    p_dest: dest,
  })

  if (error) throw new Error(error.message)
  return (data as RouteApi[]) ?? []
}

export async function startTrip(params: {
  userId: string
  origin: number
  dest: number
  steps: unknown
}): Promise<{ success: boolean; routeId: string }> {
  const { data, error } = await supabase.rpc('start_trip', {
    p_user_id: params.userId,
    p_origin: params.origin,
    p_dest: params.dest,
    p_steps: params.steps,
  })

  if (error) throw new Error(error.message)
  return (data as { success: boolean; routeId: string }) ?? { success: false, routeId: '' }
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
