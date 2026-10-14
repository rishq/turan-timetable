import type { DayId, Lesson, LessonStatus, ResolvedLesson, ScheduleException, SlotDef } from '../types/schedule'
import { DAY_IDS } from '../types/schedule'
import { addDays, dayIdOf, parseHHmm, secondsOf, toLocalISODate } from './time'

const start = (l: Pick<Lesson, 'start'>) => parseHHmm(l.start) ?? 0
const end = (l: Pick<Lesson, 'end'>) => parseHHmm(l.end) ?? 0

/** Chronological order: start, then end, then subject, then id (stable). */
export function sortLessons<T extends Lesson & { subject?: string }>(lessons: readonly T[]): T[] {
  return [...lessons].sort(
    (a, b) =>
      start(a) - start(b) ||
      end(a) - end(b) ||
      (a.subject ?? '').localeCompare(b.subject ?? '', 'ru') ||
      a.id.localeCompare(b.id),
  )
}

export function lessonsForDay<T extends Lesson>(lessons: readonly T[], day: DayId): T[] {
  return sortLessons(lessons.filter((l) => l.day === day))
}

/** Recurring lessons for a concrete date, with date-specific exceptions applied. */
export function lessonsForDate(
  weekly: readonly ResolvedLesson[],
  date: Date,
  groupId: string,
  exceptions: readonly ScheduleException[] = [],
  resolve?: (l: Lesson) => ResolvedLesson,
): ResolvedLesson[] {
  const iso = toLocalISODate(date)
  const ex = exceptions.filter((e) => e.date === iso && e.groupId === groupId)
  const cancelled = new Set(ex.filter((e) => e.kind === 'cancelled').map((e) => e.lessonId))
  const base = weekly.filter((l) => l.day === dayIdOf(date) && !cancelled.has(l.id))
  const added = resolve ? ex.flatMap((e) => (e.kind === 'added' && e.lesson ? [resolve(e.lesson)] : [])) : []
  return sortLessons([...base, ...added])
}

export function lessonStatus(l: Pick<Lesson, 'start' | 'end'>, now: Date): LessonStatus {
  const t = secondsOf(now)
  if (t >= end(l) * 60) return 'past'
  if (t >= start(l) * 60) return 'ongoing'
  return 'upcoming'
}

export interface DayState {
  current: ResolvedLesson | null
  next: ResolvedLesson | null
  /** Seconds until `current` ends / until `next` starts. */
  secondsToEnd: number | null
  secondsToNext: number | null
}

/** Current/next lesson among already-sorted lessons of the same day. */
export function dayState(sorted: readonly ResolvedLesson[], now: Date): DayState {
  const t = secondsOf(now)
  const current = sorted.find((l) => lessonStatus(l, now) === 'ongoing') ?? null
  const next = sorted.find((l) => start(l) * 60 > t) ?? null
  return {
    current,
    next,
    secondsToEnd: current ? end(current) * 60 - t : null,
    secondsToNext: next ? start(next) * 60 - t : null,
  }
}

/** Free minutes between consecutive lessons (positive gaps only). */
export function freeGaps(sorted: readonly Lesson[]): { afterId: string; minutes: number }[] {
  const gaps: { afterId: string; minutes: number }[] = []
  let latestEnd = -1
  let latestId = ''
  for (const l of sorted) {
    if (latestEnd >= 0 && start(l) > latestEnd) gaps.push({ afterId: latestId, minutes: start(l) - latestEnd })
    if (end(l) > latestEnd) { latestEnd = end(l); latestId = l.id }
  }
  return gaps
}

/** First lesson that has not started yet, looking up to 7 days ahead (incl. today). */
export function nextLessonAfter(
  weekly: readonly ResolvedLesson[],
  now: Date,
  groupId: string,
  exceptions: readonly ScheduleException[] = [],
  resolve?: (l: Lesson) => ResolvedLesson,
): { lesson: ResolvedLesson; date: Date; daysAhead: number } | null {
  const t = secondsOf(now)
  for (let i = 0; i < 8; i++) {
    const date = addDays(now, i)
    const day = lessonsForDate(weekly, date, groupId, exceptions, resolve)
    const hit = day.find((l) => i > 0 || start(l) * 60 > t)
    if (hit) return { lesson: hit, date, daysAhead: i }
  }
  return null
}

/** Days ordered for a week starting on `first`. */
export function weekOrder(first: 'mon' | 'sun'): DayId[] {
  return first === 'mon' ? [...DAY_IDS] : ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
}

/**
 * Horizontal position (0..1) of "now" across the bell-slot strip, or null outside
 * school hours. Between two slots (a break) the marker rests on the boundary.
 */
export function slotPosition(slots: readonly SlotDef[], now: Date): number | null {
  const t = secondsOf(now)
  const n = slots.length
  if (n === 0) return null
  const first = (parseHHmm(slots[0]!.start) ?? 0) * 60
  const last = (parseHHmm(slots[n - 1]!.end) ?? 0) * 60
  if (t < first || t > last) return null
  for (let i = 0; i < n; i++) {
    const s = (parseHHmm(slots[i]!.start) ?? 0) * 60
    const e = (parseHHmm(slots[i]!.end) ?? 0) * 60
    if (t >= s && t < e) return (i + (t - s) / (e - s)) / n
    const nextStart = i + 1 < n ? (parseHHmm(slots[i + 1]!.start) ?? 0) * 60 : Infinity
    if (t >= e && t < nextStart) return (i + 1) / n
  }
  return 1
}
