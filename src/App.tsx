import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'

import { LocationGate } from './app/entrada/LocationGate'
import { BusesPage } from './app/buses/page'
import { CanalPage } from './app/canal/page'
import { MenuPage } from './app/menu/page'
import { PlanearPage } from './app/planear/page'
import { ReportePage } from './app/reporte/page'
import { RutaActualPage } from './app/ruta-actual/page'
import { Layout } from './components/Layout'

export function App() {
  return (
    <HashRouter>
      <LocationGate>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<MenuPage />} />
            <Route path="/planear" element={<PlanearPage />} />
            <Route path="/ruta-actual" element={<RutaActualPage />} />
            <Route path="/reporte" element={<ReportePage />} />
            <Route path="/buses" element={<BusesPage />} />
            <Route path="/canal" element={<CanalPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </LocationGate>
    </HashRouter>
  )
}