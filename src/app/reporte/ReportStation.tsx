import { useState } from 'react'
import { stations } from '../../lib/mockData'
import type { Severity } from '../../lib/types'
import { pushReport } from './storage'

interface Props {
  onCancel: () => void
  onSent: () => void
}

function formatStationName(raw: string): string {
  const cleaned = raw.toLowerCase().replace(/-/g, ' ')
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

export default function ReportStation({ onCancel: _onCancel, onSent }: Props) {
  const [stationId, setStationId] = useState('')
  const [severity, setSeverity] = useState<Severity | ''>('')
  const [queue, setQueue] = useState<'' | 'low' | 'medium' | 'high'>('')
  const [comment, setComment] = useState('')

  const canSubmit = stationId && severity && queue

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    pushReport({
      type: 'station',
      stationId,
      severity,
      queue,
      comment: comment.trim() || undefined,
    })
    onSent()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="stack">
        <div className="field">
          <label htmlFor="st-station" className="field__label">
            Estación
          </label>
          <select
            id="st-station"
            className="select"
            value={stationId}
            onChange={(e) => setStationId(e.target.value)}
            required
          >
            <option value="" disabled>
              Selecciona una estación
            </option>
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {formatStationName(s.name)}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <span className="field__label">Severidad</span>
          <div className="radio-grid">
            {(
              [
                { value: 'ok' as const, label: 'Normal' },
                { value: 'warning' as const, label: 'Advertencia' },
                { value: 'critical' as const, label: 'Crítico' },
              ] as const
            ).map((opt) => (
              <label key={opt.value} className="radio-option">
                <input
                  type="radio"
                  name="st-severity"
                  value={opt.value}
                  id={`st-severity-${opt.value}`}
                  checked={severity === opt.value}
                  onChange={() => setSeverity(opt.value)}
                  required
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field__label">Cola</span>
          <div className="radio-grid">
            {(
              [
                { value: 'low' as const, label: 'Ninguna' },
                { value: 'medium' as const, label: 'Moderada' },
                { value: 'high' as const, label: 'Alta' },
              ] as const
            ).map((opt) => (
              <label key={opt.value} className="radio-option">
                <input
                  type="radio"
                  name="st-queue"
                  value={opt.value}
                  id={`st-queue-${opt.value}`}
                  checked={queue === opt.value}
                  onChange={() => setQueue(opt.value)}
                  required
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="st-comment" className="field__label">
            Comentario opcional
          </label>
          <textarea
            id="st-comment"
            className="input"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Detalles adicionales"
            style={{ resize: 'vertical' }}
          />
        </div>
      </div>

      <div className="cta-bar">
        <button type="submit" className="btn btn--primary" disabled={!canSubmit}>
          Enviar reporte
        </button>
      </div>
    </form>
  )
}
