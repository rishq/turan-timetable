import { useSyncExternalStore } from 'react'

export const ROUTES = ['today', 'week', 'groups', 'search', 'settings'] as const
export type Route = (typeof ROUTES)[number]

function parse(): Route {
  const h = window.location.hash.replace(/^#\/?/, '')
  return (ROUTES as readonly string[]).includes(h) ? (h as Route) : 'today'
}

/** Hash routing: no server config needed, works offline and inside Capacitor. */
export function useRoute(): Route {
  return useSyncExternalStore(
    (cb) => { window.addEventListener('hashchange', cb); return () => window.removeEventListener('hashchange', cb) },
    parse,
    () => 'today' as Route,
  )
}

export function navigate(route: Route): void {
  window.location.hash = `#/${route}`
}
