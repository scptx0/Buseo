import { useMemo } from 'react'
import { lines } from '../../lib/mockData'
import { lineName, stationName } from '../../lib/rutas'
import type { PlannedRoute } from '../../lib/types'

interface RouteGraphViewProps {
  routes: PlannedRoute[]
}

interface GraphNode {
  stationId: string
  kind: 'prev' | 'origin' | 'intermediate' | 'transfer' | 'destination'
  routeIndices: number[]
  row: number
}

interface LineEdge {
  from: GraphNode
  to: GraphNode
  lineId: string
}

const LINE_COLORS: Record<string, string> = {
  'linea-a': '#ef4444',
  'linea-b': '#3b82f6',
  'linea-c': '#16a34a',
}
const FALLBACK_COLORS = ['#ef4444', '#3b82f6', '#16a34a', '#f59e0b', '#8b5cf6', '#ec4899']
let fallbackIdx = 0
function getLineColor(lineId: string): string {
  if (LINE_COLORS[lineId]) return LINE_COLORS[lineId]
  const c = FALLBACK_COLORS[fallbackIdx % FALLBACK_COLORS.length]
  fallbackIdx++
  return c
}

const ROW_H = 64
const LANE_W = 100
const LEFT_PAD = 70
const TOP_PAD = 30
const NODE_R = 14
const NODE_R_LG = 20
const NODE_R_SM = 10
const LINE_W = 3.5

function getPrevStations(lineId: string, fromId: string): string[] {
  const line = lines.find((l) => l.id === lineId)
  if (!line) return []
  const idx = line.stationIds.indexOf(fromId)
  if (idx < 1) return []
  const start = Math.max(0, idx - 2)
  return line.stationIds.slice(start, idx)
}

function getIntermediateStations(lineId: string, fromId: string, toId: string): string[] {
  const line = lines.find((l) => l.id === lineId)
  if (!line) return []
  const fi = line.stationIds.indexOf(fromId)
  const ti = line.stationIds.indexOf(toId)
  if (fi < 0 || ti < 0) return []
  const dir = fi < ti ? 1 : -1
  const result: string[] = []
  for (let i = fi + dir; dir > 0 ? i < ti : i > ti; i += dir) {
    result.push(line.stationIds[i])
  }
  return result
}

export function RouteGraphView({ routes }: RouteGraphViewProps) {
  const { nodes, edges, width, height, uniqueLines, lineColorMap } = useMemo(() => {
    fallbackIdx = 0
    const colorMap = new Map<string, string>()
    const edgeList: LineEdge[] = []

    const stationRows = new Map<string, number>()
    let nextRow = 0
    const allNodes: GraphNode[] = []

    function addNode(stationId: string, kind: GraphNode['kind'], ri: number) {
      if (!stationRows.has(stationId)) stationRows.set(stationId, nextRow++)
      const row = stationRows.get(stationId)!
      const existing = allNodes.find((n) => n.stationId === stationId && n.row === row)
      if (existing) {
        if (!existing.routeIndices.includes(ri)) existing.routeIndices.push(ri)
        return existing
      }
      const node: GraphNode = { stationId, kind, routeIndices: [ri], row }
      allNodes.push(node)
      return node
    }

    for (let ri = 0; ri < routes.length; ri++) {
      const route = routes[ri]
      for (const step of route.steps) {
        const lineId = step.lineId
        if (!colorMap.has(lineId)) {
          colorMap.set(lineId, getLineColor(lineId))
        }

        const isFirstStep = route.steps.indexOf(step) === 0
        const isLastStep = step === route.steps[route.steps.length - 1]

        if (isFirstStep) {
          const prevs = getPrevStations(step.lineId, step.from)
          let lastNode: GraphNode | null = null
          for (const pid of prevs) {
            lastNode = addNode(pid, 'prev', ri)
          }
          const originNode = addNode(step.from, 'origin', ri)
          if (lastNode) {
            edgeList.push({ from: lastNode, to: originNode, lineId })
          }
          lastNode = originNode

          const mids = getIntermediateStations(step.lineId, step.from, step.to)
          for (const mid of mids) {
            const midNode = addNode(mid, 'intermediate', ri)
            edgeList.push({ from: lastNode!, to: midNode, lineId })
            lastNode = midNode
          }

          const destNode = addNode(step.to, isLastStep ? 'destination' : 'transfer', ri)
          edgeList.push({ from: lastNode!, to: destNode, lineId })
        } else {
          const fromNode = addNode(step.from, 'transfer', ri)
          const mids = getIntermediateStations(step.lineId, step.from, step.to)
          let lastNode: GraphNode | null = null

          for (const mid of mids) {
            const midNode = addNode(mid, 'intermediate', ri)
            const prev = lastNode ?? fromNode
            edgeList.push({ from: prev, to: midNode, lineId })
            lastNode = midNode
          }

          const destNode = addNode(step.to, isLastStep ? 'destination' : 'transfer', ri)
          const prev = lastNode ?? fromNode
          edgeList.push({ from: prev, to: destNode, lineId })
        }
      }
    }

    const totalRows = stationRows.size
    const totalLanes = routes.length
    const w = LEFT_PAD + totalLanes * LANE_W + 140
    const h = TOP_PAD + (totalRows - 1) * ROW_H + 50

    const uniqueLinesArr = Array.from(colorMap.keys())

    return {
      nodes: allNodes,
      edges: edgeList,
      width: w,
      height: h,
      uniqueLines: uniqueLinesArr,
      lineColorMap: colorMap,
    }
  }, [routes])

  if (routes.length === 0) return null

  function nodeX(routeIndex: number): number {
    return LEFT_PAD + routeIndex * LANE_W
  }

  function nodeY(row: number): number {
    return TOP_PAD + row * ROW_H
  }

  function sharedX(node: GraphNode): number {
    if (node.routeIndices.length === 1) return nodeX(node.routeIndices[0])
    const xs = node.routeIndices.map((ri) => nodeX(ri))
    return (Math.min(...xs) + Math.max(...xs)) / 2
  }

  function getNodeRadius(kind: GraphNode['kind']): number {
    if (kind === 'origin' || kind === 'destination') return NODE_R_LG
    if (kind === 'prev') return NODE_R_SM
    return NODE_R
  }

  function getNodeColor(node: GraphNode): string {
    if (node.kind === 'prev') return '#aaa'
    if (node.kind === 'origin') return '#f59e0b'
    if (node.kind === 'destination') return '#16a34a'
    if (node.routeIndices.length === 1)
      return '#888'
    return '#666'
  }

  function getLabelColor(node: GraphNode): string {
    if (node.kind === 'prev') return '#bbb'
    if (node.kind === 'origin') return '#d97706'
    return '#000'
  }

  return (
    <div className="route-graph-view">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto' }}
      >
        <defs>
          {Array.from(lineColorMap.entries()).map(([lid, _color]) => (
            <filter key={`glow-${lid}`} id={`glow-${lid}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
          <filter id="glow-origin" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {edges.map((edge, i) => {
          const color = lineColorMap.get(edge.lineId) || '#999'
          const x1 = sharedX(edge.from)
          const y1 = nodeY(edge.from.row)
          const x2 = sharedX(edge.to)
          const y2 = nodeY(edge.to.row)
          const cy1 = y1 + (y2 - y1) * 0.3
          const cy2 = y2 - (y2 - y1) * 0.3
          const d = `M ${x1} ${y1} C ${x1} ${cy1}, ${x2} ${cy2}, ${x2} ${y2}`
          return (
            <path
              key={`edge-${i}`}
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={LINE_W}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.8}
            />
          )
        })}

        {nodes.map((node) => {
          const cx = sharedX(node)
          const cy = nodeY(node.row)
          const r = getNodeRadius(node.kind)
          const color = getNodeColor(node)
          const labelColor = getLabelColor(node)
          const isOrigin = node.kind === 'origin'
          const isPrev = node.kind === 'prev'
          const name = stationName(node.stationId)

          return (
            <g key={`${node.stationId}-${node.row}`}>
              {isOrigin && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r + 4}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  opacity={0.3}
                />
              )}
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={color}
                stroke="#fff"
                strokeWidth={2}
                filter={isOrigin ? 'url(#glow-origin)' : isPrev ? undefined : undefined}
              />
              <text
                x={cx + r + 8}
                y={cy + 4}
                textAnchor="start"
                fill={labelColor}
                fontSize={isPrev ? 9 : isOrigin ? 12 : 11}
                fontWeight={isOrigin ? 700 : isPrev ? 400 : 600}
                fontFamily="system-ui, sans-serif"
              >
                {name}
              </text>
            </g>
          )
        })}
      </svg>

      {uniqueLines.length > 0 && (
        <div className="route-graph-legend">
          {uniqueLines.map((lid) => (
            <div key={lid} className="route-graph-legend__item">
              <span
                className="route-graph-legend__dot"
                style={{ backgroundColor: lineColorMap.get(lid) }}
              />
              <span>{lineName(lid)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
