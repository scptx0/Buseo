import { lineName, stationName } from '../../lib/rutas'
import { stationById, type Alert, type PlannedRoute } from '../../lib/mockData'

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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        ) : (
          <button type="button" className="topbar__back" onClick={onBack} aria-label="Volver">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <span className="route-detail__title">Detalle de ruta</span>
      </header>

      <div className="route-detail__hero">
        <div className="route-detail__stations">
          <span className="route-detail__station">{stationName(originId)}</span>
          <svg className="route-detail__arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
          <span className="route-detail__station">{stationName(destId)}</span>
        </div>
      </div>

      <div className="route-detail__stats">
        <div className="route-detail__stat">
          <svg className="route-detail__stat-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span className="route-detail__stat-value">{route.etaMin} min</span>
          <span className="route-detail__stat-label">Tiempo</span>
        </div>
        <div className="route-detail__stat">
          <svg className="route-detail__stat-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 6v6m7-6v6M2 12h19.6M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2s-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" />
            <circle cx="7" cy="18" r="2" />
            <path d="M9 18h5" />
            <circle cx="16" cy="18" r="2" />
          </svg>
          <span className="route-detail__stat-value">{lines.length}</span>
          <span className="route-detail__stat-label">{lines.length === 1 ? 'Línea' : 'Líneas'}</span>
        </div>
        <div className="route-detail__stat">
          <svg className="route-detail__stat-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 2l4 4-4 4" />
            <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
            <path d="M7 22l-4-4 4-4" />
            <path d="M21 13v1a4 4 0 0 1-4 4H3" />
          </svg>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                </svg>
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
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="6" />
                  </svg>
                  <span>{stationName(step.from)}</span>
                </div>
                <svg className="route-step__arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14" />
                  <path d="M19 12l-7 7-7-7" />
                </svg>
                <div className="route-step__station">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="6" />
                  </svg>
                  <span>{stationName(step.to)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="route-detail__footer">
        {saved ? (
          <button className="btn btn--primary btn--full" onClick={onGoToRoute}>
            Ver tu ruta
          </button>
        ) : (
          <button className="btn btn--primary btn--full" onClick={onSave}>
            Guardar ruta
          </button>
        )}
      </div>
    </div>
  )
}

function AlertCard({ alert }: { alert: Alert }) {
  const station = alert.stationId ? stationById(alert.stationId) : null
  const typeLabel = {
    delay: 'Demora',
    incident: 'Incidente',
    closure: 'Cierre',
  }

  return (
    <div className="alert-card">
      <div className="alert-card__icon">
        {alert.type === 'delay' && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        )}
        {alert.type === 'incident' && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
            <path d="M12 9v4m0 4h.01" />
          </svg>
        )}
        {alert.type === 'closure' && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6m0-6 6 6" />
          </svg>
        )}
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