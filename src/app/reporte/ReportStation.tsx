import { useState, useEffect } from 'react'
import {
  submitReport,
  moderateReport,
  getUserUUID,
  fetchBusesAtStation,
  inferReport,
  type BusAtStation,
} from '../../lib/supabase/api'
import { lineName } from '../../lib/rutas'

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

function directionLabel(d: string): string {
  return d === 'norte' ? 'Norte a Sur' : d === 'sur' ? 'Sur a Norte' : d
}

export default function ReportStation({ stations, onCancel: _onCancel, onSent, onBlocked }: Props) {
  const [stationId, setStationId] = useState<number | ''>('')
  const [busKey, setBusKey] = useState('')
  const [queueVal, setQueueVal] = useState(0)
  const [fillVal, setFillVal] = useState(0)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [buses, setBuses] = useState<BusAtStation[]>([])

  useEffect(() => {
    if (stationId === '') { setBuses([]); setBusKey(''); return }
    fetchBusesAtStation(stationId as number).then(setBuses).catch(() => setBuses([]))
  }, [stationId])

  const canSubmit = stationId !== '' && !sending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSending(true)
    setError('')

    try {
      if (comment.trim()) {
        const mod = await moderateReport(comment.trim())
        if (!mod.allowed) { onBlocked(mod.reason || 'Tu mensaje no cumple con las politicas.'); return }
      }

      const meta: Record<string, unknown> = { stationId: stationId as number }
      if (busKey && busKey.includes('|')) {
        const [lid, dir] = busKey.split('|')
        meta.lineId = Number(lid)
        meta.direction = dir
      }
      if (queueVal > 0) meta.queueLevel = queueVal
      if (fillVal > 0) meta.occupancyLevel = fillVal
      if (comment.trim()) meta.comment = comment.trim()

      const { id } = await submitReport({
        userId: getUserUUID(),
        type: 'station',
        targetId: String(stationId),
        description: comment.trim(),
        metadata: meta,
      })

      // Inferir severidad y summary con Bedrock en background
      inferReport(id).catch(() => { /* background, no bloquea la UI */ })

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
          <label htmlFor="st-station" className="field__label">
            Estacion
          </label>
          <select
            id="st-station"
            className="select"
            value={stationId}
            onChange={(e) => setStationId(Number(e.target.value))}
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

        {buses.length > 0 && (
          <div className="field">
            <label htmlFor="st-bus" className="field__label">
              Que bus esperas?
            </label>
            <select
              id="st-bus"
              className="select"
              value={busKey}
              onChange={(e) => setBusKey(e.target.value)}
            >
              <option value="">(No reportar)</option>
              {buses.map((b) => (
                <option key={`${b.lineId}|${b.direction}`} value={`${b.lineId}|${b.direction}`}>
                  {lineName(b.lineName)} · {directionLabel(b.direction)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label className="field__label">
            Que tan larga es la cola?{queueVal === 0 ? '' : <> <strong>{queueVal}</strong></>}
          </label>
          <div className={`slider-row ${queueVal > 0 ? 'slider-row--active' : ''}`}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
              <span
                key={v}
                className={`slider-dot ${queueVal >= v ? 'slider-dot--on' : ''}`}
                onClick={() => setQueueVal(queueVal === v ? 0 : v)}
              />
            ))}
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={queueVal}
              onChange={(e) => setQueueVal(Number(e.target.value))}
              className="slider-range"
              aria-label="Nivel de cola"
            />
          </div>
        </div>

        <div className="field">
          <label className="field__label">
            Que tan llena esta la estacion?{fillVal === 0 ? '' : <> <strong>{fillVal}</strong></>}
          </label>
          <div className={`slider-row ${fillVal > 0 ? 'slider-row--active' : ''}`}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
              <span
                key={v}
                className={`slider-dot ${fillVal >= v ? 'slider-dot--on' : ''}`}
                onClick={() => setFillVal(fillVal === v ? 0 : v)}
              />
            ))}
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={fillVal}
              onChange={(e) => setFillVal(Number(e.target.value))}
              className="slider-range"
              aria-label="Nivel de llenado"
            />
          </div>
        </div>

        <div className="field report-comment">
          <label htmlFor="st-comment" className="field__label">Comentario opcional</label>
          <textarea
            id="st-comment"
            className="input report-textarea"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Algo mas que reportar?"
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