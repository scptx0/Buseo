import { supabase } from './client'
import type { StationApi, RouteApi } from '../types'

export async function fetchStations(): Promise<StationApi[]> {
  const { data, error } = await supabase.rpc('get_stations')
  if (error) throw new Error(error.message)
  return (data as StationApi[]) ?? []
}

export async function searchRoutes(origin: number, dest: number): Promise<RouteApi[]> {
  const { data, error } = await supabase.rpc('search_all_routes', {
    p_origin: origin, p_dest: dest,
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
    p_user_id: params.userId, p_origin: params.origin,
    p_dest: params.dest, p_steps: params.steps,
  })
  if (error) throw new Error(error.message)
  return (data as { success: boolean; routeId: string }) ?? { success: false, routeId: '' }
}

export async function getActiveRoute(userId: string): Promise<RouteApi | null> {
  const { data, error } = await supabase
    .from('active_routes')
    .select('steps')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  if (error || !data) return null
  return data.steps as unknown as RouteApi
}

export async function finishTrip(userId: string): Promise<void> {
  await supabase
    .from('active_routes')
    .update({ status: 'completed' })
    .eq('user_id', userId)
    .eq('status', 'active')
}

export async function getUserUUID(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  if (data.user) return data.user.id

  const { data: signUp, error } = await supabase.auth.signInAnonymously()
  if (error) throw new Error(error.message)
  return signUp.user?.id ?? ''
}
