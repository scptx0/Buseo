import { AlertTriangle, ChevronRight } from 'lucide-react'

import type { RouteApi } from '../../lib/types'

interface RouteListItemProps {
  route: RouteApi
  stationName: (id: number) => string
  onSelect: () => void
}

export function RouteListItem({ route, stationName, onSelect }: RouteListItemProps) {
  const firstNode = route.steps[0]?.nodes[0]
  const lastStep = route.steps[route.steps.length - 1]
  const lastNode = lastStep?.nodes[lastStep.nodes.length - 1]
  const hasAlerts = route.alerts.length > 0
  const hasCritical = route.alerts.some((a) => a.type === 'closure')
  const hasWarning = route.alerts.some((a) => a.type === 'incident' || a.type === 'delay')
  const toneClass = hasCritical ? 'route-item--critical' : hasWarning ? 'route-item--warning' : 'route-item--clean'

  return (
    <button type="button" className={`route-item ${toneClass}`} onClick={onSelect}>
      <span className="route-item__lines">{route.lineName}</span>
      <span className="route-item__path">
        {firstNode ? stationName(firstNode.stationId) : '?'} →{' '}
        {lastNode ? stationName(lastNode.stationId) : '?'}
      </span>
      <span className="route-item__meta">
        <b className="mono">{route.etaMin} min</b>
        {hasAlerts ? (
          <span className="route-item__alert">
            <AlertTriangle size={14} />
            <span>
              {route.alerts.length}{' '}
              {route.alerts.length === 1 ? 'alerta' : 'alertas'}
            </span>
          </span>
        ) : (
          <span className="status-pill status-pill--ok">
            <span className="status-dot" aria-hidden />
            {route.transfers === 0 ? 'Directo' : `${route.transfers} transbordo`}
          </span>
        )}
        <span className="route-item__arrow" aria-hidden>
          <ChevronRight size={18} />
        </span>
      </span>
    </button>
  )
}
