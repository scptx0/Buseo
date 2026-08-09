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

const USER_UUID_KEY = 'buseo:user-uuid'

export function getUserUUID(): string {
  let uuid = localStorage.getItem(USER_UUID_KEY)
  if (!uuid) {
    uuid = crypto.randomUUID()
    localStorage.setItem(USER_UUID_KEY, uuid)
  }
  return uuid
}

export function setUserUUID(uuid: string): void {
  localStorage.setItem(USER_UUID_KEY, uuid)
}

export interface AuthResult {
  ok: boolean
  message?: string
  id?: string
  username?: string
  gender?: string | null
  preferredLineId?: string | null
}

export async function loginOrRegister(username: string, gender: string): Promise<AuthResult> {
  const { data, error } = await supabase.rpc('login_or_register', {
    p_username: username,
    p_gender: gender,
  })
  if (error) throw new Error(error.message)
  const d = (data ?? {}) as Record<string, unknown>
  return {
    ok: Boolean(d.ok),
    message: d.message as string | undefined,
    id: d.id as string | undefined,
    username: d.username as string | undefined,
    gender: (d.gender as string | null) ?? null,
    preferredLineId: (d.preferred_line_id as string | null) ?? null,
  }
}

export async function submitReport(params: {
  userId: string
  type: string
  targetId: string
  severity?: string
  description?: string
  metadata?: Record<string, unknown>
}): Promise<{ id: string; success: boolean }> {
  const { data, error } = await supabase.rpc('submit_report', {
    p_user_id: params.userId,
    p_type: params.type,
    p_target_id: params.targetId,
    p_severity: params.severity ?? 'ok',
    p_description: params.description ?? '',
    p_metadata: params.metadata ?? {},
  })
  if (error) throw new Error(error.message)
  return (data as { id: string; success: boolean }) ?? { id: '', success: false }
}

export interface BusAtStation {
  lineId: number
  lineName: string
  direction: 'norte' | 'sur'
}

interface LineStop { line_id: number; direction: 'norte' | 'sur' }
interface LineRow { id: number; name: string; directions: string[] }

export async function fetchBusesAtStation(stationId: number): Promise<BusAtStation[]> {
  const { data: stops, error } = await supabase
    .from('line_stops')
    .select('line_id, direction')
    .eq('station_id', stationId)
  if (error || !stops || stops.length === 0) return []

  const deduped = new Map<string, LineStop>()
  for (const s of stops as LineStop[]) {
    deduped.set(`${s.line_id}|${s.direction}`, s)
  }

  const lineIds = [...new Set(Array.from(deduped.values()).map((d) => d.line_id))]
  const { data: lines } = await supabase
    .from('lines')
    .select('id, name, directions')
    .in('id', lineIds)
  const lineMap = new Map<number, LineRow>()
  for (const l of (lines as LineRow[]) ?? []) {
    lineMap.set(l.id, l)
  }

  const result: BusAtStation[] = []
  for (const s of deduped.values()) {
    const line = lineMap.get(s.line_id)
    if (!line) continue
    result.push({ lineId: s.line_id, lineName: line.name, direction: s.direction })
  }
  return result.sort((a, b) => a.lineName.localeCompare(b.lineName))
}

export async function inferReport(reportId: string): Promise<void> {
  await supabase.functions.invoke('infer-report', {
    method: 'POST',
    body: { reportId },
  })
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
