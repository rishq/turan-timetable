import type { CSSProperties } from 'react'
import { slotPosition } from '../../lib/schedule'
import { typeVar } from '../../lib/labels'
import type { T } from '../../lib/i18n'
import type { ResolvedLesson, SlotDef } from '../../types/schedule'

/**
 * The day laid out on the university's real bell schedule: ten slots, lessons as
 * bars spanning the slots they occupy, and a marker for "now".
 */
export function DayStrip({ slots, lessons, now, t }: { slots: SlotDef[]; lessons: ResolvedLesson[]; now: Date; t: T }) {
  const pos = slotPosition(slots, now)
  const summary = lessons.length
    ? lessons.map((l) => `${l.slotStart === l.slotEnd ? l.slotStart : `${l.slotStart}–${l.slotEnd}`}: ${l.subject}`).join('; ')
    : t('emptyDay')
  const n = slots.length
  return (
    <figure className="m-0">
      <div role="img" aria-label={`${t('dayStrip')}. ${summary}`} className="relative">
        <div className="grid h-3.5 gap-0.5" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
          {slots.map((s) => (
            <span key={s.n} className="rounded-[3px] bg-surface-2" style={{ gridColumn: s.n, gridRow: 1 }} />
          ))}
          {lessons.map((l) => (
            <span
              key={l.id}
              className="rounded-[3px] bg-[var(--t)]"
              style={{ '--t': typeVar(l.type), gridColumn: `${l.slotStart} / ${l.slotEnd + 1}`, gridRow: 1 } as CSSProperties}
            />
          ))}
        </div>
        {pos !== null && (
          <span aria-hidden className="now-marker absolute -top-1 h-[1.375rem] w-0.5 rounded bg-ink" style={{ left: `${pos * 100}%` }} />
        )}
      </div>
      <div aria-hidden className="num mt-1.5 grid text-[11px] text-ink-2" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
        {slots.map((s) => (
          <span key={s.n} className="text-center">{s.n === 1 || s.n === n ? s.start : s.n}</span>
        ))}
      </div>
    </figure>
  )
}
