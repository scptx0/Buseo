import { useState } from 'react'
import { stations } from '../../lib/mockData'
import { pushReport } from './storage'

interface Props {
  onCancel: () => void
  onSent: () => void
}

export default function ReportIncident({ onCancel: _onCancel, onSent }: Props) {
  const [stationId, setStationId] = useState('')
  const [incidentType, setIncidentType] = useState<'' | 'delay' | 'incident' | 'closure'>('')
  const [description, setDescription] = useState('')

  const canSubmit = stationId && incidentType && description.trim().length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    pushReport({
      type: 'incident',
      stationId,
      incidentType,
      description: description.trim(),
    })
    onSent()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="stack">
        <div className="field">
          <label htmlFor="inc-station" className="field__label">
            Ubicación
          </label>
          <select
            id="inc-station"
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
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <span className="field__label">Tipo</span>
          <div className="radio-grid">
            {(
              [
                { value: 'delay' as const, label: 'Demora' },
                { value: 'incident' as const, label: 'Incidente' },
                { value: 'closure' as const, label: 'Cierre' },
              ] as const
            ).map((opt) => (
              <label key={opt.value} className="radio-option">
                <input
                  type="radio"
                  name="inc-type"
                  value={opt.value}
                  id={`inc-type-${opt.value}`}
                  checked={incidentType === opt.value}
                  onChange={() => setIncidentType(opt.value)}
                  required
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="inc-desc" className="field__label">
            Descripción
          </label>
          <textarea
            id="inc-desc"
            className="input"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe lo ocurrido"
            required
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
