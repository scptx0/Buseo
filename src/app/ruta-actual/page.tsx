import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

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

  return (
    <div className="stack">
      <div className="route-summary">
        <p className="screen-caption">
          {firstNode ? stationName(firstNode.stationId) : '?'} →{' '}
          {lastNode ? stationName(lastNode.stationId) : '?'}
        </p>
        <p className="screen-caption">
          {route.etaMin} min · {route.lineName}
        </p>
      </div>

      <RouteGraphView route={route} />

      <div className="cta-bar">
        <button className="btn btn--primary" onClick={onFinish}>
          Finalizar ruta
        </button>
      </div>
    </div>
  )
}
