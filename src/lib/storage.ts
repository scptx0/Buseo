const USER_KEY = 'buseo:user-name'
const USER_GENDER_KEY = 'buseo:user-gender'
const USER_LINE_KEY = 'buseo:user-line'
const USER_LOGGED_KEY = 'buseo:user-logged'
const ACTIVE_ROUTE_KEY = 'buseo:active-route'
const ROUTE_HISTORY_KEY = 'buseo:route-history'

export interface StoredRoute {
  from: string
  to: string
  routeId: string
}

export interface UserProfile {
  name: string
  gender: string
  preferredLineId: string
}

export function getUserName(): string {
  return localStorage.getItem(USER_KEY) ?? ''
}

export function hasUserProfile(): boolean {
  return localStorage.getItem(USER_LOGGED_KEY) === '1'
}

export function getUserProfile(): UserProfile | null {
  const name = localStorage.getItem(USER_KEY)
  const gender = localStorage.getItem(USER_GENDER_KEY)
  const preferredLineId = localStorage.getItem(USER_LINE_KEY)
  if (!name || !gender || !preferredLineId) return null
  return { name, gender, preferredLineId }
}

export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(USER_KEY, profile.name)
  localStorage.setItem(USER_GENDER_KEY, profile.gender)
  localStorage.setItem(USER_LINE_KEY, profile.preferredLineId)
  localStorage.setItem(USER_LOGGED_KEY, '1')
}

function read<T>(key: string): T | null {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function getActiveRoute(): StoredRoute | null {
  return read<StoredRoute>(ACTIVE_ROUTE_KEY)
}

export function saveActiveRoute(route: StoredRoute): void {
  localStorage.setItem(ACTIVE_ROUTE_KEY, JSON.stringify(route))
}

export function getRouteHistory(): StoredRoute[] {
  return read<StoredRoute[]>(ROUTE_HISTORY_KEY) ?? []
}

export function pushToRouteHistory(route: StoredRoute): void {
  const list = getRouteHistory().filter((r) => !(r.from === route.from && r.to === route.to))
  list.unshift(route)
  localStorage.setItem(ROUTE_HISTORY_KEY, JSON.stringify(list.slice(0, 3)))
}