import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase/client'
import { lineName } from '../../lib/rutas'
import type { StationApi } from '../../lib/types'
import { RouteSnake } from './RouteSnake'

interface LineOption {
  id: number
  name: string
  directions: string[]
}

interface StationNode {
  station_id: number
  station_name: string
  stop_order: number
}

function safeLineName(name: string): string {
  try { return lineName(name) } catch { return name }
}

function formatDirection(d: string): string {
  if (d === 'norte') return 'Norte a Sur'
  if (d === 'sur') return 'Sur a Norte'
  return d.charAt(0).toUpperCase() + d.slice(1)
}

export function BusesPage() {
  const [lines, setLines] = useState<LineOption[]>([])
  const [lineId, setLineId] = useState<number | ''>('')
  const [direction, setDirection] = useState('')
  const [stations, setStations] = useState<StationApi[]>([])
  const [loading, setLoading] = useState(true)
  const [everSelected, setEverSelected] = useState(false)

  useEffect(() => {
    void supabase
      .from('lines')
      .select('id, name, directions')
      .order('name')
      .then(({ data }) => {
        if (data) setLines(data as LineOption[])
        setLoading(false)
      })
  }, [])

  const selectedLine = lines.find((l) => l.id === lineId)
  const directions = selectedLine?.directions ?? []

  useEffect(() => {
    if (lineId === '' || !direction) {
      setStations([])
      return
    }
    void supabase
      .rpc('get_line_stations', { p_line_id: lineId, p_direction: direction })
      .then(({ data }) => {
        if (data) {
          setStations(
            (data as StationNode[]).map((s) => ({
              id: s.station_id,
              name: s.station_name,
              lat: 0,
              lng: 0,
            })),
          )
        }
      })
  }, [lineId, direction])

  function handleLineChange(id: number) {
    setLineId(id)
    setDirection('')
    setStations([])
  }

  function handleDirectionChange(d: string) {
    setDirection(d)
    setEverSelected(true)
  }

  if (loading) return <div className="empty"><p>Cargando...</p></div>

  if (!everSelected) {
    return (
      <div className="planear-page planear-page--select">
        <div className="planear-header">
          <h1 className="screen-title text-center">Donde estan los buses?</h1>
          <p className="screen-caption text-center">Elegi una linea y direccion para ver su recorrido.</p>
        </div>
        <div className="planear-selects">
          <div className="field">
            <label className="field__label" htmlFor="bus-line">Linea</label>
            <select
              id="bus-line"
              className="select select--lg"
              value={lineId}
              onChange={(e) => handleLineChange(Number(e.target.value))}
            >
              <option value="" disabled>Selecciona una linea</option>
              {lines.map((l) => (
                <option key={l.id} value={l.id}>{safeLineName(l.name)}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="bus-dir">Direccion</label>
            <select
              id="bus-dir"
              className="select select--lg"
              value={direction}
              onChange={(e) => handleDirectionChange(e.target.value)}
              disabled={lineId === ''}
            >
              <option value="" disabled>Selecciona direccion</option>
              {directions.map((d) => (
                <option key={d} value={d}>{formatDirection(d)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="buses-page">
      <h1 className="screen-title text-center">Donde estan los buses?</h1>
      <p className="screen-caption text-center">{safeLineName(selectedLine?.name ?? '')} · {formatDirection(direction)}</p>

      <div className="planear-selects-compact">
        <div className="field">
          <select
            className="select"
            value={lineId}
            onChange={(e) => handleLineChange(Number(e.target.value))}
          >
            <option value="" disabled>Linea</option>
            {lines.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <select
            className="select"
            value={direction}
            onChange={(e) => handleDirectionChange(e.target.value)}
          >
            <option value="" disabled>Dir</option>
            {directions.map((d) => (
              <option key={d} value={d}>{d === 'norte' ? 'Norte' : 'Sur'}</option>
            ))}
          </select>
        </div>
      </div>

      {stations.length > 0 && (
        <div className="snake-container">
          <div className="snake-header">
            <span>{stations.length} estaciones</span>
          </div>
          <RouteSnake stations={stations} />
        </div>
      )}
    </div>
  )
}
