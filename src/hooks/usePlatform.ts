import { useEffect, useState, useSyncExternalStore } from 'react'

export function useMediaQuery(query: string): boolean {
  const subscribe = (cb: () => void) => {
    const m = window.matchMedia(query)
    m.addEventListener('change', cb)
    return () => m.removeEventListener('change', cb)
  }
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
}

export function useOnline(): boolean {
  const subscribe = (cb: () => void) => {
    window.addEventListener('online', cb)
    window.addEventListener('offline', cb)
    return () => { window.removeEventListener('online', cb); window.removeEventListener('offline', cb) }
  }
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
}

interface InstallEvent extends Event { prompt: () => Promise<void> }

/** Web install prompt (Chromium). Returns null when the platform can't offer it. */
export function useInstallPrompt(): (() => Promise<void>) | null {
  const [ev, setEv] = useState<InstallEvent | null>(null)
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setEv(e as InstallEvent) }
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])
  return ev ? async () => { await ev.prompt(); setEv(null) } : null
}
