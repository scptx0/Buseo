import { useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'

import type { ReportDetail } from '../../lib/types'
import { formatTime } from '../../lib/format'

interface RouteReportsSheetProps {
  reports: ReportDetail[]
  loading: boolean
  stationName: (id: number) => string
  onClose: () => void
}

export function RouteReportsSheet({ reports, loading, stationName, onClose }: RouteReportsSheetProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="reports-sheet-backdrop" onClick={onClose}>
      <div className="reports-sheet" role="dialog" aria-modal="true" aria-label="Reportes de la ruta" onClick={(e) => e.stopPropagation()}>
        <div className="reports-sheet__header">
          <span className="reports-sheet__title">Reportes de la ruta</span>
          <button className="reports-sheet__close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="reports-sheet__body">
          {loading && reports.length === 0 ? (
            <p className="reports-sheet__empty">Cargando reportes...</p>
          ) : reports.length === 0 ? (
            <p className="reports-sheet__empty">Aún no hay reportes en esta ruta.</p>
          ) : (
            reports.map((r) => <ReportItem key={r.id} report={r} stationName={stationName} />)
          )}
        </div>
      </div>
    </div>
  )
}

function reportTitle(report: ReportDetail, stationName: (id: number) => string): string {
  const meta = report.metadata ?? {}
  if (report.type === 'incident') {
    const s1 = Number(meta.station1Id) || Number(report.target_id)
    const s2 = Number(meta.station2Id)
    return `Incidente · ${stationName(s1)}${s2 > 0 ? ` → ${stationName(s2)}` : ''}`
  }
  return `Estación · ${stationName(Number(report.target_id))}`
}

function ReportItem({ report, stationName }: { report: ReportDetail; stationName: (id: number) => string }) {
  const severity = report.severity ?? 'ok'

  return (
    <div className="report-item">
      <span className={`report-item__icon report-item__icon--${severity}`}>
        <AlertTriangle size={15} strokeWidth={2.5} />
      </span>
      <div className="report-item__content">
        <span className="report-item__title">{reportTitle(report, stationName)}</span>
        {report.description?.trim() ? (
          <p className="report-item__desc">{report.description.trim()}</p>
        ) : null}
        <span className="report-item__time">{formatTime(report.created_at)}</span>
      </div>
    </div>
  )
}
