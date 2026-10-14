import type { CSSProperties } from 'react'
import { DAY_SHORT, TYPE_KEY, typeVar } from '../../lib/labels'
import type { T } from '../../lib/i18n'
import type { LessonStatus, ResolvedLesson } from '../../types/schedule'
import { MapPin, User, TriangleAlert } from 'lucide-react'

export function TypeChip({ type, t }: { type: ResolvedLesson['type']; t: T }) {
  return (
    <span className="type-chip rounded-sm px-1.5 py-0.5 text-xs font-medium" style={{ '--t': typeVar(type) } as CSSProperties}>
      {t(TYPE_KEY[type])}
    </span>
  )
}

interface Props {
  lesson: ResolvedLesson
  t: T
  onOpen: (l: ResolvedLesson) => void
  status?: LessonStatus
  /** Show weekday + group name (used in search results). */
  context?: string
  showDay?: boolean
}

export function LessonCard({ lesson: l, t, onOpen, status, context, showDay }: Props) {
  const ongoing = status === 'ongoing'
  return (
    <button
      type="button"
      onClick={() => onOpen(l)}
      aria-current={ongoing ? 'time' : undefined}
      style={{ '--t': typeVar(l.type) } as CSSProperties}
      className={`type-tint grid w-full grid-cols-[3.6rem_1fr] gap-3 rounded-md border border-line border-l-[3px] border-l-[var(--t)] p-3 text-left shadow-[var(--shadow)] transition-colors hover:border-ink-2/40 ${
        status === 'past' ? 'opacity-60' : ''
      } ${ongoing ? 'ring-2 ring-[var(--t)]' : ''}`}
    >
      <span className="num flex flex-col text-sm leading-tight">
        {showDay && <span className="mb-1 text-xs text-ink-2">{DAY_SHORT[l.day]}</span>}
        <span className="font-semibold">{l.start}</span>
        <span className="text-ink-2">{l.end}</span>
      </span>
      <span className="min-w-0">
        <span className="block break-words font-medium leading-snug">{l.subject}</span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-2">
          <TypeChip type={l.type} t={t} />
          {l.room && (
            <span className="inline-flex items-center gap-1"><MapPin aria-hidden size={14} />{l.room}</span>
          )}
          {l.teacher && (
            <span className="inline-flex min-w-0 items-center gap-1"><User aria-hidden size={14} className="shrink-0" /><span className="truncate">{l.teacher}</span></span>
          )}
          {context && <span className="font-medium text-ink">{context}</span>}
          {l.verification === 'needs_review' && (
            <span className="inline-flex items-center gap-1 text-[var(--t-practical)]"><TriangleAlert aria-hidden size={14} />{t('needsReview')}</span>
          )}
        </span>
      </span>
    </button>
  )
}
