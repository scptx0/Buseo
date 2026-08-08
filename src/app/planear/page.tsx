import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Check, Loader2 } from 'lucide-react'

import type { StationApi, RouteApi } from '../../lib/types'
import {
  fetchStations,
  searchRoutes as apiSearchRoutes,
  startTrip,
  getUserUUID,
} from '../../lib/supabase/api'
import { getRouteHistory, pushToRouteHistory } from '../../lib/storage'
import { useGeo } from '../entrada/LocationGate'
import { RouteDetail } from './RouteDetail'
import { RouteListItem } from './RouteListItem'
import { useHeaderTitle } from '../../components/HeaderTitleContext'

export function PlanearPage() {
  const { position } = useGeo()
  const navigate = useNavigate()
  const { setTitle } = useHeaderTitle()
  const [stations, setStations] = useState<StationApi[]>([])
  const [loading, setLoading] = useState(true)
  const [originId, setOriginId] = useState<number | ''>('')
  const [destId, setDestId] = useState<number | ''>('')
  const [routes, setRoutes] = useState<RouteApi[]>([])
  const [selected, setSelected] = useState<RouteApi | null>(null)
  const [saved, setSaved] = useState(false)
  const [savedText, setSavedText] = useState('')
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    fetchStations()
      .then(setStations)
      .catch((e) => console.error('Error cargando estaciones:', e))
      .finally(() => setLoading(false))
  }, [])

  const formatName = (raw: string) => {
    const cleaned = raw.toLowerCase().replace(/-/g, ' ')
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  }

  const stationName = useCallback(
    (id: number) => {
      const raw = stations.find((s) => s.id === id)?.name
      return raw ? formatName(raw) : String(id)
    },
    [stations],
  )

  useEffect(() => {
    if (!position || originId !== '' || stations.length === 0) return
    // Buscar estación más cercana del usuario
    let nearest: StationApi | null = null
    let minDist = Infinity
    for (const s of stations) {
      const d = Math.hypot(s.lat - position.lat, s.lng - position.lng)
      if (d < minDist) {
        minDist = d
        nearest = s
      }
    }
    if (nearest && minDist < 0.02) setOriginId(nearest.id)
  }, [position, originId, stations])

  useEffect(() => {
    if (routes.length === 0) {
      setTitle(null)
      return
    }
    setTitle(`${stationName(Number(originId))} → ${stationName(Number(destId))}`)
  }, [routes.length, originId, destId, stationName, setTitle])

  useEffect(() => {
    if (routes.length === 0) return
    window.history.pushState({ planearResults: true }, '')
    const handler = () => { setRoutes([]); setSelected(null) }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [routes.length])

  async function onSearch() {
    if (originId === '' || destId === '' || originId === destId) return
    setSearching(true)
    try {
      const result = await apiSearchRoutes(originId, destId)
      setRoutes(result)
      setSelected(null)
    } catch (e) {
      console.error('Error buscando rutas:', e)
    } finally {
      setSearching(false)
    }
  }

  function onRecent(r: { from: number; to: number }) {
    setOriginId(r.from)
    setDestId(r.to)
    apiSearchRoutes(r.from, r.to).then(setRoutes).catch(console.error)
    setSelected(null)
  }

  function onSelect(route: RouteApi) {
    setSelected(route)
  }

  async function confirmSave() {
    if (!selected || originId === '' || destId === '') return
    try {
      await startTrip({
        userId: getUserUUID(),
        origin: Number(originId),
        dest: Number(destId),
        steps: selected,
      })
      pushToRouteHistory({
        from: String(originId),
        to: String(destId),
        routeId: selected.id,
      })
      setSavedText(
        `De ${stationName(Number(originId))} a ${stationName(Number(destId))}`,
      )
      setSaved(true)
    } catch (e) {
      console.error('Error iniciando viaje:', e)
    }
  }

  const recent = getRouteHistory()

  const stationOptions = (excludeId: number | '') =>
    stations.map((s) => (
      <option key={s.id} value={s.id} disabled={s.id === excludeId}>
        {formatName(s.name)}
      </option>
    ))

  if (loading) {
    return (
      <div className="planear-page planear-page--select">
        <div className="text-center" style={{ padding: 60 }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <p className="screen-caption" style={{ marginTop: 16 }}>Cargando estaciones...</p>
        </div>
      </div>
    )
  }

  if (saved) {
    return (
      <div className="saved-screen">
        <header className="route-detail__header">
          <button type="button" className="topbar__back" onClick={() => navigate('/')} aria-label="Cerrar">
            <X size={21} strokeWidth={2.5} />
          </button>
          <span className="route-detail__title">Viaje iniciado</span>
        </header>

        <div className="saved-screen__content">
          <div className="saved-screen__icon" style={{ background: 'rgba(34,197,94,0.15)', color: '#16a34a' }}>
            <Check size={56} strokeWidth={2.5} />
          </div>
          <h2 className="saved-screen__title">Tu ruta ha sido iniciada!</h2>
          <p className="saved-screen__text">{savedText}.</p>
          <p className="saved-screen__hint">
            Serás redirigido al inicio en unos segundos.
          </p>
        </div>

        <div className="route-detail__footer">
          <button className="btn btn--primary btn--full" onClick={() => navigate('/')}>
            Ir al inicio
          </button>
        </div>
      </div>
    )
  }

  if (selected) {
    return (
      <RouteDetail
        route={selected}
        originId={Number(originId)}
        destId={Number(destId)}
        stationName={stationName}
        onBack={() => setSelected(null)}
        onSave={confirmSave}
      />
    )
  }

  if (routes.length > 0) {
    return (
      <div className="planear-page">
        <div className="planear-header">
          <h1 className="screen-title">Resultados</h1>
          <p className="screen-caption text-center">Estas son tus rutas encontradas</p>
        </div>

        <div className="planear-results">
          {routes.map((route) => (
            <RouteListItem
              key={route.id}
              route={route}
              stationName={stationName}
              onSelect={() => onSelect(route)}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="planear-page planear-page--select">
      <div className="planear-header">
        <h1 className="screen-title text-center">¿A dónde vamos?</h1>
        <p className="screen-caption text-center">Elige tu origen y tu destino en el Metropolitano.</p>
      </div>

      <div className="planear-selects">
        <div className="field">
          <label className="field__label" htmlFor="origin">
            Estación 1 (origen)
          </label>
          <select
            id="origin"
            className="select select--lg"
            value={originId}
            onChange={(e) => setOriginId(Number(e.target.value))}
            required
          >
            <option value="" disabled>
              Elige una estación
            </option>
            {stationOptions(destId)}
          </select>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="dest">
            Estación 2 (destino)
          </label>
          <select
            id="dest"
            className="select select--lg"
            value={destId}
            onChange={(e) => setDestId(Number(e.target.value))}
            required
          >
            <option value="" disabled>
              Elige una estación
            </option>
            {stationOptions(originId)}
          </select>
        </div>
      </div>

      <div className="cta-bar">
        <button
          className="btn btn--primary"
          disabled={originId === '' || destId === '' || originId === destId || searching}
          onClick={onSearch}
        >
          {searching ? 'Buscando...' : 'Buscar rutas'}
        </button>
      </div>

      {recent.length > 0 && (
        <section className="card stack">
          <span className="field__label">Últimas rutas</span>
          {recent.map((r) => (
            <button
              key={`${r.from}-${r.to}`}
              type="button"
              className="btn btn--ghost"
              onClick={() => onRecent({ from: Number(r.from), to: Number(r.to) })}
            >
              {stationName(Number(r.from))} → {stationName(Number(r.to))}
            </button>
          ))}
        </section>
      )}
    </div>
  )
}
