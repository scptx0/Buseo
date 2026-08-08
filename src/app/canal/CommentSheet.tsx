import { useEffect, useState, useCallback } from 'react'
import { X, Send } from 'lucide-react'
import { getPostComments, addComment, getUserUUID } from '../../lib/supabase/api'

interface Comment {
  id: string
  user_id: string
  content: string
  likes_count: number
  created_at: string
}

interface Props {
  postId: string
  onClose: () => void
  onToggleLike: (commentId: string) => void
}

export function CommentSheet({ postId, onClose, onToggleLike }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    getPostComments(postId).then(setComments).catch(console.error)
  }, [postId])

  const handleSend = useCallback(async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await addComment(postId, getUserUUID(), text.trim())
      setText('')
    } catch { /* ignore */ }
    setSending(false)
  }, [text, postId, sending])

  return (
    <div className="comment-sheet">
      <div className="comment-sheet__header">
        <span className="comment-sheet__title">{comments.length} comentarios</span>
        <button className="comment-sheet__close" onClick={onClose}><X size={20} /></button>
      </div>

      <div className="comment-sheet__list">
        {comments.map((c) => (
          <div key={c.id} className="comment-item" onDoubleClick={() => onToggleLike(c.id)}>
            <div className="comment-item__avatar">{c.user_id.substring(0, 2).toUpperCase()}</div>
            <div className="comment-item__body">
              <div className="comment-item__header">
                <span className="comment-item__user">Viajero {c.user_id.substring(0, 6)}</span>
                <span className="comment-item__time">{formatTime(c.created_at)}</span>
              </div>
              <p className="comment-item__text">{c.content}</p>
              <div className="comment-item__actions">
                <button className="comment-item__like" onClick={() => onToggleLike(c.id)}>
                  👍 {c.likes_count}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="comment-sheet__input">
        <input
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un comentario..."
          maxLength={200}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button className="btn btn--primary" onClick={handleSend} disabled={sending || !text.trim()} style={{ width: 'auto', minWidth: 48, padding: '0 14px' }}>
          <Send size={18} />
        </button>
      </div>
    </div>
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
