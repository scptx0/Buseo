import { AlertTriangle, ChevronRight } from 'lucide-react'

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
  const alerts = route.alerts ?? []
  const hasCritical = alerts.some((a) => a.type === 'closure')
  const hasWarning = alerts.some((a) => a.type === 'incident' || a.type === 'delay')
  const toneClass = hasCritical ? 'route-item--critical' : hasWarning ? 'route-item--warning' : 'route-item--clean'

  return (
    <button type="button" className={`route-item ${toneClass}`} onClick={onSelect}>
      <span className="route-item__lines">{lines}</span>
      <span className="route-item__path">
        {stationName(first)} → {stationName(last)}
      </span>
      <span className="route-item__meta">
        <b className="mono">{route.etaMin} min</b>
        {alerts.length > 0 ? (
          <span className="route-item__alert">
            <AlertTriangle size={14} />
            <span>{alerts.length} {alerts.length === 1 ? 'alerta' : 'alertas'}</span>
          </span>
        ) : (
          <span className="status-pill status-pill--ok">
            <span className="status-dot" aria-hidden />
            Sin reportes
          </span>
        )}
        <span className="route-item__arrow" aria-hidden>
          <ChevronRight size={18} />
        </span>
      </span>
    </button>
  )
}