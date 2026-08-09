import { supabase } from './client'
import type { StationApi, RouteApi } from '../types'

export async function fetchStations(): Promise<StationApi[]> {
  const { data, error } = await supabase.rpc('get_stations')
  if (error) throw new Error(error.message)
  return (data as StationApi[]) ?? []
}

export async function searchRoutes(origin: number, dest: number): Promise<RouteApi[]> {
  const { data, error } = await supabase.rpc('search_all_routes', {
    p_origin: origin, p_dest: dest,
  })
  if (error) throw new Error(error.message)
  return (data as RouteApi[]) ?? []
}

export async function startTrip(params: {
  userId: string
  origin: number
  dest: number
  steps: unknown
}): Promise<{ success: boolean; routeId: string }> {
  const { data, error } = await supabase.rpc('start_trip', {
    p_user_id: params.userId, p_origin: params.origin,
    p_dest: params.dest, p_steps: params.steps,
  })
  if (error) throw new Error(error.message)
  return (data as { success: boolean; routeId: string }) ?? { success: false, routeId: '' }
}

export async function getActiveRoute(userId: string): Promise<RouteApi | null> {
  const { data, error } = await supabase
    .from('active_routes')
    .select('steps')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  if (error || !data) return null
  return data.steps as unknown as RouteApi
}

export async function finishTrip(userId: string): Promise<void> {
  await supabase
    .from('active_routes')
    .delete()
    .eq('user_id', userId)
    .eq('status', 'active')
}

export function getUserUUID(): string {
  const key = 'buseo:user-uuid'
  let uuid = localStorage.getItem(key)
  if (!uuid) {
    uuid = crypto.randomUUID()
    localStorage.setItem(key, uuid)
  }
  return uuid
}

export async function submitReport(params: {
  userId: string
  type: string
  targetId: string
  severity: string
  description?: string
  metadata?: Record<string, unknown>
}): Promise<{ id: string; success: boolean }> {
  const { data, error } = await supabase.rpc('submit_report', {
    p_user_id: params.userId,
    p_type: params.type,
    p_target_id: params.targetId,
    p_severity: params.severity,
    p_description: params.description ?? '',
    p_metadata: params.metadata ?? {},
  })
  if (error) throw new Error(error.message)
  return (data as { id: string; success: boolean }) ?? { id: '', success: false }
}

export async function moderateReport(text: string): Promise<{ allowed: boolean; reason?: string }> {
  const { data, error } = await supabase.functions.invoke<{ allowed: boolean; reason?: string }>(
    'moderate-report',
    { method: 'POST', body: { text } },
  )
  if (error) return { allowed: true }
  return data ?? { allowed: true }
}

export async function addComment(postId: string, userId: string, content: string): Promise<unknown> {
  const { data, error } = await supabase.rpc('add_comment', {
    p_post_id: postId, p_user_id: userId, p_content: content,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function toggleCommentLike(commentId: string, userId: string): Promise<{ liked: boolean; count: number }> {
  const { data, error } = await supabase.rpc('toggle_comment_like', {
    p_comment_id: commentId, p_user_id: userId,
  })
  if (error) throw new Error(error.message)
  return (data as { liked: boolean; count: number }) ?? { liked: false, count: 0 }
}

export async function togglePostReaction(postId: string, userId: string, type: string): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc('toggle_post_reaction', {
    p_post_id: postId, p_user_id: userId, p_type: type,
  })
  if (error) throw new Error(error.message)
  return (data as Record<string, number>) ?? {}
}

export async function reportComment(commentId: string, reporterId: string, reason: string): Promise<{ deleted: boolean; reports: number }> {
  const { data, error } = await supabase.rpc('report_comment', {
    p_comment_id: commentId, p_reporter_id: reporterId, p_reason: reason,
  })
  if (error) throw new Error(error.message)
  return (data as { deleted: boolean; reports: number }) ?? { deleted: false, reports: 0 }
}

export async function getPostComments(postId: string): Promise<Array<{ id: string; user_id: string; content: string; likes_count: number; created_at: string }>> {
  const { data, error } = await supabase.rpc('get_post_comments', { p_post_id: postId })
  if (error) throw new Error(error.message)
  return (data as Array<{ id: string; user_id: string; content: string; likes_count: number; created_at: string }>) ?? []
}

export async function getFeedPosts(): Promise<Array<{ id: string; title: string; content: string; tags: string[]; created_at: string }>> {
  const { data, error } = await supabase
    .from('feed_posts')
    .select('id, title, content, tags, created_at')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw new Error(error.message)
  return (data as Array<{ id: string; title: string; content: string; tags: string[]; created_at: string }>) ?? []
}
