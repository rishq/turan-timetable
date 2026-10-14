import { useState } from 'react'
import { Check, Star } from 'lucide-react'
import { useApp, useSchedule } from '../../app/providers/AppProvider'
import { navigate } from '../../app/router'
import { EmptyState, PageHeader } from '../../components/ui/Feedback'
import { norm } from '../../lib/search'
import type { Group } from '../../types/schedule'

type AppT = ReturnType<typeof useApp>
interface RowCtx {
  t: AppT['t']
  prefs: AppT['prefs']
  data: ReturnType<typeof useSchedule>
  selectGroup: AppT['selectGroup']
  toggleFav: AppT['toggleFav']
}

function Row({ g, ctx }: { g: Group; ctx: RowCtx }) {
  const { t, prefs, data, selectGroup, toggleFav } = ctx
  const fav = prefs.favorites.includes(g.id)
  const selected = prefs.groupId === g.id
  return (
    <li className="flex items-stretch gap-1">
      <button
        type="button"
        onClick={() => { selectGroup(g.id); navigate('today') }}
        aria-current={selected ? 'true' : undefined}
        className={`num flex min-h-12 flex-1 items-center justify-between rounded-md border px-3 text-left ${selected ? 'border-accent bg-surface font-semibold' : 'border-line bg-surface'}`}
      >
        <span>{g.name}</span>
        <span className="flex items-center gap-3 text-sm text-ink-2">
          {t('lessonsCount', { n: data.lessonsByGroup.get(g.id)?.length ?? 0 })}
          {selected && <span className="inline-flex items-center gap-1 text-accent"><Check aria-hidden size={16} />{t('selected')}</span>}
        </span>
      </button>
      <button
        type="button"
        onClick={() => toggleFav(g.id)}
        aria-pressed={fav}
        aria-label={t(fav ? 'removeFavorite' : 'addFavorite', { name: g.name })}
        className="grid min-h-12 w-12 place-items-center rounded-md border border-line bg-surface"
      >
        <Star aria-hidden size={18} className={fav ? 'fill-[var(--t-practical)] text-[var(--t-practical)]' : 'text-ink-2'} />
      </button>
    </li>
  )
}

function Section({ title, groups, ctx }: { title: string; groups: Group[]; ctx: RowCtx }) {
  if (!groups.length) return null
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-ink-2">{title}</h2>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">{groups.map((g) => <Row key={g.id} g={g} ctx={ctx} />)}</ul>
    </section>
  )
}

export default function GroupsScreen() {
  const { t, prefs, selectGroup, toggleFav } = useApp()
  const data = useSchedule()
  const [q, setQ] = useState('')
  const query = norm(q)
  const filtered = query ? data.groups.filter((g) => norm(g.name).includes(query)) : data.groups
  const byIds = (ids: string[]) => ids.flatMap((id) => data.groupsById.get(id) ?? [])
  const ctx: RowCtx = { t, prefs, data, selectGroup, toggleFav }
  const favs = byIds(prefs.favorites)
  const recent = byIds(prefs.recent).filter((g) => !prefs.favorites.includes(g.id))

  return (
    <>
      <PageHeader title={t('groupsTitle')} />
      <div className="flex flex-col gap-5 px-4 pb-8 lg:max-w-2xl lg:px-8">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label={t('groupsSearch')}
          placeholder={t('groupsSearch')}
          className="min-h-11 rounded-md border border-line bg-surface px-3"
        />
        {!query && <Section title={t('groupsFavorites')} groups={favs} ctx={ctx} />}
        {!query && <Section title={t('groupsRecent')} groups={recent} ctx={ctx} />}
        {filtered.length === 0 ? <EmptyState title={t('groupsEmpty')} /> : <Section title={t('groupsAll')} groups={filtered} ctx={ctx} />}
      </div>
    </>
  )
}
