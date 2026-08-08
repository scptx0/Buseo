import { useState } from 'react'
import { ArrowLeft, Bus, MapPin, AlertTriangle, CheckCircle } from 'lucide-react'
import ReportBus from './ReportBus'
import ReportStation from './ReportStation'
import ReportIncident from './ReportIncident'

export default function ReportePage() {
  const [mode, setMode] = useState<0 | 1 | 2 | 3>(0)
  const [success, setSuccess] = useState(false)

  const handleSent = () => {
    setSuccess(true)
  }

  const goBack = () => {
    setMode(0)
    setSuccess(false)
  }

  const selectCard = (m: 1 | 2 | 3) => {
    setMode(m)
    setSuccess(false)
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        {mode !== 0 && !success && (
          <button className="topbar__back" onClick={goBack} aria-label="Volver">
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="screen-title" style={{ margin: 0 }}>
          Reporte
        </h1>
      </div>

      {success ? (
        <div className="text-center" style={{ paddingTop: 40 }}>
          <CheckCircle size={64} style={{ color: '#107c10', marginBottom: 16 }} />
          <h2 className="screen-title">Reporte enviado</h2>
          <p className="screen-caption">Gracias por contribuir con la comunidad.</p>
          <button className="btn btn--primary" onClick={goBack}>
            Volver
          </button>
        </div>
      ) : mode === 0 ? (
        <div className="report-selector">
          <button className="report-card" onClick={() => selectCard(1)}>
            <div
              className="report-card__icon"
              style={{ background: 'var(--color-celeste)', color: 'var(--color-primary-deep)' }}
            >
              <Bus size={24} />
            </div>
            <div className="report-card__info">
              <div className="report-card__title">Estado del bus</div>
              <div className="report-card__desc">Cuéntanos cómo va tu bus (ocupación, demoras).</div>
            </div>
          </button>

          <button className="report-card" onClick={() => selectCard(2)}>
            <div
              className="report-card__icon"
              style={{ background: 'var(--color-purple)', color: '#6b4faa' }}
            >
              <MapPin size={24} />
            </div>
            <div className="report-card__info">
              <div className="report-card__title">Estado de estación</div>
              <div className="report-card__desc">Reporta colas, estado de puertas, limpieza.</div>
            </div>
          </button>

          <button className="report-card" onClick={() => selectCard(3)}>
            <div
              className="report-card__icon"
              style={{ background: 'var(--color-yellow)', color: '#d4a017' }}
            >
              <AlertTriangle size={24} />
            </div>
            <div className="report-card__info">
              <div className="report-card__title">Incidente</div>
              <div className="report-card__desc">Averías, seguridad, o emergencias en tramo o estación.</div>
            </div>
          </button>
        </div>
      ) : mode === 1 ? (
        <ReportBus onCancel={goBack} onSent={handleSent} />
      ) : mode === 2 ? (
        <ReportStation onCancel={goBack} onSent={handleSent} />
      ) : (
        <ReportIncident onCancel={goBack} onSent={handleSent} />
      )}
    </div>
  )
}

export { ReportePage }

