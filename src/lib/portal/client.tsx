import { Portal } from '@portalsdk/core'
import { PortalProvider } from '@portalsdk/react'
import type { ReactNode } from 'react'
import { getUserUUID } from '../supabase/api'

const PORTAL_KEY = import.meta.env.VITE_PORTAL_KEY as string

export const portal = new Portal({
  apiKey: PORTAL_KEY,
})

export async function initPortalToken(): Promise<void> {
  const uuid = getUserUUID()
  const base = import.meta.env.VITE_SUPABASE_URL as string
  try {
    const res = await fetch(`${base}/functions/v1/portal-token?userId=${uuid}`)
    if (!res.ok) return
    const data = await res.json() as { token: string }
    if (data.token) portal.setToken(data.token)
  } catch {
    // Portal funciona sin token en modo anonimo
  }
}

export function BuseoPortalProvider({ children }: { children: ReactNode }) {
  return (
    <PortalProvider client={portal}>
      {children}
    </PortalProvider>
  )
}
