import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Check } from 'lucide-react'

import { nearestStation, searchRoutes, stationName } from '../../lib/rutas'
import { stations } from '../../lib/mockData'
import type { PlannedRoute } from '../../lib/types'
import {
  getActiveRoute,
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
  const [pending, setPending] = useState<StoredRoute | null>(null)
  const [saved, setSaved] = useState<StoredRoute | null>(null)
  const [confirmSwap, setConfirmSwap] = useState(false)

  const recent = getRouteHistory()

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
    const next = { from: originId, to: destId, routeId: selected.id }
    const active = getActiveRoute()
    if (active && !(active.from === next.from && active.to === next.to)) {
      setPending(next)
      setConfirmSwap(true)
      return
    }
    persist(next)
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
          <button type="button" className="topbar__back" onClick={() => navigate(-1)} aria-label="Cerrar">
            <X size={16} strokeWidth={2.5} />
          </button>
          <span className="route-detail__title">Ruta guardada</span>
        </header>

        <div className="saved-screen__content">
          <div className="saved-screen__icon">
            <Check size={48} strokeWidth={2.5} />
          </div>
          <h2 className="saved-screen__title">¡Ruta activa!</h2>
          <p className="saved-screen__text">
            Tu ruta de <b>{stationName(saved.from)}</b> a <b>{stationName(saved.to)}</b> quedó guardada.
          </p>
          <p className="saved-screen__hint">
            Se desactivará cuando llegues a tu destino.
          </p>
        </div>

        <div className="route-detail__footer">
          <button className="btn btn--primary btn--full" onClick={() => navigate('/ruta-actual')}>
            Ver tu ruta
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

  return (
    <div className="stack">
      <h1 className="screen-title text-center">¿A dónde vamos?</h1>
      <p className="screen-caption text-center">Elige tu origen y tu destino en el Metropolitano.</p>

      <div className="field">
        <label className="field__label" htmlFor="origin">
          Estación 1 (origen)
        </label>
        <select
          id="origin"
          className="select"
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
          className="select"
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

      {routes.length === 0 && recent.length > 0 && (
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

      {routes.length > 0 && (
        <section className="stack">
          <h2 className="screen-title text-center">Resultados</h2>
          <p className="screen-caption text-center">
            {stationName(originId)} → {stationName(destId)}
          </p>
          {routes.map((route) => (
            <RouteListItem key={route.id} route={route} onSelect={() => onSelect(route)} />
          ))}
        </section>
      )}

      {confirmSwap && pending && (
        <div className="dialog-backdrop" onClick={() => setConfirmSwap(false)}>
          <section className="dialog" role="alertdialog" aria-labelledby="swap-title">
            <h2 id="swap-title">Cambiar de ruta</h2>
            <p>
              Ya tienes una ruta activa de {stationName(pending.from)} a {stationName(pending.to)}.
              ¿La desactivamos y guardamos la nueva?
            </p>
            <div className="stack">
              <button
                className="btn btn--primary"
                onClick={() => {
                  persist(pending)
                  setConfirmSwap(false)
                }}
              >
                Sí, usar la nueva
              </button>
              <button className="btn btn--ghost" onClick={() => setConfirmSwap(false)}>
                Cancelar
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}