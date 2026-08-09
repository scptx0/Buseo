import { useState, useRef, useEffect } from 'react'

const REACTIONS = [
  { type: 'like', emoji: '👍' },
  { type: 'dislike', emoji: '👎' },
  { type: 'wow', emoji: '😲' },
  { type: 'sad', emoji: '😢' },
  { type: 'angry', emoji: '😡' },
  { type: 'love', emoji: '❤️' },
]

interface Props {
  onSelect: (type: string) => void
  onClose: () => void
}

export function ReactionPicker({ onSelect, onClose }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="reaction-picker" ref={ref}>
      {REACTIONS.map((r) => (
        <button
          key={r.type}
          className={`reaction-picker__btn ${hovered === r.type ? 'reaction-picker__btn--hover' : ''}`}
          onPointerEnter={() => setHovered(r.type)}
          onPointerLeave={() => setHovered(null)}
          onPointerUp={() => { onSelect(r.type); onClose() }}
        >
          <span className="reaction-picker__emoji">{r.emoji}</span>
        </button>
      ))}
    </div>
  )
}
