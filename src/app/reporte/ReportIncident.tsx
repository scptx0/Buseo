import { useState } from 'react'
import { submitReport, moderateReport, getUserUUID } from '../../lib/supabase/api'

interface StationOption { id: number; name: string }

interface Props { stations: StationOption[]; onCancel: () => void; onSent: () => void; onBlocked: (reason: string) => void }

export default function ReportIncident({ stations, onCancel: _onCancel, onSent, onBlocked }: Props) {
  const [stationId, setStationId] = useState<number | ''>('')
  const [incidentType, setIncidentType] = useState<'' | 'delay' | 'incident' | 'closure'>('')
  const [description, setDescription] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = stationId !== '' && incidentType !== '' && description.trim().length > 0 && !sending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSending(true)
    setError('')

    try {
      if (description.trim()) {
        const mod = await moderateReport(description.trim())
        if (!mod.allowed) {
          onBlocked(mod.reason || 'Tu mensaje no cumple con las politicas.')
          return
        }
      }

      await submitReport({
        userId: getUserUUID(),
        type: 'incident',
        targetId: String(stationId),
        severity: incidentType === 'closure' ? 'critical' : incidentType === 'incident' ? 'warning' : 'ok',
        description: description.trim(),
        metadata: { stationId, incidentType },
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
          <label htmlFor="inc-station" className="field__label">Ubicacion</label>
          <select id="inc-station" className="select" value={stationId} onChange={(e) => setStationId(Number(e.target.value))} required>
            <option value="" disabled>Selecciona una estacion</option>
            {stations.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>
        </div>

        <div className="field">
          <span className="field__label">Tipo</span>
          <div className="radio-grid">
            {([{ value: 'delay' as const, label: 'Demora' }, { value: 'incident' as const, label: 'Incidente' }, { value: 'closure' as const, label: 'Cierre' }] as const).map((opt) => (
              <label key={opt.value} className="radio-option">
                <input type="radio" name="inc-type" value={opt.value} checked={incidentType === opt.value} onChange={() => setIncidentType(opt.value)} required />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="field report-comment">
          <label htmlFor="inc-desc" className="field__label">Descripcion</label>
          <textarea id="inc-desc" className="input report-textarea" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe lo ocurrido" required style={{ resize: 'vertical' }} />
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
