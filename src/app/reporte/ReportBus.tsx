import { useState } from 'react'
import { lines, stationById } from '../../lib/mockData'
import { submitReport, moderateReport, getUserUUID } from '../../lib/supabase/api'

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
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const lineStations = lineId
    ? lines.find((l) => l.id === lineId)?.stationIds.map((id) => ({ id, name: stationById[id]?.name ?? id })) ?? []
    : []

  const canSubmit = lineId && fromId && toId && occupancy && !sending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSending(true)
    setError('')

    try {
      if (comment.trim()) {
        const mod = await moderateReport(comment.trim())
        if (!mod.allowed) {
          setError(mod.reason || 'Tu mensaje fue bloqueado por no cumplir con las politicas.')
          setSending(false)
          return
        }
      }

      await submitReport({
        userId: getUserUUID(),
        type: 'bus',
        targetId: lineId,
        severity: 'ok',
        description: comment.trim(),
        metadata: {
          lineId,
          fromId,
          toId,
          occupancy,
        },
      })
      onSent()
    } catch {
      setError('Error al enviar el reporte. Intenta de nuevo.')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="stack">
        {error && (
          <div className="card" style={{ borderLeft: '3px solid #ef4444', background: '#fef2f2', padding: '10px 14px', fontSize: '0.88rem', color: '#991b1b', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div className="field">
          <label htmlFor="bus-line" className="field__label">Linea</label>
          <select id="bus-line" className="select" value={lineId} onChange={(e) => { setLineId(e.target.value); setFromId(''); setToId('') }} required>
            <option value="" disabled>Selecciona una linea</option>
            {lines.map((l) => (<option key={l.id} value={l.id}>{l.name}</option>))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="bus-from" className="field__label">Origen</label>
          <select id="bus-from" className="select" value={fromId} onChange={(e) => setFromId(e.target.value)} required disabled={!lineId}>
            <option value="" disabled>Selecciona origen</option>
            {lineStations.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="bus-to" className="field__label">Destino</label>
          <select id="bus-to" className="select" value={toId} onChange={(e) => setToId(e.target.value)} required disabled={!lineId}>
            <option value="" disabled>Selecciona destino</option>
            {lineStations.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
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

        <div className="field">
          <label htmlFor="bus-comment" className="field__label">Comentario opcional</label>
          <textarea id="bus-comment" className="input" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Algo mas que reportar?" style={{ resize: 'vertical' }} />
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
