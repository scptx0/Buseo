import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Check } from 'lucide-react'

import { nearestStation, searchRoutes, stationName } from '../../lib/rutas'
import { stations } from '../../lib/mockData'
import type { PlannedRoute } from '../../lib/types'
import {
  getRouteHistory,
  pushToRouteHistory,
  saveActiveRoute,
  type StoredRoute,
} from '../../lib/storage'
import { useGeo } from '../entrada/LocationGate'
import { RouteDetail } from './RouteDetail'
import { RouteListItem } from './RouteListItem'

export function PlanearPage() {
  const { position } = useGeo()
  const navigate = useNavigate()
  const [originId, setOriginId] = useState('')
  const [destId, setDestId] = useState('')
  const [routes, setRoutes] = useState<PlannedRoute[]>([])
  const [selected, setSelected] = useState<PlannedRoute | null>(null)
  const [saved, setSaved] = useState<StoredRoute | null>(null)

  const recent = getRouteHistory()

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => navigate('/'), 2500)
      return () => clearTimeout(t)
    }
  }, [saved, navigate])

  useEffect(() => {
    if (!position || originId) return
    const nearest = nearestStation(position.lat, position.lng)
    if (nearest) setOriginId(nearest.id)
  }, [position, originId])

  function onSearch() {
    if (originId && destId && originId !== destId) {
      const result = searchRoutes(originId, destId)
      setRoutes(result)
      setSelected(null)
    }
  }

  function onRecent(r: StoredRoute) {
    setOriginId(r.from)
    setDestId(r.to)
    const result = searchRoutes(r.from, r.to)
    setRoutes(result)
    setSelected(null)
  }

  function onSelect(route: PlannedRoute) {
    setSelected(route)
  }

  function confirmSave() {
    if (!selected) return
    persist({ from: originId, to: destId, routeId: selected.id })
  }

  function persist(route: StoredRoute) {
    saveActiveRoute(route)
    pushToRouteHistory(route)
    setSaved(route)
  }

  const stationOptions = (excludeId: string) =>
    stations.map((s) => (
      <option key={s.id} value={s.id} disabled={s.id === excludeId}>
        {s.name}
      </option>
    ))

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
          <p className="saved-screen__text">
            De <b>{stationName(saved.from)}</b> a <b>{stationName(saved.to)}</b>.
          </p>
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
        originId={originId}
        destId={destId}
        onBack={() => setSelected(null)}
        onSave={confirmSave}
      />
    )
  }

  if (routes.length > 0) {
    return (
      <div className="planear-page">
        <div className="planear-header">
          <h1 className="planear-title">Resultados</h1>
          <div className="planear-path">
            <span className="planear-path__station">{stationName(originId)}</span>
            <div className="planear-path__line">
              <span className="planear-path__dot" />
              <span className="planear-path__dot" />
              <span className="planear-path__dot" />
              <span className="planear-path__dot" />
              <span className="planear-path__dot" />
            </div>
            <span className="planear-path__station">{stationName(destId)}</span>
          </div>
          <div className="planear-selects">
            <div className="field">
              <label className="field__label" htmlFor="origin">Estación 1 (origen)</label>
              <select
                id="origin"
                className="select select--lg"
                value={originId}
                onChange={(e) => setOriginId(e.target.value)}
              >
                <option value="" disabled>Elige una estación</option>
                {stationOptions(destId)}
              </select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="dest">Estación 2 (destino)</label>
              <select
                id="dest"
                className="select select--lg"
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
              >
                <option value="" disabled>Elige una estación</option>
                {stationOptions(originId)}
              </select>
            </div>
          </div>
        </div>

        <p className="planear-bridge">Estas son tus rutas encontradas</p>

        <div className="planear-results">
          {routes.map((route) => (
            <RouteListItem key={route.id} route={route} onSelect={() => onSelect(route)} />
          ))}
        </div>

        <div className="cta-bar" style={{ position: 'static', padding: '0 0 16px', background: 'none' }}>
          <button
            className="btn btn--primary"
            disabled={!originId || !destId || originId === destId}
            onClick={onSearch}
            style={{ maxWidth: '100%' }}
          >
            Buscar rutas
          </button>
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
            onChange={(e) => setOriginId(e.target.value)}
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
            onChange={(e) => setDestId(e.target.value)}
            required
          >
            <option value="" disabled>
              Elige una estación
            </option>
            {stationOptions(originId)}
          </select>
        </div>
      </div>

      {recent.length > 0 && (
        <section className="card stack">
          <span className="field__label">Últimas rutas</span>
          {recent.map((r) => (
            <button
              key={`${r.from}-${r.to}`}
              type="button"
              className="btn btn--ghost"
              onClick={() => onRecent(r)}
            >
              {stationName(r.from)} → {stationName(r.to)}
            </button>
          ))}
        </section>
      )}

      <div className="cta-bar">
        <button
          className="btn btn--primary"
          disabled={!originId || !destId || originId === destId}
          onClick={onSearch}
        >
          Buscar rutas
        </button>
      </div>
    </div>
  )
}
