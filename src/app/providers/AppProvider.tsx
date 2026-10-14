import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { loadSchedule, type Schedule } from '../../data/repositories/scheduleRepository'
import { createT, type T } from '../../lib/i18n'
import { loadPrefs, pushRecent, resolveTheme, savePrefs, toggleFavorite, type Prefs } from '../../lib/prefs'
import type { Group, ResolvedLesson } from '../../types/schedule'

export type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: Schedule }

interface AppCtx {
  prefs: Prefs
  setPrefs: (patch: Partial<Prefs>) => void
  t: T
  load: LoadState
  reload: () => void
  group: Group | null
  groupLessons: ResolvedLesson[]
  selectGroup: (id: string) => void
  toggleFav: (id: string) => void
}

const Ctx = createContext<AppCtx | null>(null)
const EMPTY: ResolvedLesson[] = []

export function AppProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<Prefs>(() => loadPrefs())
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let alive = true
    loadSchedule().then(
      (data) => alive && setLoad({ status: 'ready', data }),
      () => alive && setLoad({ status: 'error' }),
    )
    return () => { alive = false }
  }, [attempt])

  const setPrefs = useCallback((patch: Partial<Prefs>) => {
    setPrefsState((p) => {
      const next = { ...p, ...patch }
      savePrefs(next)
      return next
    })
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const th = resolveTheme(prefs.theme, mq.matches)
      document.documentElement.dataset.theme = th
      document.querySelector('meta[name=theme-color]')?.setAttribute('content', th === 'dark' ? '#101314' : '#F4F6F7')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [prefs.theme])

  const t = useMemo(() => createT(prefs.locale), [prefs.locale])
  useEffect(() => { document.documentElement.lang = prefs.locale }, [prefs.locale])

  const data = load.status === 'ready' ? load.data : null
  // A saved group that no longer exists after a schedule update simply counts as "not selected".
  const group = (data && prefs.groupId ? data.groupsById.get(prefs.groupId) : null) ?? null
  const groupLessons = (data && group ? data.lessonsByGroup.get(group.id) : null) ?? EMPTY

  const value = useMemo<AppCtx>(
    () => ({
      prefs, setPrefs, t, load, group, groupLessons,
      reload: () => { setLoad({ status: 'loading' }); setAttempt((n) => n + 1) },
      selectGroup: (id) => setPrefs({ groupId: id, recent: pushRecent(prefs.recent, id) }),
      toggleFav: (id) => setPrefs({ favorites: toggleFavorite(prefs.favorites, id) }),
    }),
    [prefs, setPrefs, t, load, group, groupLessons],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useApp outside AppProvider')
  return c
}

/** Schedule data; only valid once loading finished (AppShell guarantees this). */
export function useSchedule(): Schedule {
  const { load } = useApp()
  if (load.status !== 'ready') throw new Error('schedule not ready')
  return load.data
}
