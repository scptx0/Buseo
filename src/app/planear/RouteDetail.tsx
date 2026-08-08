import { ArrowLeft, ArrowRight, ArrowDown, ArrowLeftRight, X, Clock, Bus, AlertTriangle, XCircle } from 'lucide-react'

import type { Alert, RouteApi } from '../../lib/types'
import { RouteGraphView } from './RouteGraphView'
import { lineName } from '../../lib/rutas'

interface RouteDetailProps {
  route: RouteApi
  originId: number
  destId: number
  stationName: (id: number) => string
  onBack: () => void
  onSave: () => void
  saved?: boolean
  onClose?: () => void
  onGoToRoute?: () => void
}

export function RouteDetail({
  route, originId, destId, stationName, onBack, onSave,
  saved, onClose, onGoToRoute,
}: RouteDetailProps) {
  const lines = [...new Set(route.steps.map((s) => lineName(s.lineName)))]
  const alerts = route.alerts ?? []

  return (
    <div className="route-detail">
      <header className="route-detail__header">
        {saved ? (
          <button type="button" className="topbar__back" onClick={onClose} aria-label="Cerrar">
            <X size={21} strokeWidth={2.5} />
          </button>
        ) : (
          <button type="button" className="topbar__back" onClick={onBack} aria-label="Volver">
            <ArrowLeft size={21} strokeWidth={2.5} />
          </button>
        )}
        <span className="route-detail__title">Detalle de ruta</span>
      </header>

      <div className="route-detail__body">
      <div className="route-detail__hero">
        <div className="route-detail__stations">
          <span className="route-detail__station">{stationName(originId)}</span>
          <ArrowRight className="route-detail__arrow" size={26} strokeWidth={2} />
          <span className="route-detail__station">{stationName(destId)}</span>
        </div>
      </div>

      <div className="route-detail__stats">
        <div className="route-detail__stat">
          <Clock className="route-detail__stat-icon" size={24} strokeWidth={2} />
          <span className="route-detail__stat-value">{route.etaMin} min</span>
          <span className="route-detail__stat-label">Tiempo</span>
        </div>
        <div className="route-detail__stat">
          <Bus className="route-detail__stat-icon" size={24} strokeWidth={2} />
          <span className="route-detail__stat-value">{lines.length}</span>
          <span className="route-detail__stat-label">{lines.length === 1 ? 'Línea' : 'Líneas'}</span>
        </div>
        <div className="route-detail__stat">
          <ArrowLeftRight className="route-detail__stat-icon" size={24} strokeWidth={2} />
          <span className="route-detail__stat-value">{route.transfers}</span>
          <span className="route-detail__stat-label">
            {route.transfers === 0 ? 'Directo' : route.transfers === 1 ? 'Transbordo' : 'Transbordos'}
          </span>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="route-alerts">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} stationName={stationName} />
          ))}
        </div>
      )}

      <div className="route-detail__timeline">
        {route.steps.map((step, i) => (
          <div key={i} className="route-step">
            <div className="route-step__content">
              <div className="route-step__header">
                <span className="route-step__action">
                  {i === 0 ? 'Sube' : 'Transbordo'}
                </span>
                 <span className="route-step__line-name" style={{ backgroundColor: getLineColor(step.lineId) }}>
                  {lineName(step.lineName)}
                </span>
              </div>
              <div className="route-step__stations">
                <div className="route-step__station">
                  <span>{stationName(step.nodes[0]?.stationId ?? 0)}</span>
                </div>
                <ArrowDown className="route-step__arrow" size={18} strokeWidth={2} />
                <div className="route-step__station">
                  <span>{stationName(step.nodes[step.nodes.length - 1]?.stationId ?? 0)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="route-detail__graph">
        <RouteGraphView route={route} />
      </div>
      </div>

      <div className="route-detail__footer">
        {saved ? (
          <button className="btn btn--primary btn--full" onClick={onGoToRoute}>
            Ver tu ruta
          </button>
        ) : (
          <button className="btn btn--primary btn--full" onClick={onSave}>
            Iniciar viaje
          </button>
        )}
      </div>
    </div>
  )
}

function AlertCard({ alert, stationName }: { alert: Alert; stationName: (id: number) => string }) {
  const typeLabel = { delay: 'Demora', incident: 'Incidente', closure: 'Cierre' }

  return (
    <div className="alert-card">
      <div className="alert-card__icon">
        {alert.type === 'delay' && <Clock size={24} strokeWidth={2} />}
        {alert.type === 'incident' && <AlertTriangle size={24} strokeWidth={2} />}
        {alert.type === 'closure' && <XCircle size={24} strokeWidth={2} />}
      </div>
      <div className="alert-card__content">
        <span className="alert-card__type">{typeLabel[alert.type]}</span>
        {alert.stationId && <span className="alert-card__station">{stationName(Number(alert.stationId))}</span>}
        <p className="alert-card__message">{alert.message}</p>
      </div>
    </div>
  )
}

function getLineColor(lineId: number): string {
  const colors: Record<number, string> = { 17: '#0078d4', 18: '#6b4faa', 19: '#107c10' }
  return colors[lineId] || '#8a92ac'
}
