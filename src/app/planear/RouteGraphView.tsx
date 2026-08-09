import { useMemo, useEffect, useRef } from 'react'

import type { RouteApi, RouteNodeApi } from '../../lib/types'
import { lineName } from '../../lib/rutas'

interface RouteGraphViewProps {
  route: RouteApi
  alertStationIds?: Set<number>
  userProgress?: number
}

interface GraphPosition {
  x: number
  y: number
}

export const LINE_COLORS: Record<number, string> = {
  1: '#f43f5e', 2: '#f97316', 3: '#eab308', 4: '#84cc16',
  5: '#22c55e', 6: '#14b8a6', 7: '#06b6d4', 8: '#0ea5e9',
  9: '#3b82f6', 10: '#6366f1', 11: '#8b5cf6', 12: '#a855f7',
  13: '#d946ef', 14: '#ec4899', 15: '#e11d48', 16: '#db2777',
  17: '#ef4444', 18: '#3b82f6', 19: '#16a34a', 20: '#f59e0b',
}

const ROW_H = 64
const LEFT_PAD = 70
const TOP_PAD = 30
const NODE_R = 14
const NODE_R_LG = 20
const NODE_R_SM = 10
const LINE_W = 3.5

function getLineColor(lineId: number): string {
  return LINE_COLORS[lineId] || '#999'
}

export function RouteGraphView({ route, alertStationIds, userProgress }: RouteGraphViewProps) {
  const { nodes, edges, width, height, lineColorMap, lineNameMap } = useMemo(() => {
    const allNodes: Array<{ node: RouteNodeApi; kind: string; lineId: number; row: number }> = []
    const edgeList: Array<{ from: GraphPosition; to: GraphPosition; lineId: number }> = []
    const colorMap = new Map<number, string>()
    const nameMap = new Map<number, string>()

    let row = 0

    for (const step of route.steps) {
      const color = getLineColor(step.lineId)
      colorMap.set(step.lineId, color)
      nameMap.set(step.lineId, step.lineName)

      for (let i = 0; i < step.nodes.length; i++) {
        const n = step.nodes[i]
        const isPrev = n.stopOrder < step.fromStop
        const isOrigin = n.stopOrder === step.fromStop
        const isLast = i === step.nodes.length - 1
        const isFirstStep = step === route.steps[0]
        const isLastStep = step === route.steps[route.steps.length - 1]

        const kind = isPrev ? 'prev'
          : isOrigin && isFirstStep ? 'origin'
          : (!isFirstStep && isOrigin) || (isLast && !isLastStep) ? 'transfer'
          : isLast && isLastStep ? 'destination'
          : 'intermediate'

        allNodes.push({ node: n, kind, lineId: step.lineId, row })
        row++
      }

      if (step.nodes.length > 1) {
        const startRow = row - step.nodes.length
        for (let i = 0; i < step.nodes.length - 1; i++) {
          const from = { x: LEFT_PAD, y: TOP_PAD + (startRow + i) * ROW_H }
          const to = { x: LEFT_PAD, y: TOP_PAD + (startRow + i + 1) * ROW_H }
          edgeList.push({ from, to, lineId: step.lineId })
        }
      }
    }

    const totalRows = allNodes.length
    const w = LEFT_PAD + 200
    const h = TOP_PAD + (totalRows - 1) * ROW_H + 50

    return { nodes: allNodes, edges: edgeList, width: w, height: h, lineColorMap: colorMap, lineNameMap: nameMap }
  }, [route])

  if (route.steps.length === 0) return null

  const totalRows = nodes.length
  const hasProgress = typeof userProgress === 'number' && totalRows >= 2
  const userY = hasProgress
    ? TOP_PAD + userProgress * Math.max(0, totalRows - 1) * ROW_H
    : TOP_PAD

  const dotRef = useRef<SVGCircleElement>(null)
  const haloRef = useRef<SVGCircleElement>(null)
  useEffect(() => {
    const cy = String(userY)
    if (dotRef.current) dotRef.current.setAttribute('cy', cy)
    if (haloRef.current) haloRef.current.setAttribute('cy', cy)
  }, [userY])

  function getRadius(kind: string): number {
    if (kind === 'origin' || kind === 'destination') return NODE_R_LG
    if (kind === 'prev') return NODE_R_SM
    return NODE_R
  }

  function getNodeColor(kind: string): string {
    if (kind === 'prev') return '#aaa'
    if (kind === 'origin') return '#f59e0b'
    if (kind === 'destination') return '#16a34a'
    if (kind === 'transfer') return '#8b5cf6'
    return '#888'
  }

  function getLabelColor(kind: string): string {
    if (kind === 'prev') return '#bbb'
    if (kind === 'origin') return '#d97706'
    return '#000'
  }

  return (
    <div className="route-graph-view">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto' }}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {edges.map((edge, i) => {
          const color = lineColorMap.get(edge.lineId) || '#999'
          const cy1 = edge.from.y + (edge.to.y - edge.from.y) * 0.3
          const cy2 = edge.to.y - (edge.to.y - edge.from.y) * 0.3
          const d = `M ${edge.from.x} ${edge.from.y} C ${edge.from.x} ${cy1}, ${edge.to.x} ${cy2}, ${edge.to.x} ${edge.to.y}`
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

        {nodes.map(({ node, kind }, i) => {
          const x = LEFT_PAD
          const y = TOP_PAD + i * ROW_H
          const r = getRadius(kind)
          const color = getNodeColor(kind)
          const labelColor = getLabelColor(kind)
          const isOrigin = kind === 'origin'
          const hasAlert = alertStationIds?.has(node.stationId)

          return (
            <g key={`${node.stationId}-${i}`}>
              {isOrigin && (
                <circle cx={x} cy={y} r={r + 4} fill="none" stroke="#f59e0b" strokeWidth={1.5} opacity={0.3} />
              )}
              <circle
                cx={x}
                cy={y}
                r={r}
                fill={color}
                stroke="#fff"
                strokeWidth={2}
                filter={isOrigin ? 'url(#glow)' : undefined}
              />
              <text
                x={x + r + 8}
                y={y + 4}
                textAnchor="start"
                fill={labelColor}
                fontSize={isOrigin ? 12 : 11}
                fontWeight={isOrigin ? 700 : 600}
                fontFamily="system-ui, sans-serif"
              >
                 {node.stationName.toLowerCase().replace(/-/g, ' ').replace(/^./, (c: string) => c.toUpperCase())}{hasAlert ? ' ⚠' : ''}
              </text>
            </g>
          )
        })}

        {hasProgress && (
          <g className="user-dot">
            <circle ref={haloRef} cx={LEFT_PAD} cy={userY} r={14} fill="#a50000" opacity={0.18}>
              <animate attributeName="r" values="14;20;14" dur="1.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.18;0.04;0.18" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <circle
              ref={dotRef}
              cx={LEFT_PAD}
              cy={userY}
              r={10}
              fill="#a50000"
              stroke="#ffffff"
              strokeWidth={3}
              filter="url(#glow)"
            />
          </g>
        )}
      </svg>

      {lineColorMap.size > 0 && (
        <div className="route-graph-legend">
          {Array.from(lineColorMap.entries()).map(([lid, color]) => (
            <div key={lid} className="route-graph-legend__item">
              <span className="route-graph-legend__dot" style={{ backgroundColor: color }} />
               <span>{lineName(lineNameMap.get(lid) ?? String(lid))}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
