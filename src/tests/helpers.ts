import type { Lesson, ResolvedLesson } from '../types/schedule'

export function lesson(p: Partial<ResolvedLesson> & { id: string }): ResolvedLesson {
  return {
    groupId: 'g1', day: 'mon', slotStart: 1, slotEnd: 1, start: '08:00', end: '08:50',
    subjectId: 's1', type: 'lecture', teacherId: 't1', teacher: 'Иванов И. И.', room: '101',
    variant: null, source: { page: 1, rawSubject: 'Предмет' }, verification: 'extracted', flags: [],
    subject: 'Предмет', ...p,
  }
}
export const asLesson = (l: ResolvedLesson): Lesson => l
/** Local-time Date helper: 2026-03-02 is a Monday. */
export const at = (day: number, h: number, m = 0, s = 0) => new Date(2026, 2, day, h, m, s)
