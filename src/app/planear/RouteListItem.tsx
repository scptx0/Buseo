import { AlertTriangle, ChevronRight } from 'lucide-react'

import type { RouteApi } from '../../lib/types'
import type { RouteIncidents } from '../../lib/reports'
import { lineName } from '../../lib/rutas'

interface RouteListItemProps {
  route: RouteApi
  incidents?: RouteIncidents
  onSelect: () => void
}

export function RouteListItem({ route, onSelect, incidents }: RouteListItemProps) {
  const hasCritical = route.alerts.some((a) => a.type === 'closure')
  const hasWarning = route.alerts.some((a) => a.type === 'incident' || a.type === 'delay')
  const transferClass =
    route.transfers === 0 ? 'route-item--t0' : route.transfers === 1 ? 'route-item--t1' : 'route-item--t2'
  const inc = incidents ?? { count: 0, critical: 0, warning: 0 }
  const alertClass =
    hasCritical || inc.critical > 0
      ? 'route-item--critical'
      : hasWarning || inc.warning > 0
        ? 'route-item--warning'
        : ''
  const pillClass =
    route.transfers === 0 ? 'status-pill--t0' : route.transfers === 1 ? 'status-pill--t1' : 'status-pill--t2'
  const showLegacyAlerts = route.alerts.length > 0 && inc.count === 0
  const incidentWord = inc.count === 1 ? 'incidente' : 'incidentes'

  return (
    <button
      type="button"
      className={['route-item', transferClass, alertClass].filter(Boolean).join(' ')}
      onClick={onSelect}
    >
      <span className="route-item__lines">{lineName(route.lineName)}</span>
      <span className="route-item__meta">
        <b className="mono">{route.etaMin} min</b>
        <span className={`status-pill ${pillClass}`}>
          <span className="status-dot" aria-hidden />
          {route.transfers === 0
            ? 'Directo'
            : route.transfers === 1
              ? '1 transbordo'
              : `${route.transfers} transbordos`}
        </span>
        <span className="route-item__arrow" aria-hidden>
          <ChevronRight size={18} />
        </span>
      </span>
      {showLegacyAlerts ? (
        <span className="route-item__alert">
          <AlertTriangle size={14} />
          <span>
            {route.alerts.length} {route.alerts.length === 1 ? 'alerta' : 'alertas'}
          </span>
        </span>
      ) : inc.count > 0 ? (
        <span
          className={`route-item__incident route-item__incident--${inc.critical > 0 ? 'critical' : 'warning'}`}
          title={`${inc.count} ${inc.critical > 0 ? 'con reportes críticos' : 'reportado'} en esta ruta`}
        >
          <AlertTriangle size={14} strokeWidth={2.5} />
          <span>{inc.count} {incidentWord}</span>
        </span>
      ) : null}
    </button>
  )
}
