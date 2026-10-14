import { useSyncExternalStore } from 'react'

type Precision = 'minute' | 'second'
const STEP: Record<Precision, number> = { minute: 60_000, second: 1_000 }

/**
 * One shared timer per precision, running only while something subscribes and the
 * tab is visible. Snapshots are rounded, so a component re-renders once per tick.
 */
function makeStore(precision: Precision) {
  const step = STEP[precision]
  const listeners = new Set<() => void>()
  let timer: ReturnType<typeof setTimeout> | undefined
  const snapshot = () => Math.floor(Date.now() / step) * step
  const schedule = () => {
    clearTimeout(timer)
    if (listeners.size === 0 || document.visibilityState === 'hidden') return
    timer = setTimeout(() => { listeners.forEach((l) => l()); schedule() }, step - (Date.now() % step) + 5)
  }
  const onVisible = () => { listeners.forEach((l) => l()); schedule() }
  return {
    snapshot,
    subscribe(cb: () => void) {
      if (listeners.size === 0) document.addEventListener('visibilitychange', onVisible)
      listeners.add(cb)
      schedule()
      return () => {
        listeners.delete(cb)
        if (listeners.size === 0) { clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible) }
      }
    },
  }
}

const stores = { minute: makeStore('minute'), second: makeStore('second') }

/** Current time, re-rendering the caller once per minute or second. */
export function useNow(precision: Precision = 'minute'): Date {
  const s = stores[precision]
  return new Date(useSyncExternalStore(s.subscribe, s.snapshot, s.snapshot))
}
