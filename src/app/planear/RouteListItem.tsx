import { AlertTriangle, ChevronRight } from 'lucide-react'

import type { RouteApi } from '../../lib/types'
import { lineName } from '../../lib/rutas'

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
  const transferClass =
    route.transfers === 0 ? 'route-item--t0' : route.transfers === 1 ? 'route-item--t1' : 'route-item--t2'
  const alertClass = hasCritical ? 'route-item--critical' : hasWarning ? 'route-item--warning' : ''
  const pillClass =
    route.transfers === 0 ? 'status-pill--t0' : route.transfers === 1 ? 'status-pill--t1' : 'status-pill--t2'

  return (
    <button
      type="button"
      className={['route-item', transferClass, alertClass].filter(Boolean).join(' ')}
      onClick={onSelect}
    >
      <span className="route-item__lines">{lineName(route.lineName)}</span>
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
          <span className={`status-pill ${pillClass}`}>
            <span className="status-dot" aria-hidden />
            {route.transfers === 0
              ? 'Directo'
              : route.transfers === 1
                ? '1 transbordo'
                : `${route.transfers} transbordos`}
          </span>
        )}
        <span className="route-item__arrow" aria-hidden>
          <ChevronRight size={18} />
        </span>
      </span>
    </button>
  )
}
