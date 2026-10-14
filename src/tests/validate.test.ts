import { describe, expect, it } from 'vitest'
import { validateSchedule } from '../lib/validate'
import { lesson } from './helpers'

const base = { groups: [{ id: 'g1', name: 'G', sourcePages: [1] }], subjects: [{ id: 's1', name: 'S' }] }
const run = (lessons: ReturnType<typeof lesson>[]) => validateSchedule({ ...base, lessons })
const codes = (l: ReturnType<typeof lesson>[]) => run(l).map((i) => i.code)

describe('validateSchedule', () => {
  it('accepts a clean lesson', () => expect(run([lesson({ id: 'a' })])).toEqual([]))
  it('reports invalid and reversed times as errors', () => {
    expect(codes([lesson({ id: 'a', start: '25:00' })])).toContain('invalid-time')
    expect(codes([lesson({ id: 'a', start: '10:00', end: '09:00' })])).toContain('invalid-time')
  })
  it('reports missing teacher/room as warnings, not errors', () => {
    const r = run([lesson({ id: 'a', teacher: null, room: null })])
    expect(r.map((i) => i.severity)).toEqual(['warning', 'warning'])
  })
  it('flags overlaps without removing anything', () => {
    const ls = [lesson({ id: 'a', start: '08:00', end: '09:50' }), lesson({ id: 'b', start: '09:00', end: '09:50', subjectId: 's1', type: 'practical' })]
    expect(codes(ls)).toContain('overlap')
    expect(ls).toHaveLength(2)
  })
  it('does not flag back-to-back lessons', () => {
    expect(codes([lesson({ id: 'a', start: '08:00', end: '08:50' }), lesson({ id: 'b', start: '08:50', end: '09:40', type: 'practical' })])).not.toContain('overlap')
  })
  it('allows parallel lessons in different subgroup variants', () => {
    const ls = [lesson({ id: 'a', variant: '1' }), lesson({ id: 'b', variant: '2', type: 'practical' })]
    expect(codes(ls)).not.toContain('overlap')
  })
  it('flags duplicates by id and by content', () => {
    expect(codes([lesson({ id: 'a' }), lesson({ id: 'a', start: '09:00', end: '09:50' })])).toContain('duplicate')
    expect(codes([lesson({ id: 'a' }), lesson({ id: 'b' })])).toContain('duplicate')
  })
  it('flags unknown references and uncertain records', () => {
    expect(codes([lesson({ id: 'a', groupId: 'zz' })])).toContain('unknown-ref')
    expect(codes([lesson({ id: 'a', verification: 'needs_review', flags: ['x'] })])).toContain('uncertain')
  })
})
