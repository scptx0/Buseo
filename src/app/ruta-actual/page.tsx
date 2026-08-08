import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { getActiveRoute } from '../../lib/storage'
import { searchRoutes, stationName, lineName } from '../../lib/rutas'
import type { PlannedRoute } from '../../lib/types'
import { RouteGraph } from './RouteGraph'

export function RutaActualPage() {
  const navigate = useNavigate()
  const active = getActiveRoute()

  if (!active) {
    return (
      <div className="empty">
        <h2 className="screen-title">No tienes una ruta activa</h2>
        <p className="screen-caption">
          Planifica una ruta para empezar a seguirla en vivo.
        </p>
        <button className="btn btn--primary" onClick={() => navigate('/planear')}>
          Planificar ruta
        </button>
      </div>
    )
  }

  const results = searchRoutes(active.from, active.to)
  const plannedRoute: PlannedRoute | null = results[0] ?? null

  if (!plannedRoute) {
    return (
      <div className="empty">
        <h2 className="screen-title">No se encontró la ruta</h2>
        <p className="screen-caption">
          No pudimos reconstruir tu ruta activa. Vuelve a planearla.
        </p>
        <button className="btn btn--primary" onClick={() => navigate('/planear')}>
          Planificar ruta
        </button>
      </div>
    )
  }

  const linesUsed = Array.from(
    new Set(plannedRoute.steps.map((s) => s.lineId)),
  ).map((id) => lineName(id))

  function finishRoute() {
    localStorage.removeItem('buseo:active-route')
    navigate('/')
  }

  return (
    <div className="stack">
      <div className="topbar">
        <button
          type="button"
          className="topbar__back"
          onClick={() => navigate(-1)}
          aria-label="Volver"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <span className="screen-title">Tu ruta</span>
      </div>

      <div className="route-summary">
        <p className="screen-caption">
          {stationName(active.from)} → {stationName(active.to)}
        </p>
        <p className="screen-caption">
          {plannedRoute.etaMin} min · {linesUsed.join(' + ')}
        </p>
      </div>

      <RouteGraph route={plannedRoute} />

      <div className="cta-bar">
        <button className="btn btn--primary" onClick={finishRoute}>
          Finalizar ruta
        </button>
      </div>
    </div>
  )
}
