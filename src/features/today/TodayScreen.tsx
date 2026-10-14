import { useState } from 'react'
import { useApp, useSchedule } from '../../app/providers/AppProvider'
import { navigate } from '../../app/router'
import { EmptyState, PageHeader, PrimaryButton } from '../../components/ui/Feedback'
import { LessonCard } from '../../components/ui/LessonCard'
import { LessonSheet } from '../../components/ui/LessonSheet'
import { useNow } from '../../hooks/useNow'
import { DAY_LONG, DAY_SHORT } from '../../lib/labels'
import { dayState, freeGaps, lessonStatus, lessonsForDate, nextLessonAfter } from '../../lib/schedule'
import { dayIdOf, formatCountdown, formatDuration, parseHHmm, secondsOf } from '../../lib/time'
import type { ResolvedLesson } from '../../types/schedule'
import { DayStrip } from './DayStrip'

const MIN_WINDOW_MIN = 30
const dateFmt = new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long' })

/** Ticks every second, but only this tiny component re-renders. */
function Countdown({ target }: { target: number }) {
  const now = useNow('second')
  return <span role="timer" className="num font-semibold">{formatCountdown(target - secondsOf(now))}</span>
}

export default function TodayScreen() {
  const { t, group, groupLessons } = useApp()
  const data = useSchedule()
  const now = useNow('minute')
  const [open, setOpen] = useState<ResolvedLesson | null>(null)

  if (!group) {
    return (
      <>
        <PageHeader title={t('navToday')} />
        <EmptyState title={t('pickGroupTitle')} text={t('pickGroupText')} action={<PrimaryButton onClick={() => navigate('groups')}>{t('pickGroupAction')}</PrimaryButton>} />
      </>
    )
  }

  const lessons = lessonsForDate(groupLessons, now, group.id, data.exceptions, data.resolve)
  const st = dayState(lessons, now)
  const gaps = new Map(freeGaps(lessons).filter((g) => g.minutes >= MIN_WINDOW_MIN).map((g) => [g.afterId, g.minutes]))
  const upcoming = nextLessonAfter(groupLessons, now, group.id, data.exceptions, data.resolve)
  const allDone = lessons.length > 0 && !st.current && !st.next

  const nextLine = (l: ResolvedLesson, secs: number) =>
    secs < 3600 ? (
      <>{t('startsIn', { time: '' })}<Countdown target={(parseHHmm(l.start) ?? 0) * 60} /></>
    ) : (
      t('startsIn', { time: formatDuration(secs) })
    )

  return (
    <>
      <PageHeader
        title={DAY_LONG[dayIdOf(now)]}
        aside={<button type="button" onClick={() => navigate('groups')} className="num min-h-11 rounded-md border border-line bg-surface px-3 text-sm font-semibold">{group.name}</button>}
      />
      <div className="flex flex-col gap-5 px-4 pb-8 lg:px-8">
        <p className="-mt-2 text-ink-2">{dateFmt.format(now)}</p>
        <DayStrip slots={data.meta.slots} lessons={lessons} now={now} t={t} />

        {st.current && (
          <section aria-label={t('nowLabel')} className="rounded-md border border-line bg-surface p-4 shadow-[var(--shadow)]">
            <p className="text-sm font-medium text-ink-2">{t('nowLabel')}</p>
            <p className="mt-1 text-lg font-semibold leading-snug">{st.current.subject}</p>
            <p className="num mt-1 text-ink-2">{st.current.start}–{st.current.end}{st.current.room ? ` · ${st.current.room}` : ''}</p>
            <progress
              className="mt-3 h-1.5 w-full overflow-hidden rounded-full [&::-moz-progress-bar]:bg-accent [&::-webkit-progress-bar]:bg-surface-2 [&::-webkit-progress-value]:bg-accent"
              max={((parseHHmm(st.current.end) ?? 0) - (parseHHmm(st.current.start) ?? 0)) * 60}
              value={secondsOf(now) - (parseHHmm(st.current.start) ?? 0) * 60}
              aria-label={t('endsIn', { time: formatDuration(st.secondsToEnd ?? 0) })}
            />
            <p className="mt-2 text-sm text-ink-2">{t('endsIn', { time: formatDuration(st.secondsToEnd ?? 0) })}</p>
          </section>
        )}

        {st.next && (
          <section aria-label={t('nextLabel')} className="rounded-md border border-line bg-surface p-4 shadow-[var(--shadow)]">
            <p className="text-sm font-medium text-ink-2">{t('nextLabel')}</p>
            <p className="mt-1 font-semibold leading-snug">{st.next.subject}</p>
            <p className="num mt-1 text-ink-2">{st.next.start}–{st.next.end}{st.next.room ? ` · ${st.next.room}` : ''}</p>
            <p className="mt-2 text-sm">{nextLine(st.next, st.secondsToNext ?? 0)}</p>
          </section>
        )}

        {lessons.length === 0 && (
          <section className="rounded-md border border-line bg-surface p-4">
            <p className="font-semibold">{t('noLessonsToday')}</p>
            <p className="mt-1 text-sm text-ink-2">{t('noLessonsHint')}</p>
          </section>
        )}

        {(allDone || lessons.length === 0) && (
          <p className="text-sm text-ink-2">
            {upcoming
              ? t('nextOnDay', {
                  day: upcoming.daysAhead === 1 ? t('tomorrow') : DAY_SHORT[upcoming.lesson.day],
                  time: `${upcoming.lesson.start} — ${upcoming.lesson.subject}`,
                })
              : t('noUpcoming')}
          </p>
        )}

        {lessons.length > 0 && (
          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {lessons.map((l) => (
              <li key={l.id} className="flex flex-col gap-2">
                <LessonCard lesson={l} t={t} onOpen={setOpen} status={lessonStatus(l, now)} />
                {gaps.has(l.id) && (
                  <p className="num px-1 text-center text-xs text-ink-2">{t('freeWindow', { time: formatDuration((gaps.get(l.id) ?? 0) * 60) })}</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
      <LessonSheet lesson={open} groupName={group.name} t={t} onClose={() => setOpen(null)} />
    </>
  )
}
