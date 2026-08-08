import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import { supabase } from '../../lib/supabase/client'
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

export function BusesPage() {
  const [lines, setLines] = useState<LineOption[]>([])
  const [lineId, setLineId] = useState<number | ''>('')
  const [direction, setDirection] = useState('')
  const [stations, setStations] = useState<StationApi[]>([])
  const [loading, setLoading] = useState(true)

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

  if (loading) return <div className="empty"><p>Cargando...</p></div>

  return (
    <div className="stack">
      <h1 className="screen-title text-center">Donde estan los buses?</h1>
      <p className="screen-caption text-center">Elegi una linea para ver su recorrido completo.</p>

      <div className="field">
        <label className="field__label" htmlFor="bus-line">Linea</label>
        <select
          id="bus-line"
          className="select"
          value={lineId}
          onChange={(e) => handleLineChange(Number(e.target.value))}
        >
          <option value="" disabled>Selecciona una linea</option>
          {lines.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      {directions.length > 0 && (
        <div className="field">
          <label className="field__label" htmlFor="bus-dir">Direccion</label>
          <select
            id="bus-dir"
            className="select"
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
          >
            <option value="" disabled>Selecciona direccion</option>
            {directions.map((d) => (
              <option key={d} value={d}>{d === 'norte' ? 'Norte' : 'Sur'}</option>
            ))}
          </select>
        </div>
      )}

      {stations.length > 0 && (
        <div className="snake-container">
          <div className="snake-header">
            <MapPin size={16} />
            <span>{stations.length} estaciones</span>
          </div>
          <RouteSnake stations={stations} />
        </div>
      )}
    </div>
  )
}
