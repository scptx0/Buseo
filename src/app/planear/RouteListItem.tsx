import { lineName, stationName } from '../../lib/rutas'
import type { PlannedRoute } from '../../lib/types'

interface RouteListItemProps {
  route: PlannedRoute
  onSelect: () => void
}

export function RouteListItem({ route, onSelect }: RouteListItemProps) {
  const lines = route.steps.map((s) => lineName(s.lineId)).join(' → ')
  const first = route.steps[0].from
  const last = route.steps[route.steps.length - 1].to
  const hasAlerts = route.alerts && route.alerts.length > 0

  return (
    <button type="button" className="route-item" onClick={onSelect}>
      <span className="route-item__lines">{lines}</span>
      <span className="route-item__path">
        {stationName(first)} → {stationName(last)}
      </span>
      <span className="route-item__meta">
        <b className="mono">{route.etaMin} min</b>
        {hasAlerts ? (
          <span className="route-item__alert">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
              <path d="M12 9v4m0 4h.01" />
            </svg>
            <span>{route.alerts?.length} {route.alerts?.length === 1 ? 'alerta' : 'alertas'}</span>
          </span>
        ) : (
          <span className="status-pill status-pill--ok">
            <span className="status-dot" aria-hidden />
            Sin reportes
          </span>
        )}
        <span className="route-item__arrow" aria-hidden>
          ›
        </span>
      </span>
    </button>
  )
}