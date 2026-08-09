import type { StationApi } from '../../lib/types'

interface Props {
  stations: StationApi[]
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

export function RouteSnake({ stations }: Props) {
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
              <circle
                cx={p.x}
                cy={p.y}
                r={r}
                fill={first ? '#f59e0b' : last ? '#16a34a' : '#3b82f6'}
                stroke="#fff"
                strokeWidth={0.8}
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={p.x}
                y={p.y + r + 3}
                textAnchor="middle"
                fill="#000"
                fontSize={4}
                fontWeight={first || last ? 700 : 500}
                fontFamily="system-ui, sans-serif"
              >
                {name}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
