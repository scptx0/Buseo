import { useState } from 'react'
import { submitReport, moderateReport, getUserUUID } from '../../lib/supabase/api'
import { lineName } from '../../lib/rutas'

interface LineOption { id: number; name: string }
interface StationOption { id: number; name: string }

interface Props {
  lines: LineOption[]
  stations: StationOption[]
  onCancel: () => void
  onSent: () => void
  onBlocked: (reason: string) => void
}

function formatStationName(raw: string): string {
  const cleaned = raw.toLowerCase().replace(/-/g, ' ')
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

export default function ReportBus({ lines, stations, onCancel: _onCancel, onSent, onBlocked }: Props) {
  const [lineId, setLineId] = useState<number | ''>('')
  const [fromId, setFromId] = useState<number | ''>('')
  const [toId, setToId] = useState<number | ''>('')
  const [occupancy, setOccupancy] = useState<'' | 'low' | 'medium' | 'high'>('')
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = lineId !== '' && fromId !== '' && toId !== '' && occupancy !== '' && !sending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSending(true)
    setError('')

    try {
      if (comment.trim()) {
        const mod = await moderateReport(comment.trim())
        if (!mod.allowed) {
          onBlocked(mod.reason || 'Tu mensaje no cumple con las politicas.')
          return
        }
      }

      await submitReport({
        userId: getUserUUID(),
        type: 'bus',
        targetId: String(lineId),
        severity: 'ok',
        description: comment.trim(),
        metadata: { lineId, fromId, toId, occupancy },
      })
      onSent()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el reporte.')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="report-form">
      <div className="stack">
        {error && (
          <div className="card" style={{ borderLeft: '3px solid #ef4444', background: '#fef2f2', padding: '10px 14px', fontSize: '0.88rem', color: '#991b1b', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div className="field">
          <label htmlFor="bus-line" className="field__label">
            Línea
          </label>
          <select
            id="bus-line"
            className="select"
            value={lineId}
            onChange={(e) => {
              setLineId(Number(e.target.value))
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
                {lineName(l.name)}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="bus-from" className="field__label">Origen</label>
          <select id="bus-from" className="select" value={fromId} onChange={(e) => setFromId(Number(e.target.value))} required disabled={!lineId}>
            <option value="" disabled>Selecciona origen</option>
            {stations.map((s) => (<option key={s.id} value={s.id}>{formatStationName(s.name)}</option>))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="bus-to" className="field__label">Destino</label>
          <select id="bus-to" className="select" value={toId} onChange={(e) => setToId(Number(e.target.value))} required disabled={!lineId}>
            <option value="" disabled>Selecciona destino</option>
            {stations.map((s) => (<option key={s.id} value={s.id}>{formatStationName(s.name)}</option>))}
          </select>
        </div>

        <div className="field">
          <span className="field__label">Ocupacion</span>
          <div className="radio-grid">
            {([{ value: 'low', label: 'Vacio' }, { value: 'medium', label: 'Medio' }, { value: 'high', label: 'Lleno' }] as const).map((opt) => (
              <label key={opt.value} className="radio-option">
                <input type="radio" name="bus-occupancy" value={opt.value} checked={occupancy === opt.value} onChange={() => setOccupancy(opt.value)} required />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="field report-comment">
          <label htmlFor="bus-comment" className="field__label">Comentario opcional</label>
          <textarea id="bus-comment" className="input report-textarea" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Algo mas que reportar?" style={{ resize: 'vertical' }} />
        </div>
      </div>

      <div className="cta-bar">
        <button type="submit" className="btn btn--primary" disabled={!canSubmit}>
          {sending ? 'Enviando...' : 'Enviar reporte'}
        </button>
      </div>
    </form>
  )
}
