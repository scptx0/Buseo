import type { StationApi } from '../../lib/types'
import { useEffect, useRef, useState } from 'react'
import busIcon from '../../../iconos/icono_localizar_buss.png'

interface Props {
  stations: StationApi[]
  busProgress?: number
}

const LEFT = 15
const MID = 50
const RIGHT = 85
const GAP = 26
const PAD = 20

function formatName(raw: string): string {
  const cleaned = raw.toLowerCase().replace(/-/g, ' ')
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

function xCol(i: number, total: number): number {
  if (i === 0) return LEFT
  if (i === total - 1) return RIGHT
  const m = i % 4
  if (m === 0) return LEFT
  if (m === 2) return RIGHT
  return MID
}

export function RouteSnake({ stations, busProgress }: Props) {
  const n = stations.length
  if (n === 0) return null
  const pathRef = useRef<SVGPathElement>(null)
  const [pathLen, setPathLen] = useState(0)
  const [busPos, setBusPos] = useState<{ x: number; y: number; angle: number } | null>(null)

  const h = PAD * 2 + (n - 1) * GAP
  const pts: Array<{ x: number; y: number }> = []
  for (let i = 0; i < n; i++) {
    pts.push({ x: xCol(i, n), y: PAD + i * GAP })
  }

  let d = ''
  for (let i = 0; i < n; i++) {
    const p = pts[i]
    if (i === 0) {
      d += `M ${p.x} ${p.y}`
    } else if (i === 1) {
      const prev = pts[0]
      const cy = (prev.y + p.y) / 2 + 2
      d += ` Q ${(prev.x + p.x) / 2} ${cy} ${p.x} ${p.y}`
    } else {
      d += ` T ${p.x} ${p.y}`
    }
  }

  // Measure path length once the SVG mounts
  useEffect(() => {
    if (!pathRef.current) return
    const len = pathRef.current.getTotalLength()
    setPathLen(len)
  }, [d])

  // Calculate bus position along the actual path curve
  useEffect(() => {
    if (busProgress === undefined || !pathRef.current || pathLen === 0) {
      setBusPos(null)
      return
    }
    const path = pathRef.current
    const target = busProgress * pathLen
    const pt = path.getPointAtLength(target)
    // Get direction from nearby point
    const next = path.getPointAtLength(Math.min(target + 0.5, pathLen))
    const dx = next.x - pt.x
    const dy = next.y - pt.y
    const angle = Math.atan2(dy, dx) * 180 / Math.PI
    setBusPos({ x: pt.x, y: pt.y - 1.5, angle })
  }, [busProgress, pathLen])

  return (
    <div className="snake-graph">
      <svg
        viewBox={`0 0 100 ${h}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto', minHeight: Math.max(200, h / 2) }}
      >
        <path
          ref={pathRef}
          d={d}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.55}
          vectorEffect="non-scaling-stroke"
        />
        {pts.map((p, i) => {
          const first = i === 0
          const last = i === n - 1
          const r = first || last ? 5 : 3.5
          const name = formatName(stations[i].name)
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={r} fill={first ? '#f59e0b' : last ? '#16a34a' : '#3b82f6'} stroke="#fff" strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
              <text x={p.x} y={p.y + r + 3} textAnchor="middle" fill="#000" fontSize={4} fontWeight={first || last ? 700 : 500} fontFamily="system-ui, sans-serif">{name}</text>
            </g>
          )
        })}
        {busPos && (
          <g transform={`translate(${busPos.x}, ${busPos.y}) rotate(${busPos.angle})`}>
            <image href={busIcon} x={-19.5} y={-16.5} width={39} height={33} />
          </g>
        )}
      </svg>
    </div>
  )
}
