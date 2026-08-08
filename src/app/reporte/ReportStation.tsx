import { useState } from 'react'
import type { Severity } from '../../lib/types'
import { submitReport, moderateReport, getUserUUID } from '../../lib/supabase/api'

interface StationOption { id: number; name: string }

interface Props { stations: StationOption[]; onCancel: () => void; onSent: () => void; onBlocked: (reason: string) => void }

export default function ReportStation({ stations, onCancel: _onCancel, onSent, onBlocked }: Props) {
  const [stationId, setStationId] = useState<number | ''>('')
  const [severity, setSeverity] = useState<Severity | ''>('')
  const [queue, setQueue] = useState<'' | 'low' | 'medium' | 'high'>('')
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = stationId !== '' && severity !== '' && queue !== '' && !sending

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
        type: 'station',
        targetId: String(stationId),
        severity,
        description: comment.trim(),
        metadata: { stationId, queue },
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
          <div className="card" style={{ borderLeft: '3px solid #ef4444', background: '#fef2f2', padding: '10px 14px', fontSize: '0.88rem', color: '#991b1b', fontWeight: 600 }}>{error}</div>
        )}

        <div className="field">
          <label htmlFor="st-station" className="field__label">Estacion</label>
          <select id="st-station" className="select" value={stationId} onChange={(e) => setStationId(Number(e.target.value))} required>
            <option value="" disabled>Selecciona una estacion</option>
            {stations.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>
        </div>

        <div className="field">
          <span className="field__label">Severidad</span>
          <div className="radio-grid">
            {([{ value: 'ok' as const, label: 'Normal' }, { value: 'warning' as const, label: 'Advertencia' }, { value: 'critical' as const, label: 'Critico' }] as const).map((opt) => (
              <label key={opt.value} className="radio-option">
                <input type="radio" name="st-severity" value={opt.value} checked={severity === opt.value} onChange={() => setSeverity(opt.value)} required />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field__label">Cola</span>
          <div className="radio-grid">
            {([{ value: 'low' as const, label: 'Ninguna' }, { value: 'medium' as const, label: 'Moderada' }, { value: 'high' as const, label: 'Alta' }] as const).map((opt) => (
              <label key={opt.value} className="radio-option">
                <input type="radio" name="st-queue" value={opt.value} checked={queue === opt.value} onChange={() => setQueue(opt.value)} required />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="field report-comment">
          <label htmlFor="st-comment" className="field__label">Comentario opcional</label>
          <textarea id="st-comment" className="input report-textarea" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Detalles adicionales" style={{ resize: 'vertical' }} />
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
