import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Clock, Bus, ArrowLeftRight, Route, MapPin } from 'lucide-react'

import { fetchStations, getActiveRoute, finishTrip, getUserUUID } from '../../lib/supabase/api'
import type { RouteApi, StationApi } from '../../lib/types'
import { RouteGraphView } from '../planear/RouteGraphView'

export function RutaActualPage() {
  const navigate = useNavigate()
  const [route, setRoute] = useState<RouteApi | null>(null)
  const [stations, setStations] = useState<StationApi[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const uuid = getUserUUID()
    Promise.all([getActiveRoute(uuid), fetchStations()])
      .then(([r, s]) => {
        setRoute(r)
        setStations(s)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const stationName = (id: number) => stations.find((s) => s.id === id)?.name ?? String(id)

  async function onFinish() {
    await finishTrip(getUserUUID())
    navigate('/')
  }

  if (loading) {
    return <div className="empty"><p>Cargando...</p></div>
  }

  if (!route) {
    return (
      <div className="empty">
        <h2 className="screen-title">No tienes una ruta activa</h2>
        <p className="screen-caption">
          Planifica una ruta para empezar a seguirla en vivo.
        </p>
        <button className="btn btn--primary" onClick={() => navigate('/planear')}>
          Planificar ruta
        </button>
      </div>
    )
  }

  const firstNode = route.steps[0]?.nodes[0]
  const lastStep = route.steps[route.steps.length - 1]
  const lastNode = lastStep?.nodes[lastStep.nodes.length - 1]
  const lines = [...new Set(route.steps.map((s) => s.lineName))]

  return (
    <div className="ruta-page">
      <div className="ruta-header">
        <div className="ruta-path">
          <span className="ruta-path__station">{firstNode ? stationName(firstNode.stationId) : '?'}</span>
          <div className="ruta-path__track">
            <span className="ruta-path__dot" />
            <span className="ruta-path__dot" />
            <span className="ruta-path__dot" />
            <span className="ruta-path__dot" />
            <span className="ruta-path__dot" />
          </div>
          <span className="ruta-path__station">{lastNode ? stationName(lastNode.stationId) : '?'}</span>
        </div>

        <div className="ruta-stats">
          <div className="ruta-stats__item">
            <Clock size={18} strokeWidth={2} />
            <span>{route.etaMin} min</span>
          </div>
          <div className="ruta-stats__item">
            <Bus size={18} strokeWidth={2} />
            <span>{lines.length} {lines.length === 1 ? 'linea' : 'lineas'}</span>
          </div>
          <div className="ruta-stats__item">
            <ArrowLeftRight size={18} strokeWidth={2} />
            <span>{route.transfers === 0 ? 'Directo' : route.transfers + ' transbordo'}</span>
          </div>
          <div className="ruta-stats__item">
            <Route size={18} strokeWidth={2} />
            <span>{route.direction === 'sur' ? 'Sur' : 'Norte'}</span>
          </div>
        </div>

        <div className="ruta-info">
          <div className="ruta-info__lines">
            {route.steps.map((s, i) => (
              <span key={i} className="ruta-info__pill">{s.lineName}</span>
            ))}
          </div>
          <Link to="/planear" className="ruta-modify">
            <MapPin size={14} />
            Modificar ruta
          </Link>
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
