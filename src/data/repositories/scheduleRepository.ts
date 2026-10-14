import type { Group, Lesson, ResolvedLesson, ScheduleData, ScheduleMeta, ValidationIssue } from '../../types/schedule'
import { validateSchedule } from '../../lib/validate'
import { sortLessons } from '../../lib/schedule'

export interface Schedule {
  meta: ScheduleMeta
  groups: Group[]
  groupsById: Map<string, Group>
  lessons: ResolvedLesson[]
  lessonsByGroup: Map<string, ResolvedLesson[]>
  exceptions: NonNullable<ScheduleData['exceptions']>
  issues: ValidationIssue[]
  resolve: (l: Lesson) => ResolvedLesson
}

/** Turns raw data into indexed, validated, display-ready form. Never drops records. */
export function buildSchedule(data: ScheduleData): Schedule {
  const subjectName = new Map(data.subjects.map((s) => [s.id, s.name]))
  const resolve = (l: Lesson): ResolvedLesson => ({ ...l, subject: subjectName.get(l.subjectId) ?? l.source.rawSubject })
  const lessons = sortLessons(data.lessons.map(resolve))
  const lessonsByGroup = new Map<string, ResolvedLesson[]>()
  for (const l of lessons) {
    const arr = lessonsByGroup.get(l.groupId)
    if (arr) arr.push(l)
    else lessonsByGroup.set(l.groupId, [l])
  }
  return {
    meta: data.meta,
    groups: data.groups,
    groupsById: new Map(data.groups.map((g) => [g.id, g])),
    lessons,
    lessonsByGroup,
    exceptions: data.exceptions ?? [],
    issues: validateSchedule(data),
    resolve,
  }
}

let cached: Promise<Schedule> | null = null

/** Schedule JSON is its own chunk: cached by the service worker, loaded once. */
export function loadSchedule(): Promise<Schedule> {
  cached ??= import('../../../data/schedules/timetable.json').then((m) =>
    buildSchedule((m as unknown as { default: ScheduleData }).default),
  ).catch((e: unknown) => {
    cached = null // allow retry after a failed load
    throw e
  })
  return cached
}
