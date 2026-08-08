import { supabase } from './client'
import type { Station, PlannedRoute } from '../types'

export async function fetchStations(): Promise<Station[]> {
  const { data, error } = await supabase.functions.invoke<Station[]>('stations', {
    method: 'GET',
  })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function searchRoutes(
  origin: number,
  dest: number,
): Promise<PlannedRoute[]> {
  const { data, error } = await supabase.functions.invoke<PlannedRoute[]>(
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
