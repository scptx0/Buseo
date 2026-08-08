import { travelMin, mockAlerts } from '../../lib/mockData'
import type { PlannedRoute } from '../../lib/types'
import { StationNode } from './StationNode'
import { SegmentLine } from './SegmentLine'

interface RouteGraphProps {
  route: PlannedRoute
}

function getSegmentStatus(from: string, to: string): 'ok' | 'alert' | 'critical' {
  const relevant = mockAlerts.filter(
    (a) => a.stationId === from || a.stationId === to,
  )
  if (relevant.some((a) => a.type === 'closure')) return 'critical'
  if (relevant.some((a) => a.type === 'incident')) return 'critical'
  if (relevant.some((a) => a.type === 'delay')) return 'alert'
  return 'ok'
}

export function RouteGraph({ route }: RouteGraphProps) {
  return (
    <div className="route-graph">
      {route.steps.map((step, index) => {
        const isFirst = index === 0
        const kind: 'start' | 'transfer' | 'normal' = isFirst
          ? 'start'
          : 'transfer'

        const minutes = travelMin(step.from, step.to)
        const status = getSegmentStatus(step.from, step.to)

        return (
          <div key={`${step.from}-${step.to}-${index}`}>
            <StationNode
              stationId={step.from}
              kind={kind}
              lineId={step.lineId}
            />
            <SegmentLine minutes={minutes} status={status} />
          </div>
        )
      })}
      <StationNode
        stationId={route.steps[route.steps.length - 1].to}
        kind="end"
      />
    </div>
  )
}
