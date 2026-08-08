interface Props {
  reactions: Record<string, number>
}

const LABELS: Record<string, string> = { like: '👍', dislike: '👎', wow: '😲', sad: '😢', angry: '😡', love: '❤️' }

export function ReactionBar({ reactions }: Props) {
  const entries = Object.entries(reactions).filter(([, c]) => c > 0)
  if (entries.length === 0) return null

  return (
    <div className="reaction-bar">
      {entries.map(([type, count]) => (
        <span key={type} className="reaction-bar__item">
          {LABELS[type] || type} {count}
        </span>
      ))}
    </div>
  )
}
