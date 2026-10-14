import { describe, expect, it } from 'vitest'
import raw from '../../data/schedules/timetable.json'
import { buildSchedule } from '../data/repositories/scheduleRepository'
import type { ScheduleData } from '../types/schedule'

const data = raw as unknown as ScheduleData
const s = buildSchedule(data)

describe('imported timetable dataset', () => {
  it('has all 28 PDF pages as 28 distinct groups, 359 lessons', () => {
    expect(s.groups).toHaveLength(28)
    expect(new Set(s.groups.map((g) => g.id)).size).toBe(28)
    expect(s.lessons).toHaveLength(359)
  })
  it('has no validation errors and no overlaps or duplicates', () => {
    expect(s.issues.filter((i) => i.severity === 'error')).toEqual([])
    expect(s.issues.filter((i) => i.code === 'overlap' || i.code === 'duplicate')).toEqual([])
  })
  it('keeps every lesson inside the 10 bell slots, with ordered times', () => {
    for (const l of s.lessons) {
      expect(l.slotStart).toBeGreaterThanOrEqual(1)
      expect(l.slotEnd).toBeLessThanOrEqual(10)
      expect(l.slotEnd).toBeGreaterThanOrEqual(l.slotStart)
      expect(l.start < l.end).toBe(true)
      expect(l.day).not.toBe('sun')
    }
  })
  it('preserves Kazakh letters and Cyrillic in teacher names', () => {
    expect(s.lessons.some((l) => l.teacher === 'Айнақұл Әлжан Жақанұлы')).toBe(true)
  })
  it('records that completeness and effective dates are unknown', () => {
    expect(s.meta.completeness).toBe('unknown')
    expect(s.meta.effectiveFrom).toBeNull()
  })
  it('regression: VTPO231(4) Monday matches the source PDF page 1', () => {
    const mon = (s.lessonsByGroup.get('vtpo231-4') ?? []).filter((l) => l.day === 'mon')
    expect(mon.map((l) => [l.start, l.end, l.subject, l.type, l.room])).toEqual([
      ['08:00', '09:50', 'Инженерия программного обеспечения', 'practical', '209'],
      ['10:00', '12:50', 'Операционная система Linux', 'practical', '209'],
    ])
  })
})
