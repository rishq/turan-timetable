import type { Group, ResolvedLesson } from '../types/schedule'

/** Lowercase, ё→е, collapse whitespace. */
export function norm(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim()
}

export interface SearchIndex {
  groups: { group: Group; hay: string }[]
  lessons: { lesson: ResolvedLesson; subj: string; teacher: string; room: string }[]
}

export function buildIndex(groups: Group[], lessons: ResolvedLesson[]): SearchIndex {
  return {
    groups: groups.map((g) => ({ group: g, hay: norm(g.name) })),
    lessons: lessons.map((l) => ({
      lesson: l,
      subj: norm(l.subject),
      teacher: norm(l.teacher ?? ''),
      room: norm(l.room ?? ''),
    })),
  }
}

export type SearchField = 'all' | 'group' | 'subject' | 'teacher' | 'room'

export interface SearchResult {
  groups: Group[]
  lessons: ResolvedLesson[]
  totalLessons: number
}

/** Every word of the query must appear in the searched field(s). */
export function search(index: SearchIndex, query: string, field: SearchField = 'all', limit = 60): SearchResult {
  const words = norm(query).split(' ').filter(Boolean)
  if (words.length === 0) return { groups: [], lessons: [], totalLessons: 0 }
  const all = (hay: string) => words.every((w) => hay.includes(w))
  const groups = field === 'all' || field === 'group' ? index.groups.filter((g) => all(g.hay)).map((g) => g.group) : []
  const hits =
    field === 'group'
      ? []
      : index.lessons.filter((x) => {
          if (field === 'subject') return all(x.subj)
          if (field === 'teacher') return all(x.teacher)
          if (field === 'room') return all(x.room)
          return all(`${x.subj} ${x.teacher} ${x.room}`)
        })
  return { groups, lessons: hits.slice(0, limit).map((x) => x.lesson), totalLessons: hits.length }
}
