import { useState, type CSSProperties } from 'react'
import { useApp, useSchedule } from '../../app/providers/AppProvider'
import { navigate } from '../../app/router'
import { EmptyState, PageHeader, PrimaryButton } from '../../components/ui/Feedback'
import { LessonCard } from '../../components/ui/LessonCard'
import { LessonSheet } from '../../components/ui/LessonSheet'
import { useMediaQuery } from '../../hooks/usePlatform'
import { useNow } from '../../hooks/useNow'
import { DAY_LONG, DAY_SHORT, TYPE_KEY, typeVar } from '../../lib/labels'
import { freeGaps, lessonStatus, lessonsForDay, weekOrder } from '../../lib/schedule'
import { dayIdOf, formatDuration } from '../../lib/time'
import type { DayId, ResolvedLesson } from '../../types/schedule'

export default function WeekScreen() {
  const { t, group, groupLessons, prefs } = useApp()
  const data = useSchedule()
  const now = useNow('minute')
  const wide = useMediaQuery('(min-width: 1024px)')
  const today = dayIdOf(now)
  const days = weekOrder(prefs.weekStart).filter((d) => d !== 'sun' || prefs.weekStart === 'sun')
  const [picked, setPicked] = useState<DayId | null>(null)
  const [open, setOpen] = useState<ResolvedLesson | null>(null)
  const selected: DayId = picked && days.includes(picked) ? picked : days.includes(today) ? today : (days[0] as DayId)

  if (!group) {
    return (
      <>
        <PageHeader title={t('weekTitle')} />
        <EmptyState title={t('pickGroupTitle')} text={t('pickGroupText')} action={<PrimaryButton onClick={() => navigate('groups')}>{t('pickGroupAction')}</PrimaryButton>} />
      </>
    )
  }

  const count = (d: DayId) => groupLessons.filter((l) => l.day === d).length
  const header = (
    <PageHeader
      title={t('weekTitle')}
      aside={<button type="button" onClick={() => navigate('groups')} className="num min-h-11 rounded-md border border-line bg-surface px-3 text-sm font-semibold">{group.name}</button>}
    />
  )
  const sheet = <LessonSheet lesson={open} groupName={group.name} t={t} onClose={() => setOpen(null)} />

  if (wide) {
    const rows = data.meta.slots
    return (
      <>
        {header}
        <div className="px-8 pb-8">
          <div
            role="grid"
            aria-label={t('weekTitle')}
            className="grid gap-px overflow-hidden rounded-md border border-line bg-line"
            style={{ gridTemplateColumns: `4.5rem repeat(${days.length}, minmax(0, 1fr))`, gridTemplateRows: `auto repeat(${rows.length}, minmax(4.75rem, auto))` }}
          >
            <div className="bg-surface" />
            {days.map((d, i) => (
              <div key={d} role="columnheader" style={{ gridColumn: i + 2, gridRow: 1 }} className={`bg-surface px-2 py-2.5 text-center text-sm font-semibold ${d === today ? 'text-accent' : ''}`}>
                {DAY_LONG[d]}
              </div>
            ))}
            {rows.map((s) => (
              <div key={s.n} style={{ gridColumn: 1, gridRow: s.n + 1 }} className="num bg-surface px-2 py-2 text-xs leading-tight text-ink-2">
                <span className="block text-sm font-semibold text-ink">{s.n}</span>{s.start}<br />{s.end}
              </div>
            ))}
            {days.flatMap((d, i) =>
              rows.map((s) => (
                <div key={`${d}${s.n}`} style={{ gridColumn: i + 2, gridRow: s.n + 1 }} className={d === today ? 'bg-surface-2/60' : 'bg-surface'} />
              )),
            )}
            {groupLessons.filter((l) => days.includes(l.day)).map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setOpen(l)}
                aria-label={`${DAY_LONG[l.day]} ${l.start}–${l.end}: ${l.subject}, ${t(TYPE_KEY[l.type])}${l.room ? `, ${l.room}` : ''}`}
                style={{ '--t': typeVar(l.type), gridColumn: days.indexOf(l.day) + 2, gridRow: `${l.slotStart + 1} / ${l.slotEnd + 2}` } as CSSProperties}
                className="type-tint m-0.5 flex min-w-0 flex-col gap-0.5 overflow-hidden rounded-sm border-l-[3px] border-l-[var(--t)] p-2 text-left text-xs leading-snug hover:brightness-95"
              >
                <span className="line-clamp-3 break-words font-semibold">{l.subject}</span>
                <span className="text-ink-2">{t(TYPE_KEY[l.type])}{l.room ? ` · ${l.room}` : ''}</span>
              </button>
            ))}
          </div>
        </div>
        {sheet}
      </>
    )
  }

  const dayLessons = lessonsForDay(groupLessons, selected)
  const gaps = new Map(freeGaps(dayLessons).filter((g) => g.minutes >= 30).map((g) => [g.afterId, g.minutes]))
  return (
    <>
      {header}
      <div role="tablist" aria-label={t('weekTitle')} className="sticky top-0 z-10 flex gap-1 overflow-x-auto bg-bg px-4 pb-2 pt-1">
        {days.map((d) => (
          <button
            key={d}
            type="button"
            role="tab"
            id={`tab-${d}`}
            aria-selected={d === selected}
            aria-controls="day-panel"
            onClick={() => setPicked(d)}
            className={`relative min-h-11 min-w-12 flex-1 rounded-md px-2 text-sm font-semibold transition-colors ${
              d === selected ? 'bg-accent text-accent-ink' : 'bg-surface text-ink-2 hover:text-ink'
            }`}
          >
            {DAY_SHORT[d]}
            {d === today && <span aria-hidden className={`absolute left-1/2 top-1 size-1 -translate-x-1/2 rounded-full ${d === selected ? 'bg-accent-ink' : 'bg-accent'}`} />}
            <span className="sr-only">{`, ${t('lessonsCount', { n: count(d) })}`}</span>
          </button>
        ))}
      </div>
      <div id="day-panel" role="tabpanel" aria-labelledby={`tab-${selected}`} className="flex flex-col gap-2 px-4 pb-8 pt-2">
        {dayLessons.length === 0 ? (
          <p className="py-8 text-ink-2">{t('emptyDay')}</p>
        ) : (
          dayLessons.map((l) => (
            <div key={l.id} className="flex flex-col gap-2">
              <LessonCard lesson={l} t={t} onOpen={setOpen} status={selected === today ? lessonStatus(l, now) : undefined} />
              {gaps.has(l.id) && <p className="num px-1 text-center text-xs text-ink-2">{t('freeWindow', { time: formatDuration((gaps.get(l.id) ?? 0) * 60) })}</p>}
            </div>
          ))
        )}
      </div>
      {sheet}
    </>
  )
}
