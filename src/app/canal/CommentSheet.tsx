import { useEffect, useState, useCallback } from 'react'
import { X, Send, Flag } from 'lucide-react'
import { getPostComments, addComment, getUserUUID, moderateReport, toggleCommentLike, reportComment } from '../../lib/supabase/api'
import { formatTime } from '../../lib/format'

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
}

export function CommentSheet({ postId, onClose }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportId, setReportId] = useState<string | null>(null)
  const [reportMsg, setReportMsg] = useState('')

  const load = useCallback(() => {
    getPostComments(postId).then(setComments).catch(console.error)
  }, [postId])

  useEffect(() => {
    load()
    const interval = setInterval(load, 2000)
    return () => clearInterval(interval)
  }, [load])

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    setError(null)
    try {
      const mod = await moderateReport(text.trim())
      if (!mod.allowed) {
        setError(mod.reason || 'Tu mensaje no cumple con las politicas.')
        setSending(false)
        return
      }
      await addComment(postId, getUserUUID(), text.trim())
      setText('')
      load()
    } catch {
      setError('Error al enviar el comentario.')
    }
    setSending(false)
  }

  const handleLike = async (commentId: string) => {
    const r = await toggleCommentLike(commentId, getUserUUID())
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, likes_count: r.count } : c)),
    )
  }

  const handleReport = async () => {
    if (!reportId) return
    const r = await reportComment(reportId, getUserUUID(), reportMsg || 'Contenido inapropiado')
    setReportId(null)
    setReportMsg('')
    if (r.deleted) {
      setComments((prev) => prev.filter((c) => c.id !== reportId))
    } else {
      setError(`Reporte enviado. ${r.reports}/5 reportes necesarios para eliminar.`)
    }
  }

  return (
    <div className="comment-sheet">
      {error && (
        <div className="dialog-backdrop" onClick={() => setError(null)}>
          <div className="dialog" style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 600, color: '#000' }}>{error}</p>
            <button className="btn btn--primary" onClick={() => setError(null)}>Aceptar</button>
          </div>
        </div>
      )}

      {reportId && (
        <div className="dialog-backdrop">
          <div className="dialog" style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 10px', fontWeight: 700 }}>Reportar comentario</p>
            <textarea className="input" rows={2} value={reportMsg} onChange={(e) => setReportMsg(e.target.value)} placeholder="Razon del reporte (opcional)" style={{ resize: 'vertical', marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn--ghost" onClick={() => { setReportId(null); setReportMsg('') }}>Cancelar</button>
              <button className="btn btn--primary" onClick={handleReport}>Reportar</button>
            </div>
          </div>
        </div>
      )}

      <div className="comment-sheet__header">
        <span className="comment-sheet__title">{comments.length} comentarios</span>
        <button className="comment-sheet__close" onClick={onClose}><X size={20} /></button>
      </div>

      <div className="comment-sheet__list">
        {comments.map((c) => (
          <div key={c.id} className="comment-item" onDoubleClick={() => handleLike(c.id)}>
            <div className="comment-item__avatar">{c.user_id.substring(0, 2).toUpperCase()}</div>
            <div className="comment-item__body">
              <div className="comment-item__header">
                <span className="comment-item__user">Viajero {c.user_id.substring(0, 6)}</span>
                <span className="comment-item__time">{formatTime(c.created_at)}</span>
              </div>
              <p className="comment-item__text">{c.content}</p>
              <div className="comment-item__actions">
                <button className="comment-item__like" onClick={() => handleLike(c.id)}>
                  👍 {c.likes_count}
                </button>
                <button className="comment-item__report" onClick={() => setReportId(c.id)}>
                  <Flag size={13} />
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
