import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { DAY_LONG } from '../../lib/labels'
import { getNote, setNote } from '../../lib/notes'
import type { T } from '../../lib/i18n'
import type { ResolvedLesson } from '../../types/schedule'
import { TypeChip } from './LessonCard'

interface Props {
  lesson: ResolvedLesson | null
  groupName: string
  t: T
  onClose: () => void
  /** Offered when the lesson belongs to a group other than the selected one. */
  onOpenGroup?: () => void
}

/** Personal note for one lesson (IndexedDB). Remounted per lesson via `key`. */
function NoteField({ id, t }: { id: string; t: T }) {
  const [note, setNoteText] = useState('')
  const [state, setState] = useState<'idle' | 'saved' | 'unavailable'>('idle')
  useEffect(() => {
    let alive = true
    getNote(id).then(
      (v) => alive && setNoteText(v ?? ''),
      () => alive && setState('unavailable'),
    )
    return () => { alive = false }
  }, [id])
  const save = () => {
    if (state === 'unavailable') return
    setNote(id, note).then(() => setState('saved'), () => setState('unavailable'))
  }
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{t('note')}</span>
      <textarea
        value={note}
        onChange={(e) => { setNoteText(e.target.value); setState('idle') }}
        onBlur={save}
        disabled={state === 'unavailable'}
        rows={3}
        placeholder={t('notePlaceholder')}
        className="resize-none rounded-md border border-line bg-bg p-2.5 disabled:opacity-60"
      />
      <span className="min-h-4 text-xs text-ink-2" role="status">
        {state === 'saved' ? t('noteSaved') : state === 'unavailable' ? t('noteUnavailable') : ''}
      </span>
    </label>
  )
}

export function LessonSheet({ lesson, groupName, t, onClose, onOpenGroup }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (lesson && !d.open) d.showModal()
    if (!lesson && d.open) d.close()
  }, [lesson])

  const rows: [string, string][] = lesson
    ? [
        [t('group'), groupName],
        [t('time'), `${DAY_LONG[lesson.day]}, ${lesson.start}–${lesson.end}`],
        [t('slots'), lesson.slotStart === lesson.slotEnd ? t('slotN', { n: lesson.slotStart }) : `${lesson.slotStart}–${lesson.slotEnd}`],
        [t('teacher'), lesson.teacher ?? t('noTeacher')],
        [t('room'), lesson.room ?? t('noRoom')],
      ]
    : []

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby="sheet-title"
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) ref.current?.close() }}
    >
      {lesson && (
        <div className="safe-bottom flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="sheet-title" className="text-lg font-semibold leading-snug tracking-tight">{lesson.subject}</h2>
              <div className="mt-2"><TypeChip type={lesson.type} t={t} /></div>
            </div>
            <button type="button" aria-label={t('close')} onClick={() => ref.current?.close()} className="grid size-11 shrink-0 place-items-center rounded-md text-ink-2 hover:bg-surface-2">
              <X aria-hidden size={20} />
            </button>
          </div>
          <dl className="grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-2 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-ink-2">{k}</dt>
                <dd className="num break-words font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          {lesson.verification === 'needs_review' && (
            <p className="rounded-md bg-surface-2 p-3 text-sm"><strong>{t('needsReview')}.</strong> {t('needsReviewText')} {lesson.flags.join('; ')}</p>
          )}
          <p className="text-xs text-ink-2">{t('sourcePage', { n: lesson.source.page })}</p>
          {onOpenGroup && (
            <button type="button" onClick={() => { ref.current?.close(); onOpenGroup() }} className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-accent-ink">
              {t('pickGroupAction')}: {groupName}
            </button>
          )}
          <NoteField key={lesson.id} id={lesson.id} t={t} />
        </div>
      )}
    </dialog>
  )
}
