import { useState } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { LocationGate } from './app/entrada/LocationGate'
import { BusesPage } from './app/buses/page'
import { CanalPage } from './app/canal/page'
import { LoginPage } from './app/login/page'
import { MenuPage } from './app/menu/page'
import { PlanearPage } from './app/planear/page'
import { ReportePage } from './app/reporte/page'
import { RutaActualPage } from './app/ruta-actual/page'
import { Layout } from './components/Layout'
import { HeaderTitleProvider } from './components/HeaderTitleContext'
import { SplashScreen } from './components/SplashScreen'
import { BuseoPortalProvider } from './lib/portal/client'
import { hasUserProfile } from './lib/storage'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isLoggedIn = hasUserProfile()
  if (!isLoggedIn && location.pathname !== '/login') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (isLoggedIn && location.pathname === '/login') {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

const SPLASH_SEEN_KEY = 'buseo:splash-shown'

export function App() {
  const [splashDone, setSplashDone] = useState(() => {
    // La splash solo aparece antes de loguearse y una sola vez por sesión
    if (hasUserProfile()) return true
    return sessionStorage.getItem(SPLASH_SEEN_KEY) === '1'
  })

  function finishSplash() {
    sessionStorage.setItem(SPLASH_SEEN_KEY, '1')
    setSplashDone(true)
  }

  return (
    <BuseoPortalProvider>
      <HashRouter>
        <HeaderTitleProvider>
          <LocationGate>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reporte" element={<AuthGuard><ReportePage /></AuthGuard>} />
              <Route element={<AuthGuard><Layout /></AuthGuard>}>
                <Route path="/" element={<MenuPage />} />
                <Route path="/planear" element={<PlanearPage />} />
                <Route path="/ruta-actual" element={<RutaActualPage />} />
                <Route path="/buses" element={<BusesPage />} />
                <Route path="/canal" element={<CanalPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </LocationGate>
          {!splashDone && <SplashScreen onDone={finishSplash} />}
        </HeaderTitleProvider>
      </HashRouter>
    </BuseoPortalProvider>
  )
}
