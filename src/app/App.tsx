import { lazy, Suspense } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { EmptyState, Loading, PrimaryButton } from '../components/ui/Feedback'
import GroupsScreen from '../features/groups/GroupsScreen'
import TodayScreen from '../features/today/TodayScreen'
import WeekScreen from '../features/timetable/WeekScreen'
import { useApp } from './providers/AppProvider'
import { useRoute } from './router'

// Rarely used screens are separate chunks.
const SearchScreen = lazy(() => import('../features/search/SearchScreen'))
const SettingsScreen = lazy(() => import('../features/settings/SettingsScreen'))

export default function App() {
  const route = useRoute()
  const { t, load, reload } = useApp()

  let body
  if (load.status === 'loading') body = <Loading label={t('loading')} />
  else if (load.status === 'error') body = <EmptyState title={t('loadError')} action={<PrimaryButton onClick={reload}>{t('retry')}</PrimaryButton>} />
  else {
    body = (
      <Suspense fallback={<Loading label={t('loading')} />}>
        {route === 'today' && <TodayScreen />}
        {route === 'week' && <WeekScreen />}
        {route === 'groups' && <GroupsScreen />}
        {route === 'search' && <SearchScreen />}
        {route === 'settings' && <SettingsScreen />}
      </Suspense>
    )
  }
  return <AppShell route={route}>{body}</AppShell>
}
