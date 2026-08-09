import { useState } from 'react'
import {
  submitReport,
  moderateReport,
  getUserUUID,
  inferReport,
} from '../../lib/supabase/api'
import { publishReportEvent } from '../../lib/portal/reports'

interface StationOption { id: number; name: string }

interface Props {
  stations: StationOption[]
  onCancel: () => void
  onSent: () => void
  onBlocked: (reason: string) => void
}

function formatStationName(raw: string): string {
  const cleaned = raw.toLowerCase().replace(/-/g, ' ')
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

const INCIDENT_TYPES = [
  { value: 'delay' as const, label: 'Demora' },
  { value: 'incident' as const, label: 'Incidente' },
  { value: 'closure' as const, label: 'Cierre' },
  { value: 'other' as const, label: 'Otro' },
]

export default function ReportIncident({ stations, onCancel: _onCancel, onSent, onBlocked }: Props) {
  const [station1Id, setStation1Id] = useState<number | ''>('')
  const [station2Id, setStation2Id] = useState<number | ''>('')
  const [incidentType, setIncidentType] = useState('')
  const [description, setDescription] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const canSubmit =
    station1Id !== '' && station2Id !== '' && incidentType !== '' && !sending

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

      const meta: Record<string, unknown> = {
        station1Id: station1Id as number,
        station2Id: station2Id as number,
        incidentType,
      }
      if (description.trim()) meta.description = description.trim()

      const { id } = await submitReport({
        userId: getUserUUID(),
        type: 'incident',
        targetId: String(station1Id),
        description: description.trim(),
        metadata: meta,
      })

      inferReport(id).catch(() => { /* background */ })

      // Avisar en tiempo real a la pantalla de rutas (el evento es efímero)
      publishReportEvent({ type: 'incident', targetId: String(station1Id), severity: 'ok' })

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
          <label htmlFor="inc-s1" className="field__label">
            Estacion 1
          </label>
          <select
            id="inc-s1"
            className="select"
            value={station1Id}
            onChange={(e) => setStation1Id(Number(e.target.value))}
            required
          >
            <option value="" disabled>
              Selecciona una estacion
            </option>
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {formatStationName(s.name)}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="inc-s2" className="field__label">
            Estacion 2
          </label>
          <select
            id="inc-s2"
            className="select"
            value={station2Id}
            onChange={(e) => setStation2Id(Number(e.target.value))}
            required
          >
            <option value="" disabled>
              Selecciona una estacion
            </option>
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {formatStationName(s.name)}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="inc-type" className="field__label">
            Tipo de incidente
          </label>
          <select
            id="inc-type"
            className="select"
            value={incidentType}
            onChange={(e) => setIncidentType(e.target.value)}
            required
          >
            <option value="" disabled>
              Selecciona tipo
            </option>
            {INCIDENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field report-comment">
          <label htmlFor="inc-desc" className="field__label">
            Descripcion (opcional)
          </label>
          <textarea
            id="inc-desc"
            className="input report-textarea"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe lo ocurrido"
            style={{ resize: 'vertical' }}
          />
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