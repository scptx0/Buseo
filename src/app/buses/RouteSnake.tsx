import { useMemo } from 'react'
import type { StationApi } from '../../lib/types'

interface Props {
  stations: StationApi[]
}

const NODE_R = 8
const LEFT_X = 60
const RIGHT_X = 280
const ROW_H = 36
const TOP_PAD = 20
const RIGHT_PAD = 40

export function RouteSnake({ stations }: Props) {
  const { width, height, nodes } = useMemo(() => {
    const n = stations.length
    const h = TOP_PAD + (n - 1) * ROW_H + 30
    const w = RIGHT_X + RIGHT_PAD

    const result = stations.map((s, i) => {
      const even = i % 2 === 0
      const x = even ? LEFT_X : RIGHT_X
      const y = TOP_PAD + i * ROW_H
      return { x, y, name: s.name, even, isFirst: i === 0, isLast: i === n - 1 }
    })

    return { width: w, height: h, nodes: result }
  }, [stations])

  if (stations.length === 0) return null

  // Build edges between consecutive nodes
  const edges: Array<{ x1: number; y1: number; x2: number; y2: number }> = []
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i]
    const b = nodes[i + 1]
    edges.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y })
  }

  return (
    <div className="snake-graph">
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
        {edges.map((e, i) => {
          const midY = (e.y1 + e.y2) / 2
          const d = `M ${e.x1} ${e.y1} C ${e.x1} ${midY}, ${e.x2} ${midY}, ${e.x2} ${e.y2}`
          return (
            <path key={i} d={d} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" opacity={0.5} />
          )
        })}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r={n.isFirst || n.isLast ? NODE_R + 2 : NODE_R} fill={n.isFirst ? '#f59e0b' : n.isLast ? '#16a34a' : '#3b82f6'} stroke="#fff" strokeWidth={1.5} />
            <text x={n.x + (n.even ? 14 : -14)} y={n.y + 4} textAnchor={n.even ? 'start' : 'end'} fill="#000" fontSize={10} fontWeight={600} fontFamily="system-ui, sans-serif">
              {n.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
