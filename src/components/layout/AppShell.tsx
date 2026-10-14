import { type ReactNode, useEffect, useRef } from 'react'
import { CalendarDays, Clock, Search, Settings, Users, WifiOff, type LucideIcon } from 'lucide-react'
import { useApp } from '../../app/providers/AppProvider'
import { usePwaUpdate } from '../../app/providers/pwa'
import { ROUTES, type Route } from '../../app/router'
import type { MessageKey } from '../../lib/i18n'
import { useOnline } from '../../hooks/usePlatform'

const NAV: Record<Route, { icon: LucideIcon; label: MessageKey }> = {
  today: { icon: Clock, label: 'navToday' },
  week: { icon: CalendarDays, label: 'navWeek' },
  groups: { icon: Users, label: 'navGroups' },
  search: { icon: Search, label: 'navSearch' },
  settings: { icon: Settings, label: 'navSettings' },
}

export function AppShell({ route, children }: { route: Route; children: ReactNode }) {
  const { t, group } = useApp()
  const online = useOnline()
  const { needRefresh, update, dismiss } = usePwaUpdate()
  const main = useRef<HTMLElement>(null)
  const first = useRef(true)

  // Move focus to the new screen on navigation (keyboard / screen-reader users).
  useEffect(() => {
    if (first.current) { first.current = false; return }
    main.current?.focus({ preventScroll: true })
    if (main.current) main.current.scrollTop = 0
  }, [route])

  const links = (cls: string, vertical: boolean) =>
    ROUTES.map((r) => {
      const { icon: Icon, label } = NAV[r]
      const active = r === route
      return (
        <a
          key={r}
          href={`#/${r}`}
          aria-current={active ? 'page' : undefined}
          className={`${cls} ${active ? 'text-accent' : 'text-ink-2 hover:text-ink'} ${vertical && active ? 'bg-surface-2 font-semibold' : ''}`}
        >
          <Icon aria-hidden size={vertical ? 18 : 22} strokeWidth={active ? 2.4 : 1.9} />
          <span className={vertical ? 'text-sm' : 'text-[11px] font-medium leading-none'}>{t(label)}</span>
        </a>
      )
    })

  return (
    <div className="safe-x flex h-full flex-col lg:flex-row">
      <a href="#main" onClick={(e) => { e.preventDefault(); main.current?.focus() }} className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-md focus:bg-surface focus:p-3">
        {t('navToday')}
      </a>
      <aside className="safe-top hidden w-60 shrink-0 flex-col gap-6 border-r border-line bg-surface px-3 py-6 lg:flex">
        <div className="px-3">
          <p className="text-lg font-semibold tracking-tight">{t('appName')}</p>
          {group && <p className="num text-sm text-ink-2">{group.name}</p>}
        </div>
        <nav aria-label={t('appName')} className="flex flex-col gap-0.5">{links('flex min-h-11 items-center gap-3 rounded-md px-3', true)}</nav>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {!online && (
          <div role="status" className="safe-top flex items-center gap-2 bg-surface-2 px-4 py-2 text-sm">
            <WifiOff aria-hidden size={16} />{t('offline')}
          </div>
        )}
        {needRefresh && (
          <div role="status" className="flex items-center justify-between gap-3 bg-accent px-4 py-2 text-sm text-accent-ink">
            <span>{t('updateReady')}</span>
            <span className="flex gap-1">
              <button type="button" onClick={update} className="min-h-9 rounded-sm bg-accent-ink px-3 font-semibold text-accent">{t('updateAction')}</button>
              <button type="button" onClick={dismiss} className="min-h-9 rounded-sm px-3">{t('dismiss')}</button>
            </span>
          </div>
        )}
        <main id="main" ref={main} tabIndex={-1} className="safe-top min-h-0 flex-1 overflow-y-auto outline-none">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
        <nav aria-label={t('appName')} className="safe-bottom flex border-t border-line bg-surface lg:hidden">
          {links('flex min-h-14 flex-1 flex-col items-center justify-center gap-1', false)}
        </nav>
      </div>
    </div>
  )
}
