import { useState, useRef } from 'react'
import { MessageCircle } from 'lucide-react'
import { ReactionPicker } from './ReactionPicker'
import { ReactionBar } from './ReactionBar'

interface Props {
  id: string
  title: string
  content: string
  tags?: string[]
  created_at: string
  reactions: Record<string, number>
  onReact: (postId: string, type: string) => void
  onComment: (postId: string) => void
}

export function PostCard({ id, title, content, tags, created_at, reactions, onReact, onComment }: Props) {
  const [picker, setPicker] = useState(false)
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pressStart = useRef(0)

  const onPointerDown = () => {
    pressStart.current = Date.now()
    pressTimer.current = setTimeout(() => setPicker(true), 600)
  }
  const onPointerUp = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current)
  }

  return (
    <article className="canal-post" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
      <div className="canal-post__header">
        <div className="canal-post__avatar">🤖</div>
        <div>
          <span className="canal-post__author">Asistente Buseo</span>
          <span className="canal-post__time">{formatTime(created_at)}</span>
        </div>
      </div>

      <h3 className="canal-post__title">{title}</h3>
      <p className="canal-post__content">{content}</p>

      {tags && tags.length > 0 && (
        <div className="canal-post__tags">
          {tags.map((t) => (
            <span key={t} className="canal-post__tag">{t}</span>
          ))}
        </div>
      )}

      <ReactionBar reactions={reactions} />

      <div className="canal-post__actions">
        <button className="canal-post__action" onClick={() => onComment(id)}>
          <MessageCircle size={18} /> Comentar
        </button>
      </div>

      {picker && (
        <ReactionPicker
          onSelect={(type) => onReact(id, type)}
          onClose={() => setPicker(false)}
        />
      )}
    </article>
  )
}

function formatTime(ts: string): string {
  const d = new Date(ts)
  const now = new Date()
  const min = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (min < 1) return 'Ahora'
  if (min < 60) return `Hace ${min}m`
  const h = Math.floor(min / 60)
  if (h < 24) return `Hace ${h}h`
  return d.toLocaleDateString()
}
