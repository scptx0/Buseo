import { useEffect, useState, useCallback, useMemo } from 'react'
import { useChannel } from '@portalsdk/react'
import { SlidersHorizontal, X } from 'lucide-react'
import { getFeedPosts, togglePostReaction, getUserUUID, fetchStations, type FeedPost } from '../../lib/supabase/api'
import { supabase } from '../../lib/supabase/client'
import { PostCard } from './PostCard'
import { CommentSheet } from './CommentSheet'

interface PortalPost {
  title: string
  content: string
  tags?: string[]
  created_at?: string
}

const TYPE_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'delay', label: 'Demora' },
  { value: 'incident', label: 'Incidente' },
  { value: 'closure', label: 'Cierre' },
] as const

type TypeFilter = (typeof TYPE_FILTERS)[number]['value']

function formatStationName(raw: string): string {
  const cleaned = raw.toLowerCase().replace(/-/g, ' ')
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

export function CanalPage() {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [stations, setStations] = useState<Array<{ id: number; name: string }>>([])
  const [reactions, setReactions] = useState<Record<string, Record<string, number>>>({})
  const [commentPostId, setCommentPostId] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterType, setFilterType] = useState<TypeFilter>('all')
  const [filterStation, setFilterStation] = useState<number | ''>('')

  useEffect(() => {
    fetchStations()
      .then((s) => setStations(s.map((st) => ({ id: st.id, name: formatStationName(st.name) }))))
      .catch(console.error)
  }, [])

  const stationNameMap = useMemo(() => {
    const map = new Map<number, string>()
    for (const s of stations) map.set(s.id, s.name)
    return map
  }, [stations])

  const { messages, status } = useChannel<PortalPost>({
    channelId: 'canal:global:feed',
    history: 0,
  })

  useEffect(() => {
    if (status !== 'ready' || messages.length === 0) return
    const fresh = messages
      .filter((m) => !m.ephemeral)
      .map((m) => ({
        id: m.id,
        title: m.content.title,
        content: m.content.content,
        tags: m.content.tags ?? [],
        report_type: null,
        station1_id: null,
        station2_id: null,
        created_at: m.content.created_at ?? new Date().toISOString(),
      }))
    if (fresh.length > 0) {
      setPosts((prev) => {
        const ids = new Set(prev.map((p) => p.id))
        return [...fresh.filter((p) => !ids.has(p.id)), ...prev]
      })
    }
  }, [messages, status])

  const loadPosts = useCallback(() => {
    getFeedPosts().then((data) => {
      setPosts((prev) => {
        const ids = new Set(data.map((p) => p.id))
        const kept = prev.filter((p) => !ids.has(p.id))
        return [...data, ...kept]
      })
    }).catch(console.error)
  }, [])

  useEffect(() => {
    loadPosts()
    const interval = setInterval(() => {
      supabase.functions.invoke('generate-feed', { method: 'POST', body: {} }).catch(() => {})
      loadPosts()
    }, 30 * 1000)
    return () => clearInterval(interval)
  }, [loadPosts])

  const handleReact = useCallback(async (postId: string, type: string) => {
    const counts = await togglePostReaction(postId, getUserUUID(), type)
    setReactions((prev) => ({ ...prev, [postId]: counts }))
  }, [])

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (filterType !== 'all' && p.report_type !== filterType) return false
      if (filterStation !== '') {
        const sid = filterStation
        if (p.station1_id !== sid && p.station2_id !== sid) return false
      }
      return true
    })
  }, [posts, filterType, filterStation])

  const filterActive = filterType !== 'all' || filterStation !== ''

  const displayTag = (tag: string) => {
    const num = Number(tag)
    return Number.isInteger(num) && stationNameMap.has(num) ? stationNameMap.get(num)! : tag
  }

  const locationLabel = (post: FeedPost): string | undefined => {
    // En los posts de bus el target es una línea, no una estación
    if (post.report_type === 'bus') return undefined
    const s1 = post.station1_id != null ? stationNameMap.get(post.station1_id) : undefined
    const s2 = post.station2_id != null ? stationNameMap.get(post.station2_id) : undefined
    if (post.station2_id != null && s1 && s2) return `Tramo · ${s1} → ${s2}`
    if (s1) return `Estación · ${s1}`
    return undefined
  }

  const clearFilters = () => {
    setFilterType('all')
    setFilterStation('')
  }

  return (
    <>
      <div className="stack">
        <h1 className="screen-title text-center">Canal</h1>
        <p className="screen-caption text-center">Avisos generados automaticamente desde los reportes de la comunidad.</p>

        <div className="canal-toolbar">
          <button
            type="button"
            className={`canal-filter-btn ${filterActive ? 'canal-filter-btn--active' : ''}`}
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <SlidersHorizontal size={16} />
            Filtrar
            {filterActive && <span className="canal-filter-btn__dot" />}
          </button>
          {filterActive && (
            <span className="canal-filter-count">
              {filtered.length} de {posts.length}
            </span>
          )}
        </div>

        {filterOpen && (
          <div className="canal-filter-panel card">
            <div className="canal-filter-panel__head">
              <span className="field__label">Filtros</span>
              <button className="canal-filter-panel__close" onClick={() => setFilterOpen(false)} aria-label="Cerrar filtros">
                <X size={18} />
              </button>
            </div>

            <div className="field">
              <span className="field__label">Tipo de incidente</span>
              <div className="canal-filter-chips">
                {TYPE_FILTERS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className={`canal-chip ${filterType === t.value ? 'canal-chip--active' : ''}`}
                    onClick={() => setFilterType(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="canal-station">
                Estación o tramo
              </label>
              <select
                id="canal-station"
                className="select"
                value={filterStation}
                onChange={(e) => setFilterStation(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">Todas las estaciones</option>
                {[...stations]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
              <span className="field__hint">Muestra los avisos de esa estación o del tramo que la une con otra.</span>
            </div>

            {filterActive && (
              <button type="button" className="btn btn--ghost" onClick={clearFilters}>
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="empty">
            <p>Aun no hay reportes en el canal. Cuando la IA detecte patrones en los reportes, apareceran aqui.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <p>No hay avisos que coincidan con estos filtros.</p>
            <button type="button" className="btn btn--ghost" onClick={clearFilters}>
              Limpiar filtros
            </button>
          </div>
        ) : (
          filtered.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              title={post.title}
              content={post.content}
              tags={post.tags.map((t) => (post.report_type === 'bus' ? t : displayTag(t)))}
              locationLabel={locationLabel(post)}
              created_at={post.created_at}
              reactions={reactions[post.id] ?? {}}
              onReact={handleReact}
              onComment={setCommentPostId}
            />
          ))
        )}
      </div>

      {commentPostId && (
        <CommentSheet
          postId={commentPostId}
          onClose={() => setCommentPostId(null)}
        />
      )}
    </>
  )
}
