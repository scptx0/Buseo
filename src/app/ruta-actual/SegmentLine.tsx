interface SegmentLineProps {
  minutes: number
  status: 'ok' | 'alert' | 'critical'
}

export function SegmentLine({ minutes, status }: SegmentLineProps) {
  return (
    <div className={`segment-line segment-line--${status}`}>
      <span className="segment-line__badge">{minutes} min</span>
    </div>
  )
}
