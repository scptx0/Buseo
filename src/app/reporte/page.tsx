import { useEffect, useState } from 'react'
import { ArrowLeft, MapPin, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase/client'
import ReportStation from './ReportStation'
import ReportIncident from './ReportIncident'

interface StationOption { id: number; name: string }

export function ReportePage() {
  const [mode, setMode] = useState<0 | 1 | 2>(0)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [stations, setStations] = useState<StationOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('stations').select('id, name').order('name').then((r) => {
      setStations((r.data as StationOption[]) ?? [])
      setLoading(false)
    })
  }, [])

  const handleSent = () => { setResult({ ok: true, msg: 'Gracias por contribuir con la comunidad.' }) }
  const handleBlocked = (reason: string) => { setResult({ ok: false, msg: reason }) }
  const goBack = () => { setMode(0); setResult(null) }
  const selectCard = (m: 1 | 2) => { setMode(m); setResult(null) }

  if (loading) return <div className="empty"><p>Cargando...</p></div>

  return (
    <div className="app-shell">
      <div className="topbar" style={{ marginBottom: 0 }}>
        <button className="topbar__back" onClick={() => mode === 0 ? window.history.back() : goBack()} aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <span className="topbar__mark">Reporte</span>
      </div>

      {result && (
        <div className="dialog-backdrop">
          <div className="dialog" style={{ textAlign: 'center' }}>
            {result.ok
              ? <CheckCircle size={48} style={{ color: '#16a34a', marginBottom: 12 }} />
              : <XCircle size={48} style={{ color: '#ef4444', marginBottom: 12 }} />
            }
            <h2 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 700 }}>
              {result.ok ? 'Reporte enviado' : 'Reporte rechazado'}
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: '#555', lineHeight: 1.4 }}>{result.msg}</p>
            <button className="btn btn--primary" onClick={goBack}>Aceptar</button>
          </div>
        </div>
      )}

      {mode === 0 ? (
        <div className="report-page">
          <h1 className="report-title">Quieres hacer un reporte?</h1>
          <div className="report-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <button className="report-card" onClick={() => selectCard(1)}>
              <div className="report-card__icon" style={{ background: '#ece5fb', color: '#6b4faa' }}>
                <MapPin size={70} />
              </div>
              <div className="report-card__info">
                <div className="report-card__title">Estado de estacion</div>
                <div className="report-card__desc">Reporta colas, llenado, que bus esperas.</div>
              </div>
            </button>

            <button className="report-card" onClick={() => selectCard(2)}>
              <div className="report-card__icon" style={{ background: '#fbf3c7', color: '#d4a017' }}>
                <AlertTriangle size={70} />
              </div>
              <div className="report-card__info">
                <div className="report-card__title">Incidente</div>
                <div className="report-card__desc">Averias, seguridad o emergencias.</div>
              </div>
            </button>
          </div>
        </div>
      ) : mode === 1 ? (
        <ReportStation stations={stations} onCancel={goBack} onSent={handleSent} onBlocked={handleBlocked} />
      ) : (
        <ReportIncident stations={stations} onCancel={goBack} onSent={handleSent} onBlocked={handleBlocked} />
      )}
    </div>
  )
}