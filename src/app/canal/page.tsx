import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquarePlus } from 'lucide-react'

import { mockAlerts } from '../../lib/mockData'
import { stationName } from '../../lib/rutas'
import { PostCard } from './PostCard'

interface StoredReport {
  id: string
  type: 'delay' | 'incident' | 'closure'
  stationId?: string
  message: string
  author?: string
  createdAt?: number
}

interface FeedPost {
  id: string
  author: string
  timeAgo: string
  type: 'delay' | 'incident' | 'closure'
  message: string
  stationName?: string
  sortKey: number
}

const MOCK_DELAYS_MIN = [5, 15, 30, 45, 60]

export function CanalPage() {
  const navigate = useNavigate()

  const posts = useMemo<FeedPost[]>(() => {
    const stored: StoredReport[] = (() => {
      try {
        const raw = localStorage.getItem('buseo:reports')
        if (!raw) return []
        const parsed = JSON.parse(raw) as unknown
        if (!Array.isArray(parsed)) return []
        return parsed as StoredReport[]
      } catch {
        return []
      }
    })()

    const now = Date.now()

    const mockPosts: FeedPost[] = mockAlerts.map((alert, i) => {
      const minutes = MOCK_DELAYS_MIN[i] ?? (i + 1) * 5
      return {
        id: alert.id,
        author: 'Sistema',
        timeAgo: `Hace ${minutes} min`,
        type: alert.type,
        message: alert.message,
        stationName: alert.stationId ? stationName(alert.stationId) : undefined,
        sortKey: now - minutes * 60_000,
      }
    })

    const storedPosts: FeedPost[] = stored.map((r) => ({
      id: r.id,
      author: r.author ?? 'Tú',
      timeAgo: r.createdAt ? formatTimeAgo(now - r.createdAt) : 'Hace un momento',
      type: r.type,
      message: r.message,
      stationName: r.stationId ? stationName(r.stationId) : undefined,
      sortKey: r.createdAt ?? now,
    }))

    const all = [...mockPosts, ...storedPosts].sort((a, b) => b.sortKey - a.sortKey)
    return all
  }, [])

  return (
    <>
      <h1 className="screen-title">Canal</h1>
      <p className="screen-caption">Reportes en tiempo real de la comunidad.</p>

      {posts.length === 0 ? (
        <div className="empty">
          <p>Aún no hay reportes en el canal.</p>
        </div>
      ) : (
        <div className="stack">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              author={post.author}
              timeAgo={post.timeAgo}
              type={post.type}
              message={post.message}
              stationName={post.stationName}
            />
          ))}
        </div>
      )}

      <div className="cta-bar">
        <button className="btn btn--primary" onClick={() => navigate('/reporte')}>
          <MessageSquarePlus size={18} />
          Enviar reporte
        </button>
      </div>
    </>
  )
}

function formatTimeAgo(diffMs: number): string {
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'Hace un momento'
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `Hace ${hours} h`
}
