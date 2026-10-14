import { describe, expect, it } from 'vitest'
import { buildIndex, norm, search } from '../lib/search'
import { lesson } from './helpers'

const groups = [{ id: 'g1', name: 'ВТПО231(4)', sourcePages: [1] }, { id: 'g2', name: 'РЭТ232(4)', sourcePages: [2] }]
const lessons = [
  lesson({ id: '1', subject: 'Операционная система Linux', teacher: 'Турганбай Куралай Егынбайкызы', room: 'GM 2' }),
  lesson({ id: '2', groupId: 'g2', subject: 'Сотовые сети', teacher: 'Мирзакулова Шарафат', room: '715' }),
  lesson({ id: '3', groupId: 'g2', subject: 'Электроника', teacher: 'Нусупбеков Серик', room: '715' }),
]
const idx = buildIndex(groups, lessons)

describe('search', () => {
  it('normalises case and ё', () => expect(norm('  ЁЖик  ПОЛЕ ')).toBe('ежик поле'))
  it('finds groups by partial name', () => expect(search(idx, 'втпо', 'group').groups.map((g) => g.id)).toEqual(['g1']))
  it('finds lessons by subject, teacher, room', () => {
    expect(search(idx, 'linux', 'subject').lessons.map((l) => l.id)).toEqual(['1'])
    expect(search(idx, 'мирзакулова', 'teacher').lessons.map((l) => l.id)).toEqual(['2'])
    expect(search(idx, '715', 'room').lessons.map((l) => l.id)).toEqual(['2', '3'])
  })
  it('requires all words (any order)', () => expect(search(idx, 'сети сотовые').lessons.map((l) => l.id)).toEqual(['2']))
  it('returns nothing for empty or unmatched queries', () => {
    expect(search(idx, '   ').totalLessons).toBe(0)
    expect(search(idx, 'нет такого').lessons).toEqual([])
  })
  it('does not match group names when searching a lesson field', () => expect(search(idx, 'втпо', 'subject').lessons).toEqual([]))
  it('caps results but reports the total', () => {
    const r = search(idx, '715', 'room', 1)
    expect(r.lessons).toHaveLength(1)
    expect(r.totalLessons).toBe(2)
  })
})
