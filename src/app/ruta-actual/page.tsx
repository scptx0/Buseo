import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Bus, ArrowLeftRight, Route, MapPin } from 'lucide-react'

import { fetchStations, getActiveRoute, finishTrip, getUserUUID, searchRoutes, startTrip } from '../../lib/supabase/api'
import type { RouteApi, StationApi } from '../../lib/types'
import { RouteGraphView, LINE_COLORS } from '../planear/RouteGraphView'
import { lineName } from '../../lib/rutas'

export function RutaActualPage() {
  const navigate = useNavigate()
  const [route, setRoute] = useState<RouteApi | null>(null)
  const [stations, setStations] = useState<StationApi[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editOrigin, setEditOrigin] = useState<number | ''>('')
  const [editDest, setEditDest] = useState<number | ''>('')

  useEffect(() => {
    const uuid = getUserUUID()
    Promise.all([getActiveRoute(uuid), fetchStations()])
      .then(([r, s]) => {
        setRoute(r)
        setStations(s)
        if (r) {
          const fn = r.steps[0]?.nodes[0]
          const ls = r.steps[r.steps.length - 1]
          const ln = ls?.nodes[ls.nodes.length - 1]
          setEditOrigin(fn?.stationId ?? '')
          setEditDest(ln?.stationId ?? '')
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

  async function onSaveEdit() {
    if (editOrigin === '' || editDest === '' || editOrigin === editDest) return
    const results = await searchRoutes(editOrigin, editDest)
    if (results.length === 0) return
    const chosen = results[0]
    const uid = getUserUUID()
    await finishTrip(uid)
    await startTrip({ userId: uid, origin: editOrigin, dest: editDest, steps: chosen })
    setRoute(chosen)
    setEditing(false)
  }

  const stationOptions = (excludeId: number | '') =>
    stations.map((s) => (
      <option key={s.id} value={s.id} disabled={s.id === excludeId}>
        {formatStationName(s.name)}
      </option>
    ))

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
  const firstNode = firstStep?.nodes.find(n => n.stopOrder === firstStep.fromStop) ?? firstStep?.nodes[0]
  const lastStep = route.steps[route.steps.length - 1]
  const lastNode = lastStep?.nodes[lastStep.nodes.length - 1]
  const lines = [...new Set(route.steps.map((s) => lineName(s.lineName)))]

  if (editing) {
    return (
      <div className="ruta-page">
        <div className="ruta-header">
          <div className="ruta-edit-form">
            <div className="field">
              <label className="field__label">Origen</label>
              <select className="select" value={editOrigin} onChange={(e) => setEditOrigin(Number(e.target.value))}>
                <option value="" disabled>Origen</option>
                {stationOptions(editDest)}
              </select>
            </div>
            <div className="field">
              <label className="field__label">Destino</label>
              <select className="select" value={editDest} onChange={(e) => setEditDest(Number(e.target.value))}>
                <option value="" disabled>Destino</option>
                {stationOptions(editOrigin)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn--ghost" onClick={() => setEditing(false)}>Cancelar</button>
              <button className="btn btn--primary" onClick={onSaveEdit} disabled={editOrigin === '' || editDest === '' || editOrigin === editDest}>Actualizar ruta</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ruta-page">
      <div className="ruta-header">
        <div className="ruta-path">
          <span className="ruta-path__station">{firstNode ? stationName(firstNode.stationId) : '?'}</span>
          <div className="ruta-path__track">
            <span className="ruta-path__dot" />
            <span className="ruta-path__dot" />
            <span className="ruta-path__dot" />
          </div>
          <span className="ruta-path__station">{lastNode ? stationName(lastNode.stationId) : '?'}</span>
        </div>

        <div className="ruta-stats">
          <div className="ruta-stats__item">
            <Clock size={20} strokeWidth={2} />
            <span>{route.etaMin} min</span>
          </div>
          <div className="ruta-stats__item">
            <Bus size={20} strokeWidth={2} />
            <span>{lines.length} {lines.length === 1 ? 'linea' : 'lineas'}</span>
          </div>
          <div className="ruta-stats__item">
            <ArrowLeftRight size={20} strokeWidth={2} />
            <span>{route.transfers === 0 ? 'Directo' : route.transfers + ' trasbordo'}</span>
          </div>
          <div className="ruta-stats__item">
            <Route size={20} strokeWidth={2} />
            <span>{route.direction === 'sur' ? 'Sur' : 'Norte'}</span>
          </div>
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
          <button className="ruta-modify" onClick={() => setEditing(true)}>
            <MapPin size={14} />
            Modificar ruta
          </button>
        </div>
      </div>

      <div className="ruta-graph">
        <RouteGraphView route={route} />
      </div>

      <div className="cta-bar">
        <button className="btn btn--primary" onClick={onFinish}>
          Finalizar ruta
        </button>
      </div>
    </div>
  )
}
