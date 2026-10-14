import { describe, expect, it } from 'vitest'
import { slotPosition, dayState, freeGaps, lessonStatus, lessonsForDate, lessonsForDay, nextLessonAfter, sortLessons, weekOrder } from '../lib/schedule'
import { at, lesson } from './helpers'

const A = lesson({ id: 'a', start: '10:00', end: '10:50', subject: 'Б' })
const B = lesson({ id: 'b', start: '08:00', end: '09:50', subject: 'А' })
const C = lesson({ id: 'c', start: '13:10', end: '14:00', subject: 'В' })
const THU = lesson({ id: 'd', day: 'thu', start: '09:00', end: '09:50' })

describe('ordering & selection', () => {
  it('sorts chronologically with stable tie-breaks', () => {
    const x = lesson({ id: 'x', start: '08:00', end: '08:50', subject: 'Я' })
    const y = lesson({ id: 'y', start: '08:00', end: '08:50', subject: 'А' })
    expect(sortLessons([A, x, y, B]).map((l) => l.id)).toEqual(['y', 'x', 'b', 'a'])
  })
  it('selects only the requested day', () => {
    expect(lessonsForDay([A, B, THU], 'mon').map((l) => l.id)).toEqual(['b', 'a'])
    expect(lessonsForDay([A, B], 'sat')).toEqual([])
  })
})

describe('lesson status', () => {
  it('is upcoming / ongoing / past with exact boundaries', () => {
    expect(lessonStatus(A, at(2, 9, 59, 59))).toBe('upcoming')
    expect(lessonStatus(A, at(2, 10, 0, 0))).toBe('ongoing')
    expect(lessonStatus(A, at(2, 10, 49, 59))).toBe('ongoing')
    expect(lessonStatus(A, at(2, 10, 50, 0))).toBe('past')
  })
  it('treats a merged two-slot lesson as one ongoing block, incl. the break', () => {
    const merged = lesson({ id: 'm', start: '12:00', end: '14:00' })
    expect(lessonStatus(merged, at(2, 13, 0))).toBe('ongoing')
  })
})

describe('dayState / countdown', () => {
  const day = [B, A, C]
  it('before first lesson: next = first, countdown to its start', () => {
    const s = dayState(day, at(2, 7, 30))
    expect(s.current).toBeNull()
    expect(s.next?.id).toBe('b')
    expect(s.secondsToNext).toBe(30 * 60)
  })
  it('during a lesson: current set, countdown to its end, next is the following one', () => {
    const s = dayState(day, at(2, 10, 20, 30))
    expect(s.current?.id).toBe('a')
    expect(s.secondsToEnd).toBe(29 * 60 + 30)
    expect(s.next?.id).toBe('c')
  })
  it('between lessons: no current, next is upcoming', () => {
    const s = dayState(day, at(2, 11, 0))
    expect(s.current).toBeNull()
    expect(s.next?.id).toBe('c')
  })
  it('after last lesson: nothing current or next', () => {
    const s = dayState(day, at(2, 18, 0))
    expect(s.current).toBeNull()
    expect(s.next).toBeNull()
    expect(s.secondsToNext).toBeNull()
  })
  it('empty schedule is handled', () => {
    expect(dayState([], at(2, 9, 0))).toEqual({ current: null, next: null, secondsToEnd: null, secondsToNext: null })
  })
})

describe('free gaps', () => {
  it('reports positive gaps only', () => {
    expect(freeGaps([B, A, C])).toEqual([{ afterId: 'b', minutes: 10 }, { afterId: 'a', minutes: 140 }])
    const back = lesson({ id: 'e', start: '10:50', end: '11:40' })
    expect(freeGaps([A, back])).toEqual([])
  })
  it('does not report a gap inside an overlapping lesson', () => {
    const long = lesson({ id: 'l', start: '08:00', end: '12:00' })
    const inner = lesson({ id: 'i', start: '09:00', end: '09:50' })
    const after = lesson({ id: 'z', start: '12:30', end: '13:20' })
    expect(freeGaps([long, inner, after])).toEqual([{ afterId: 'l', minutes: 30 }])
  })
})

describe('next lesson & exceptions', () => {
  const all = [B, A, C, THU]
  it('finds the next lesson later today', () => {
    const n = nextLessonAfter(all, at(2, 9, 0), 'g1')
    expect(n?.lesson.id).toBe('a')
    expect(n?.daysAhead).toBe(0)
  })
  it('rolls over to a later day, then wraps to next week', () => {
    expect(nextLessonAfter(all, at(2, 19, 0), 'g1')?.lesson.id).toBe('d') // Thursday
    expect(nextLessonAfter(all, at(5, 19, 0), 'g1')?.daysAhead).toBe(4) // Mon after Thu
  })
  it('returns null when the group has no lessons', () => {
    expect(nextLessonAfter([], at(2, 9, 0), 'g1')).toBeNull()
  })
  it('applies date-specific cancellations without touching the weekly data', () => {
    const ex = [{ date: '2026-03-02', groupId: 'g1', kind: 'cancelled' as const, lessonId: 'a' }]
    expect(lessonsForDate(all, at(2, 9), 'g1', ex).map((l) => l.id)).toEqual(['b', 'c'])
    expect(lessonsForDate(all, at(9, 9), 'g1', ex).map((l) => l.id)).toEqual(['b', 'a', 'c'])
    expect(all).toHaveLength(4)
  })
  it('applies added one-off lessons', () => {
    const extra = lesson({ id: 'x', day: 'tue', start: '12:00', end: '12:50' })
    const ex = [{ date: '2026-03-02', groupId: 'g1', kind: 'added' as const, lesson: extra }]
    const r = lessonsForDate(all, at(2, 9), 'g1', ex, (l) => l as typeof extra)
    expect(r.map((l) => l.id)).toEqual(['b', 'a', 'x', 'c'])
  })
})

describe('week order', () => {
  it('respects first day of week', () => {
    expect(weekOrder('mon')[0]).toBe('mon')
    expect(weekOrder('sun')[0]).toBe('sun')
    expect(weekOrder('sun')).toHaveLength(7)
  })
})

describe('slotPosition (now-marker on the bell strip)', () => {
  const slots = [
    { n: 1, start: '08:00', end: '08:50' }, { n: 2, start: '09:00', end: '09:50' },
    { n: 3, start: '10:00', end: '10:50' }, { n: 4, start: '11:00', end: '11:50' },
  ]
  it('is null outside school hours', () => {
    expect(slotPosition(slots, at(2, 7, 59))).toBeNull()
    expect(slotPosition(slots, at(2, 12, 0))).toBeNull()
  })
  it('maps inside a slot proportionally', () => {
    expect(slotPosition(slots, at(2, 8, 0))).toBe(0)
    expect(slotPosition(slots, at(2, 9, 25))).toBeCloseTo((1 + 0.5) / 4, 5)
  })
  it('rests on the boundary during a break', () => {
    expect(slotPosition(slots, at(2, 8, 55))).toBe(0.25)
  })
})
