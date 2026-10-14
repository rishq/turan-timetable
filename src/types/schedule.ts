export type DayId = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export const DAY_IDS: readonly DayId[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export type LessonType = 'lecture' | 'practical' | 'seminar' | 'laboratory' | 'other'
export type Verification = 'extracted' | 'needs_review' | 'confirmed'

export interface SlotDef { n: number; start: string; end: string }
export interface Group { id: string; name: string; sourcePages: number[] }
export interface Subject { id: string; name: string }
export interface Teacher { id: string; name: string }

/** A recurring weekly lesson. `start`/`end` are local wall-clock "HH:mm". */
export interface Lesson {
  id: string
  groupId: string
  day: DayId
  slotStart: number
  slotEnd: number
  start: string
  end: string
  subjectId: string
  type: LessonType
  teacherId: string | null
  teacher: string | null
  room: string | null
  /** Optional subgroup / schedule variant. */
  variant: string | null
  source: { page: number; rawSubject: string }
  verification: Verification
  flags: string[]
  notes?: string[]
}

/** Date-specific change applied on top of the recurring weekly schedule. */
export interface ScheduleException {
  date: string // YYYY-MM-DD, local
  groupId: string
  kind: 'cancelled' | 'added'
  lessonId?: string // for 'cancelled'
  lesson?: Lesson // for 'added'
  note?: string
}

export interface ScheduleMeta {
  source: string
  sourceNote: string
  effectiveFrom: string | null
  effectiveTo: string | null
  kind: 'recurring-weekly'
  /** We never assume a missing lesson means a confirmed free day. */
  completeness: 'unknown' | 'complete'
  slots: SlotDef[]
  days: { id: DayId; label: string }[]
}

export interface ScheduleData {
  meta: ScheduleMeta
  groups: Group[]
  subjects: Subject[]
  teachers: Teacher[]
  lessons: Lesson[]
  exceptions?: ScheduleException[]
}

/** A lesson with its subject name resolved, ready for display. */
export interface ResolvedLesson extends Lesson { subject: string }

export type LessonStatus = 'upcoming' | 'ongoing' | 'past'

export interface ValidationIssue {
  severity: 'error' | 'warning'
  code: 'missing-field' | 'invalid-time' | 'duplicate' | 'overlap' | 'unknown-ref' | 'uncertain'
  lessonId: string
  message: string
}
