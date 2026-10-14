import { DAY_IDS, type DayId } from '../types/schedule'

const HHMM = /^([01]?\d|2[0-3]):([0-5]\d)$/

/** Minutes since midnight for "HH:mm", or null if invalid. */
export function parseHHmm(s: string): number | null {
  const m = HHMM.exec(s)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

export function minutesOf(d: Date): number {
  return d.getHours() * 60 + d.getMinutes()
}

/** Seconds since local midnight, including seconds. */
export function secondsOf(d: Date): number {
  return minutesOf(d) * 60 + d.getSeconds()
}

/** Local weekday of a Date (device timezone). */
export function dayIdOf(d: Date): DayId {
  return DAY_IDS[(d.getDay() + 6) % 7] as DayId
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes(), d.getSeconds())
}

export function toLocalISODate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** "1 ч 05 мин", "25 мин", "45 с" — compact Russian duration. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return m ? `${h} ч ${String(m).padStart(2, '0')} мин` : `${h} ч`
  if (m > 0) return `${m} мин`
  return `${s} с`
}

/** Countdown "h:mm:ss" or "mm:ss". */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const p = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`
}
