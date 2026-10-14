export type ThemePref = 'light' | 'dark' | 'system'
export type WeekStart = 'mon' | 'sun'

export interface Prefs {
  theme: ThemePref
  locale: string
  weekStart: WeekStart
  groupId: string | null
  favorites: string[]
  recent: string[]
  notifications: boolean
}

export const PREFS_KEY = 'tt.prefs.v1'
export const DEFAULT_PREFS: Prefs = {
  theme: 'system',
  locale: 'ru',
  weekStart: 'mon',
  groupId: null,
  favorites: [],
  recent: [],
  notifications: false,
}

type KV = Pick<Storage, 'getItem' | 'setItem'>

const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])

/** Reads preferences defensively: corrupt or unavailable storage yields defaults. */
export function loadPrefs(storage: KV | null = safeStorage()): Prefs {
  if (!storage) return { ...DEFAULT_PREFS }
  try {
    const raw = storage.getItem(PREFS_KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    const p = JSON.parse(raw) as Partial<Record<keyof Prefs, unknown>>
    return {
      theme: p.theme === 'light' || p.theme === 'dark' || p.theme === 'system' ? p.theme : DEFAULT_PREFS.theme,
      locale: typeof p.locale === 'string' ? p.locale : DEFAULT_PREFS.locale,
      weekStart: p.weekStart === 'sun' ? 'sun' : 'mon',
      groupId: typeof p.groupId === 'string' ? p.groupId : null,
      favorites: strArr(p.favorites),
      recent: strArr(p.recent).slice(0, 5),
      notifications: p.notifications === true,
    }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function savePrefs(prefs: Prefs, storage: KV | null = safeStorage()): void {
  try {
    storage?.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    /* storage full or blocked: preferences simply won't persist */
  }
}

export function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function pushRecent(recent: string[], id: string): string[] {
  return [id, ...recent.filter((r) => r !== id)].slice(0, 5)
}

export function toggleFavorite(favs: string[], id: string): string[] {
  return favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id]
}

export function resolveTheme(pref: ThemePref, systemDark: boolean): 'light' | 'dark' {
  return pref === 'system' ? (systemDark ? 'dark' : 'light') : pref
}
