import { Clock, AlertTriangle, XCircle, MapPin } from 'lucide-react'

export interface PostCardProps {
  author: string
  timeAgo: string
  type: 'delay' | 'incident' | 'closure'
  message: string
  stationName?: string
}

const BADGE_CONFIG = {
  delay: { className: 'post-card__badge--delay', text: 'Demora', Icon: Clock },
  incident: { className: 'post-card__badge--incident', text: 'Incidente', Icon: AlertTriangle },
  closure: { className: 'post-card__badge--closure', text: 'Cierre', Icon: XCircle },
} as const

export function PostCard({ author, timeAgo, type, message, stationName }: PostCardProps) {
  const { className, text, Icon } = BADGE_CONFIG[type]
  const initial = author.charAt(0).toUpperCase()

  return (
    <article className="post-card">
      <div className="post-card__header">
        <div className="post-card__avatar" style={{ color: '#fff' }}>
          {initial}
        </div>
        <div className="post-card__meta">
          <span className="post-card__author">{author}</span>
          <span className="post-card__time">{timeAgo}</span>
        </div>
      </div>

      <span className={`post-card__badge ${className}`}>
        <Icon size={12} />
        {text}
      </span>

      <div className="post-card__body">{message}</div>

      {stationName && (
        <div className="post-card__footer">
          <MapPin size={14} />
          <span>{stationName}</span>
        </div>
      )}
    </article>
  )
}
