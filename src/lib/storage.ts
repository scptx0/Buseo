const USER_KEY = 'buseo:user-name'
const ACTIVE_ROUTE_KEY = 'buseo:active-route'
const ROUTE_HISTORY_KEY = 'buseo:route-history'

export interface StoredRoute {
  from: string
  to: string
  routeId: string
}

export function getUserName(): string {
  return localStorage.getItem(USER_KEY) ?? 'visitante'
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