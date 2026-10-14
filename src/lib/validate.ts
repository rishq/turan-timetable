import type { Lesson, ScheduleData, ValidationIssue } from '../types/schedule'
import { DAY_IDS } from '../types/schedule'
import { parseHHmm } from './time'

/**
 * Validates lessons without ever mutating or dropping them.
 * Issues are reported so the UI and the import report can surface them.
 */
export function validateSchedule(data: Pick<ScheduleData, 'groups' | 'subjects' | 'lessons'>): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const groups = new Set(data.groups.map((g) => g.id))
  const subjects = new Set(data.subjects.map((s) => s.id))
  const push = (severity: ValidationIssue['severity'], code: ValidationIssue['code'], l: Lesson, message: string) =>
    issues.push({ severity, code, lessonId: l.id, message })

  const seenIds = new Set<string>()
  const seenSig = new Map<string, string>()
  const byGroupDay = new Map<string, Lesson[]>()

  for (const l of data.lessons) {
    if (!l.id) push('error', 'missing-field', l, 'missing id')
    if (seenIds.has(l.id)) push('error', 'duplicate', l, `duplicate id ${l.id}`)
    seenIds.add(l.id)
    if (!groups.has(l.groupId)) push('error', 'unknown-ref', l, `unknown group ${l.groupId}`)
    if (!subjects.has(l.subjectId)) push('error', 'unknown-ref', l, `unknown subject ${l.subjectId}`)
    if (!DAY_IDS.includes(l.day)) push('error', 'missing-field', l, `invalid day ${String(l.day)}`)

    const s = parseHHmm(l.start)
    const e = parseHHmm(l.end)
    if (s === null || e === null) push('error', 'invalid-time', l, `invalid time ${l.start}–${l.end}`)
    else if (e <= s) push('error', 'invalid-time', l, `end ${l.end} is not after start ${l.start}`)

    if (!l.teacher) push('warning', 'missing-field', l, 'teacher missing')
    if (!l.room) push('warning', 'missing-field', l, 'classroom missing')
    if (l.verification === 'needs_review') push('warning', 'uncertain', l, l.flags.join('; ') || 'needs review')

    const sig = [l.groupId, l.day, l.start, l.end, l.subjectId, l.type, l.variant ?? ''].join('|')
    const prev = seenSig.get(sig)
    if (prev) push('warning', 'duplicate', l, `same lesson as ${prev}`)
    else seenSig.set(sig, l.id)

    const k = `${l.groupId}|${l.day}`
    const arr = byGroupDay.get(k)
    if (arr) arr.push(l)
    else byGroupDay.set(k, [l])
  }

  for (const arr of byGroupDay.values()) {
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i] as Lesson
        const b = arr[j] as Lesson
        const as = parseHHmm(a.start), ae = parseHHmm(a.end), bs = parseHHmm(b.start), be = parseHHmm(b.end)
        if (as === null || ae === null || bs === null || be === null) continue
        // Different subgroup variants may legitimately run in parallel.
        if (a.variant !== b.variant) continue
        if (bs < ae && as < be) push('warning', 'overlap', b, `overlaps with ${a.id}`)
      }
    }
  }
  return issues
}
