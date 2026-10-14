import { useDeferredValue, useMemo, useState } from 'react'
import { useApp, useSchedule } from '../../app/providers/AppProvider'
import { navigate } from '../../app/router'
import { PageHeader } from '../../components/ui/Feedback'
import { LessonCard } from '../../components/ui/LessonCard'
import { LessonSheet } from '../../components/ui/LessonSheet'
import { buildIndex, search, type SearchField } from '../../lib/search'
import type { ResolvedLesson } from '../../types/schedule'
import type { MessageKey } from '../../lib/i18n'

const FIELDS: { id: SearchField; key: MessageKey }[] = [
  { id: 'all', key: 'searchAll' }, { id: 'group', key: 'searchGroup' }, { id: 'subject', key: 'searchSubject' },
  { id: 'teacher', key: 'searchTeacher' }, { id: 'room', key: 'searchRoom' },
]

export default function SearchScreen() {
  const { t, group, selectGroup } = useApp()
  const data = useSchedule()
  const [q, setQ] = useState('')
  const [field, setField] = useState<SearchField>('all')
  const [open, setOpen] = useState<ResolvedLesson | null>(null)
  const index = useMemo(() => buildIndex(data.groups, data.lessons), [data])
  const deferred = useDeferredValue(q)
  const res = useMemo(() => search(index, deferred, field), [index, deferred, field])
  const has = deferred.trim().length > 0
  const nameOf = (id: string) => data.groupsById.get(id)?.name ?? id
  const pick = (id: string) => { selectGroup(id); navigate('today') }

  return (
    <>
      <PageHeader title={t('searchTitle')} />
      <div className="flex flex-col gap-4 px-4 pb-8 lg:max-w-2xl lg:px-8">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label={t('searchTitle')}
          placeholder={t('searchPlaceholder')}
          className="min-h-11 rounded-md border border-line bg-surface px-3"
        />
        <div role="group" aria-label={t('searchTitle')} className="flex flex-wrap gap-1.5">
          {FIELDS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={field === f.id}
              onClick={() => setField(f.id)}
              className={`min-h-9 rounded-md px-3 text-sm ${field === f.id ? 'bg-accent font-semibold text-accent-ink' : 'bg-surface-2 text-ink-2'}`}
            >
              {t(f.key)}
            </button>
          ))}
        </div>
        {!has && <p className="text-ink-2">{t('searchHint')}</p>}
        {has && res.groups.length === 0 && res.lessons.length === 0 && <p role="status" className="text-ink-2">{t('searchNothing')}</p>}
        {res.groups.length > 0 && (
          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
            {res.groups.map((g) => (
              <li key={g.id}>
                <button type="button" onClick={() => pick(g.id)} className="num min-h-11 rounded-md border border-line bg-surface px-3 font-semibold">{g.name}</button>
              </li>
            ))}
          </ul>
        )}
        {res.lessons.length > 0 && (
          <>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {res.lessons.map((l) => (
                <li key={l.id}><LessonCard lesson={l} t={t} onOpen={setOpen} showDay context={nameOf(l.groupId)} /></li>
              ))}
            </ul>
            {res.totalLessons > res.lessons.length && (
              <p className="text-sm text-ink-2">{t('searchMore', { shown: res.lessons.length, total: res.totalLessons })}</p>
            )}
          </>
        )}
      </div>
      <LessonSheet
        lesson={open}
        groupName={open ? nameOf(open.groupId) : ''}
        t={t}
        onClose={() => setOpen(null)}
        onOpenGroup={open && open.groupId !== group?.id ? () => pick(open.groupId) : undefined}
      />
    </>
  )
}
