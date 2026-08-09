import type { StationApi } from '../../lib/types'
import { useMemo } from 'react'
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

  // Bus position and direction angle
  const busData = useMemo(() => {
    if (busProgress === undefined || n < 2) return null
    const segs: Array<{ len: number; sx: number; sy: number; ex: number; ey: number }> = []
    let total = 0
    for (let i = 0; i < n - 1; i++) {
      const dx = pts[i + 1].x - pts[i].x
      const dy = pts[i + 1].y - pts[i].y
      const len = Math.sqrt(dx * dx + dy * dy)
      segs.push({ len, sx: pts[i].x, sy: pts[i].y, ex: pts[i + 1].x, ey: pts[i + 1].y })
      total += len
    }
    let target = busProgress * total
    let angle = 0
    for (const seg of segs) {
      if (target <= seg.len) {
        const t = seg.len > 0 ? target / seg.len : 0
        const x = seg.sx + (seg.ex - seg.sx) * t
        const y = seg.sy + (seg.ey - seg.sy) * t
        const dx = seg.ex - seg.sx
        const dy = seg.ey - seg.sy
        angle = Math.atan2(dy, dx) * 180 / Math.PI
        // If barely moving vertically, keep last known angle
        return { x, y, angle }
      }
      target -= seg.len
    }
    const dx = pts[n - 1].x - pts[n - 2].x
    const dy = pts[n - 1].y - pts[n - 2].y
    angle = Math.atan2(dy, dx) * 180 / Math.PI
    return { x: pts[n - 1].x, y: pts[n - 1].y, angle }
  }, [busProgress, n, pts])

  return (
    <div className="snake-graph">
      <svg
        viewBox={`0 0 100 ${h}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto', minHeight: Math.max(200, h / 2) }}
      >
        <path
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
        {busData && (
          <g transform={`translate(${busData.x}, ${busData.y}) rotate(${busData.angle})`}>
            <image href={busIcon} x={-6} y={-5} width={12} height={10} />
          </g>
        )}
      </svg>
    </div>
  )
}
