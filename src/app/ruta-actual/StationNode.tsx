import { stationName, lineName } from '../../lib/rutas'

interface StationNodeProps {
  stationId: string
  kind: 'start' | 'transfer' | 'end' | 'normal'
  lineId?: string
}

export function StationNode({ stationId, kind, lineId }: StationNodeProps) {
  const labelMap: Record<typeof kind, string> = {
    start: 'Origen',
    transfer: 'Transbordo',
    end: 'Destino',
    normal: '',
  }

  return (
    <div className={`station-node station-node--${kind}`}>
      <span className="station-node__name">{stationName(stationId)}</span>
      {labelMap[kind] && (
        <span className="station-node__label">{labelMap[kind]}</span>
      )}
      {lineId && (
        <span className="station-node__badge">{lineName(lineId)}</span>
      )}
    </div>
  )
}
