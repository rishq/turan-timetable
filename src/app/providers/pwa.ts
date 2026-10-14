import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

/**
 * Service-worker updates are user-approved: a new build (new schedule data included)
 * waits until "Обновить" is tapped. Checks run when the app returns to the foreground,
 * never on a polling timer.
 */
export function usePwaUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const apply = useRef<((reload?: boolean) => Promise<void>) | null>(null)
  useEffect(() => {
    apply.current = registerSW({
      onNeedRefresh: () => setNeedRefresh(true),
      onRegisteredSW(_url, reg) {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && navigator.onLine) void reg?.update()
        })
      },
    })
  }, [])
  return { needRefresh, update: () => void apply.current?.(true), dismiss: () => setNeedRefresh(false) }
}
