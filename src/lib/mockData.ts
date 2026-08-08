export interface Station {
  id: string
  name: string
  lat: number
  lng: number
  lines: string[]
}

export interface Line {
  id: string
  name: string
  stationIds: string[]
}

export interface Segment {
  from: string
  to: string
  etaMin: number
}

export type RouteStep = {
  kind: 'board'
  lineId: string
  from: string
  to: string
}

export interface Alert {
  id: string
  type: 'delay' | 'incident' | 'closure'
  message: string
  stationId?: string
}

export interface PlannedRoute {
  id: string
  steps: RouteStep[]
  etaMin: number
  segments: Array<{ from: string; to: string }>
  alerts?: Alert[]
}

export const stations: Station[] = [
  { id: 'naranjal', name: 'Naranjal', lat: -12.0527, lng: -77.055, lines: ['a', 'c', 'exp1'] },
  { id: 'izaguirre', name: 'Izaguirre', lat: -12.022, lng: -77.057, lines: ['a', 'c', 'exp1'] },
  { id: 'tomarayana', name: 'Tomarayana', lat: -12.033, lng: -77.059, lines: ['a', 'c'] },
  { id: 'mercado-central', name: 'Mercado Central', lat: -12.04, lng: -77.05, lines: ['a', 'c'] },
  { id: 'castilla', name: 'Ramón Castilla', lat: -12.049, lng: -77.044, lines: ['a', 'c', 'exp1'] },
  { id: 'jiron-de-la-union', name: 'Jirón de la Unión', lat: -12.058, lng: -77.033, lines: ['a'] },
  { id: 'estacion-central', name: 'Estación Central', lat: -12.065, lng: -77.024, lines: ['a', 'b', 'exp1', 'exp2'] },
  { id: 'la-cultura', name: 'La Cultura', lat: -12.104, lng: -77.027, lines: ['a', 'b', 'exp2'] },
  { id: 'angamos', name: 'Angamos', lat: -12.119, lng: -77.03, lines: ['a', 'b', 'exp2'] },
  { id: 'canaval-moreyra', name: 'Canaval y Moreyra', lat: -12.132, lng: -77.033, lines: ['a', 'b'] },
  { id: 'matellini', name: 'Matellini', lat: -12.148, lng: -77.021, lines: ['a', 'b', 'exp2'] },
]

const A = stations.map((s) => s.id)

export const lines: Line[] = [
  { id: 'a', name: 'Línea A', stationIds: A },
  { id: 'b', name: 'Línea B', stationIds: ['estacion-central', 'la-cultura', 'angamos', 'canaval-moreyra', 'matellini'] },
  { id: 'c', name: 'Línea C', stationIds: ['naranjal', 'izaguirre', 'tomarayana', 'mercado-central', 'castilla', 'estacion-central'] },
  { id: 'exp1', name: 'Expreso Norte', stationIds: ['naranjal', 'izaguirre', 'castilla', 'estacion-central'] },
  { id: 'exp2', name: 'Expreso Sur', stationIds: ['estacion-central', 'la-cultura', 'angamos', 'matellini'] },
]

export const segments: Segment[] = [
  { from: 'naranjal', to: 'izaguirre', etaMin: 4 },
  { from: 'izaguirre', to: 'tomarayana', etaMin: 4 },
  { from: 'tomarayana', to: 'mercado-central', etaMin: 3 },
  { from: 'mercado-central', to: 'castilla', etaMin: 3 },
  { from: 'castilla', to: 'jiron-de-la-union', etaMin: 4 },
  { from: 'jiron-de-la-union', to: 'estacion-central', etaMin: 3 },
  { from: 'estacion-central', to: 'la-cultura', etaMin: 4 },
  { from: 'la-cultura', to: 'angamos', etaMin: 3 },
  { from: 'angamos', to: 'canaval-moreyra', etaMin: 3 },
  { from: 'canaval-moreyra', to: 'matellini', etaMin: 5 },
]

export const stationById = (id: string): Station | undefined => stations.find((s) => s.id === id)

export const travelMin = (from: string, to: string): number => {
  const seg = segments.find(
    (s) => (s.from === from && s.to === to) || (s.from === to && s.to === from),
  )
  return seg?.etaMin ?? 0
}

export const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    type: 'delay',
    message: 'Demora de 10 minutos en Línea A por alta demanda',
    stationId: 'estacion-central',
  },
  {
    id: 'alert-2',
    type: 'incident',
    message: 'Incidente reportado en Angamos - Circulación reducida',
    stationId: 'angamos',
  },
  {
    id: 'alert-3',
    type: 'closure',
    message: 'Estación temporalmente cerrada por mantenimiento',
    stationId: 'la-cultura',
  },
]