export type Severity = 'ok' | 'warning' | 'critical'

export interface Station {
  id: string
  name: string
  lat: number
  lng: number
  polygon: [number, number][]
  lineIds: string[]
  isTransfer: boolean
}

export interface Line {
  id: string
  name: string
  type: 'regular' | 'expreso'
  stationIds: string[]
}

export interface Segment {
  from: string
  to: string
  lineId: string
  distanceMeters: number
  durationSeconds: number
  estimatedTimeMinutes: number
}

export interface RouteStep {
  fromStationId: string
  toStationId: string
  lineId: string
  lineName: string
  estimatedTimeMinutes: number
}

export interface Route {
  id: string
  originId: string
  destinationId: string
  steps: RouteStep[]
  totalTimeMinutes: number
  transfers: number
}

export interface Alert {
  id: string
  type: 'delay' | 'incident' | 'closure'
  stationId?: string
  message: string
}

export interface PlannedRoute {
  id: string
  steps: Array<{ kind: 'board'; lineId: string; from: string; to: string }>
  segments: Array<{ from: string; to: string }>
  etaMin: number
  alerts?: Alert[]
}

export interface ActiveRoute {
  id: string
  route: Route
  activatedAt: number
  status: 'active' | 'completed' | 'cancelled'
}

export interface BusPosition {
  busId: string
  lineId: string
  lat: number
  lng: number
  occupancy: number
  status: 'on_time' | 'delayed'
  etaMin: number | null
  ts: number
}

export interface StationStatus {
  stationId: string
  severity: Severity
  queue?: 'low' | 'medium' | 'high'
  occupancy?: 'low' | 'medium' | 'high'
  comment?: string
  summary: string
  ts: number
}

export interface SegmentStatus {
  from: string
  to: string
  severity: Severity
  delayMin?: number
  summary: string
  ts: number
}

export interface LineStatus {
  incidents: Array<{ from: string; to: string; severity: Severity; summary: string }>
  delays: Array<{ from: string; to: string; delayMin: number }>
  updatedAt: number
}

export interface UserLocation {
  lat: number
  lng: number
  accuracy: number
  speed: number | null
  heading: number | null
  timestamp: number
}

export interface NearestStationResult {
  station: Station
  distanceMeters: number
  isInsidePolygon: boolean
}

// ---- Tipos de Supabase (Fase 2) ----

export interface StationApi {
  id: number
  name: string
  lat: number
  lng: number
  polygon?: [number, number][]
}

export interface RouteNodeApi {
  stationId: number
  stationName: string
  stopOrder: number
  durationSeconds: number
  distanceMeters: number
}

export interface RouteStepApi {
  lineId: number
  lineName: string
  direction: string
  fromStop: number
  toStop: number
  nodes: RouteNodeApi[]
}

export interface RouteApi {
  id: string
  lineName: string
  lineId: number
  direction: string
  etaMin: number
  transfers: number
  steps: RouteStepApi[]
  alerts: Alert[]
}
