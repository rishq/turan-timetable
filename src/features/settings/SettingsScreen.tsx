import type { ReactNode } from 'react'
import { useApp, useSchedule } from '../../app/providers/AppProvider'
import { PageHeader, Segmented } from '../../components/ui/Feedback'
import { useInstallPrompt } from '../../hooks/usePlatform'
import { LOCALES } from '../../lib/i18n'

function Row({ label, children, id }: { label: string; children: ReactNode; id?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3.5 last:border-b-0">
      <span id={id} className="font-medium">{label}</span>
      {children}
    </div>
  )
}

export default function SettingsScreen() {
  const { t, prefs, setPrefs } = useApp()
  const data = useSchedule()
  const install = useInstallPrompt()
  const review = data.issues.filter((i) => i.code === 'uncertain').length
  return (
    <>
      <PageHeader title={t('settingsTitle')} />
      <div className="px-4 pb-8 lg:max-w-2xl lg:px-8">
        <section className="rounded-md border border-line bg-surface px-4">
          <Row label={t('theme')}>
            <Segmented
              label={t('theme')}
              value={prefs.theme}
              onChange={(theme) => setPrefs({ theme })}
              options={[{ id: 'system', label: t('themeSystem') }, { id: 'light', label: t('themeLight') }, { id: 'dark', label: t('themeDark') }]}
            />
          </Row>
          <Row label={t('language')} id="lang-label">
            <select
              aria-labelledby="lang-label"
              value={prefs.locale}
              onChange={(e) => setPrefs({ locale: e.target.value })}
              className="min-h-10 rounded-md border border-line bg-bg px-2"
            >
              {LOCALES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </Row>
          <Row label={t('weekStart')}>
            <Segmented
              label={t('weekStart')}
              value={prefs.weekStart}
              onChange={(weekStart) => setPrefs({ weekStart })}
              options={[{ id: 'mon', label: t('weekMon') }, { id: 'sun', label: t('weekSun') }]}
            />
          </Row>
          <div className="py-3.5">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="notif" className="font-medium">{t('notifications')}</label>
              <input id="notif" type="checkbox" role="switch" checked={false} disabled aria-describedby="notif-note" className="size-5 accent-[var(--accent)]" />
            </div>
            <p id="notif-note" className="mt-1.5 text-sm text-ink-2">{t('notificationsUnavailable')}</p>
          </div>
          {install && (
            <Row label={t('installable')}>
              <button type="button" onClick={() => void install()} className="min-h-10 rounded-md bg-accent px-3 text-sm font-semibold text-accent-ink">{t('installable')}</button>
            </Row>
          )}
        </section>
        <section className="mt-6 flex flex-col gap-1.5 text-sm text-ink-2">
          <h2 className="text-base font-semibold text-ink">{t('about')}</h2>
          <p>{t('aboutSource', { note: data.meta.sourceNote })}</p>
          <p>{t('aboutRange')}</p>
          <p>{t('aboutIssues', { n: review })}</p>
        </section>
      </div>
    </>
  )
}
