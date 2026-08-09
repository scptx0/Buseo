import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bus, ArrowLeftRight, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase/client'
import { fetchStations, getActiveRoute, finishTrip, getUserUUID } from '../../lib/supabase/api'
import type { RouteApi, StationApi } from '../../lib/types'
import { RouteGraphView, LINE_COLORS } from '../planear/RouteGraphView'
import { lineName } from '../../lib/rutas'
import { useUserProgress } from '../../hooks/useUserProgress'

interface AlertItem {
  stationId: number
  severity: string
  count: number
}

export function RutaActualPage() {
  const navigate = useNavigate()
  const [route, setRoute] = useState<RouteApi | null>(null)
  const [stations, setStations] = useState<StationApi[]>([])
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [showAlerts, setShowAlerts] = useState(false)

  const userProgress = useUserProgress(route, stations)

  useEffect(() => {
    const uuid = getUserUUID()
    Promise.all([getActiveRoute(uuid), fetchStations()])
      .then(([r, s]) => {
        setRoute(r)
        setStations(s)
        if (r) {
          const ids = [...new Set(r.steps.flatMap(step => step.nodes.map(n => n.stationId)))]
          supabase
            .from('reports')
            .select('target_id, severity')
            .in('target_id', ids.map(String))
            .order('created_at', { ascending: false })
            .then(({ data }) => {
              if (!data || data.length === 0) return
              const byStation = new Map<string, { severity: string; count: number }>()
              for (const r of data) {
                const existing = byStation.get(r.target_id)
                if (existing) {
                  existing.count++
                  if (r.severity === 'critical') existing.severity = 'critical'
                } else {
                  byStation.set(r.target_id, { severity: r.severity, count: 1 })
                }
              }
              const items: AlertItem[] = []
              for (const [id, val] of byStation) {
                items.push({ stationId: Number(id), severity: val.severity, count: val.count })
              }
              items.sort((a, b) => b.count - a.count)
              setAlerts(items)
            })
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const formatStationName = (raw: string) => {
    const cleaned = raw.toLowerCase().replace(/-/g, ' ')
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  }

  const stationName = (id: number) => {
    const raw = stations.find((s) => s.id === id)?.name
    return raw ? formatStationName(raw) : String(id)
  }

  async function onFinish() {
    await finishTrip(getUserUUID())
    navigate('/')
  }

  if (loading) return <div className="empty"><p>Cargando...</p></div>

  if (!route) {
    return (
      <div className="empty">
        <h2 className="screen-title">No tienes una ruta activa</h2>
        <p className="screen-caption">Planifica una ruta para empezar a seguirla en vivo.</p>
        <button className="btn btn--primary" onClick={() => navigate('/planear')}>
          Planificar ruta
        </button>
      </div>
    )
  }

  const firstStep = route.steps[0]
  const firstNode = firstStep?.nodes.find((n: { stopOrder: number }) => n.stopOrder === firstStep.fromStop) ?? firstStep?.nodes[0]
  const lastStep = route.steps[route.steps.length - 1]
  const lastNode = lastStep?.nodes[lastStep.nodes.length - 1]
  const lines = [...new Set(route.steps.map((s) => lineName(s.lineName)))]
  const alertStationIds = new Set(alerts.map(a => a.stationId))

  return (
    <div className="ruta-page">
      <div className="ruta-header">
        {alerts.length > 0 && (
          <div className="ruta-alerts">
            <button className="ruta-alerts__btn" onClick={() => setShowAlerts(!showAlerts)}>
              <AlertTriangle size={18} />
              <span>{alerts.length} {alerts.length === 1 ? 'alerta' : 'alertas'} en tu ruta</span>
            </button>
            {showAlerts && (
              <div className="ruta-alerts__dropdown">
                {alerts.map((a) => (
                  <button
                    key={a.stationId}
                    className="ruta-alerts__item"
                    onClick={() => navigate('/canal')}
                  >
                    <span className={`ruta-alerts__dot ruta-alerts__dot--${a.severity}`} />
                    <span>{stationName(a.stationId)}</span>
                    <span className="ruta-alerts__count">({a.count})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="ruta-path">
          <span className="ruta-path__station">{firstNode ? stationName(firstNode.stationId) : '?'}</span>
          <div className="ruta-path__track">
            <span className="ruta-path__dot" />
            <span className="ruta-path__dot" />
            <span className="ruta-path__dot" />
          </div>
          <span className="ruta-path__station">{lastNode ? stationName(lastNode.stationId) : '?'}</span>
        </div>

        <div className="ruta-info">
          <div className="ruta-info__lines">
            {route.steps.map((s, i) => {
              const color = LINE_COLORS[s.lineId] || '#888'
              return (
                <span key={i} className="ruta-info__pill" style={{ background: color + '22', color: color }}>
                  {lineName(s.lineName)}
                </span>
              )
            })}
          </div>
        </div>

        <div className="ruta-stats">
          <div className="ruta-stats__item">
            <Bus size={20} strokeWidth={2} />
            <span>{lines.length} {lines.length === 1 ? 'linea' : 'lineas'}</span>
          </div>
          <div className="ruta-stats__item">
            <ArrowLeftRight size={20} strokeWidth={2} />
            <span>{route.transfers === 0 ? 'Directo' : route.transfers + ' trasbordo'}</span>
          </div>
        </div>
      </div>

      <div className="ruta-graph">
        <RouteGraphView
          route={route}
          alertStationIds={alertStationIds}
          userProgress={userProgress.smooth}
        />
      </div>

      <div className="cta-bar">
        <button className="btn btn--primary" onClick={onFinish}>
          Finalizar ruta
        </button>
      </div>
    </div>
  )
}
