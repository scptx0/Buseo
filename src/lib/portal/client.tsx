import { Portal } from '@portalsdk/core'
import { PortalProvider } from '@portalsdk/react'
import type { ReactNode } from 'react'

const PORTAL_KEY = import.meta.env.VITE_PORTAL_KEY as string

export const portal = new Portal({
  apiKey: PORTAL_KEY,
})

export function BuseoPortalProvider({ children }: { children: ReactNode }) {
  return (
    <PortalProvider client={portal}>
      {children}
    </PortalProvider>
  )
}
