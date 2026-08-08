import { useState } from 'react'
import { lines, stationById } from '../../lib/mockData'
import { pushReport } from './storage'

interface Props {
  onCancel: () => void
  onSent: () => void
}

export default function ReportBus({ onCancel: _onCancel, onSent }: Props) {
  const [lineId, setLineId] = useState('')
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [occupancy, setOccupancy] = useState<'' | 'low' | 'medium' | 'high'>('')
  const [comment, setComment] = useState('')

  const lineStations = lineId
    ? lines.find((l) => l.id === lineId)?.stationIds.map((id) => ({ id, name: stationById[id]?.name ?? id })) ?? []
    : []

  const canSubmit = lineId && fromId && toId && occupancy

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    pushReport({
      type: 'bus',
      lineId,
      fromId,
      toId,
      occupancy,
      comment: comment.trim() || undefined,
    })
    onSent()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="stack">
        <div className="field">
          <label htmlFor="bus-line" className="field__label">
            Línea
          </label>
          <select
            id="bus-line"
            className="select"
            value={lineId}
            onChange={(e) => {
              setLineId(e.target.value)
              setFromId('')
              setToId('')
            }}
            required
          >
            <option value="" disabled>
              Selecciona una línea
            </option>
            {lines.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="bus-from" className="field__label">
            Origen
          </label>
          <select
            id="bus-from"
            className="select"
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            required
            disabled={!lineId}
          >
            <option value="" disabled>
              Selecciona origen
            </option>
            {lineStations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="bus-to" className="field__label">
            Destino
          </label>
          <select
            id="bus-to"
            className="select"
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            required
            disabled={!lineId}
          >
            <option value="" disabled>
              Selecciona destino
            </option>
            {lineStations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <span className="field__label">Ocupación</span>
          <div className="radio-grid">
            {(
              [
                { value: 'low', label: 'Vacío' },
                { value: 'medium', label: 'Medio' },
                { value: 'high', label: 'Lleno' },
              ] as const
            ).map((opt) => (
              <label key={opt.value} className="radio-option">
                <input
                  type="radio"
                  name="bus-occupancy"
                  value={opt.value}
                  id={`bus-occupancy-${opt.value}`}
                  checked={occupancy === opt.value}
                  onChange={() => setOccupancy(opt.value)}
                  required
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="bus-comment" className="field__label">
            Comentario opcional
          </label>
          <textarea
            id="bus-comment"
            className="input"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="¿Algo más que reportar?"
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
