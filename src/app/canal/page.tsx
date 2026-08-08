import { useEffect, useState, useCallback } from 'react'
import { useChannel } from '@portalsdk/react'
import { getFeedPosts, togglePostReaction, getUserUUID } from '../../lib/supabase/api'
import { supabase } from '../../lib/supabase/client'
import { PostCard } from './PostCard'
import { CommentSheet } from './CommentSheet'

interface FeedPost {
  id: string
  title: string
  content: string
  tags: string[]
  created_at: string
}

interface PortalPost {
  id: string
  title: string
  content: string
  tags: string[]
  created_at: string
}

export function CanalPage() {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [reactions, setReactions] = useState<Record<string, Record<string, number>>>({})
  const [commentPostId, setCommentPostId] = useState<string | null>(null)

  useChannel<PortalPost>({
    channelId: 'canal:global:posts',
    history: 0,
    onMessage: (msg) => {
      if (msg.ephemeral) return
      setPosts((prev) => [{ id: msg.id, title: msg.content.title, content: msg.content.content, tags: msg.content.tags ?? [], created_at: msg.content.created_at ?? new Date().toISOString() }, ...prev])
    },
  })

  useEffect(() => {
    getFeedPosts().then(setPosts).catch(console.error)
    // Trigger generate-feed cada 5 min
    const interval = setInterval(() => {
      supabase.functions.invoke('generate-feed', { method: 'POST', body: {} }).catch(() => {})
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const handleReact = useCallback(async (postId: string, type: string) => {
    const counts = await togglePostReaction(postId, getUserUUID(), type)
    setReactions((prev) => ({ ...prev, [postId]: counts }))
  }, [])

  if (posts.length === 0) {
    return (
      <div className="empty">
        <h2 className="screen-title">Canal</h2>
        <p>Aun no hay reportes en el canal. Cuando la IA detecte patrones en los reportes, apareceran aqui.</p>
      </div>
    )
  }

  return (
    <>
      <div className="stack">
        <h1 className="screen-title text-center">Canal</h1>
        <p className="screen-caption text-center">Avisos generados automaticamente desde los reportes de la comunidad.</p>

        {posts.map((post) => (
          <PostCard
            key={post.id}
            id={post.id}
            title={post.title}
            content={post.content}
            tags={post.tags}
            created_at={post.created_at}
            reactions={reactions[post.id] ?? {}}
            onReact={handleReact}
            onComment={setCommentPostId}
          />
        ))}
      </div>

      {commentPostId && (
        <CommentSheet
          postId={commentPostId}
          onClose={() => setCommentPostId(null)}
          onToggleLike={() => {}}
        />
      )}
    </>
  )
}
