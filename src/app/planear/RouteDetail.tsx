import { ArrowLeft, ArrowRight, ArrowDown, ArrowLeftRight, X, Clock, Bus, CircleDot, AlertTriangle, XCircle } from 'lucide-react'

import { lineName, stationName } from '../../lib/rutas'
import { stationById } from '../../lib/mockData'
import type { Alert, PlannedRoute } from '../../lib/types'
import { RouteGraphView } from './RouteGraphView'

interface RouteDetailProps {
  route: PlannedRoute
  originId: string
  destId: string
  onBack: () => void
  onSave: () => void
  saved?: boolean
  onClose?: () => void
  onGoToRoute?: () => void
}

export function RouteDetail({ route, originId, destId, onBack, onSave, saved, onClose, onGoToRoute }: RouteDetailProps) {
  const lines = [...new Set(route.steps.map((s) => s.lineId))]
  const transfers = route.steps.length - 1
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
          <span className="route-detail__stat-value">{transfers}</span>
          <span className="route-detail__stat-label">{transfers === 0 ? 'Directo' : transfers === 1 ? 'Transbordo' : 'Transbordos'}</span>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="route-alerts">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      <div className="route-detail__timeline">
        {route.steps.map((step, i) => (
          <div key={i} className="route-step">
            <div className="route-step__marker">
              <div className="route-step__dot route-step__dot--start">
                <CircleDot size={18} strokeWidth={2.5} />
              </div>
              {i < route.steps.length - 1 && <div className="route-step__line" />}
            </div>
            <div className="route-step__content">
              <div className="route-step__header">
                <span className="route-step__action">
                  {i === 0 ? 'Sube' : 'Transbordo'}
                </span>
                <span className="route-step__line-name" style={{ backgroundColor: getLineColor(step.lineId) }}>
                  {lineName(step.lineId)}
                </span>
              </div>
              <div className="route-step__stations">
                <div className="route-step__station">
                  <CircleDot size={16} fill="currentColor" />
                  <span>{stationName(step.from)}</span>
                </div>
                <ArrowDown className="route-step__arrow" size={18} strokeWidth={2} />
                <div className="route-step__station">
                  <CircleDot size={16} fill="currentColor" />
                  <span>{stationName(step.to)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="route-detail__graph">
        <RouteGraphView routes={[route]} />
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

function AlertCard({ alert }: { alert: Alert }) {
  const station = alert.stationId ? stationById[alert.stationId] : null
  const typeLabel = {
    delay: 'Demora',
    incident: 'Incidente',
    closure: 'Cierre',
  }

  return (
    <div className="alert-card">
      <div className="alert-card__icon">
        {alert.type === 'delay' && <Clock size={24} strokeWidth={2} />}
        {alert.type === 'incident' && <AlertTriangle size={24} strokeWidth={2} />}
        {alert.type === 'closure' && <XCircle size={24} strokeWidth={2} />}
      </div>
      <div className="alert-card__content">
        <span className="alert-card__type">{typeLabel[alert.type]}</span>
        {station && <span className="alert-card__station">{station.name}</span>}
        <p className="alert-card__message">{alert.message}</p>
      </div>
    </div>
  )
}

function getLineColor(lineId: string): string {
  const colors: Record<string, string> = {
    '1': '#0078d4',
    '2': '#6b4faa',
    '3': '#107c10',
    '4': '#d4a017',
    '5': '#00a4ef',
  }
  return colors[lineId] || '#8a92ac'
}