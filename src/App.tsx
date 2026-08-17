import { useEffect } from 'react'
import { AppShell } from '@/components/app-shell'
import { SplashScreen } from '@/screens/splash-screen'
import { PageNumberSearchScreen } from '@/screens/page-number-search-screen'
import { PageLinksScreen } from '@/screens/page-links-screen'
import { FuzzySearchScreen } from '@/screens/fuzzy-search-screen'
import { useNavStore } from '@/stores/nav-store'
import { useIndexStore } from '@/stores/index-store'

function App() {
  const screen = useNavStore((s) => s.screen)
  const hydrate = useIndexStore((s) => s.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  if (screen === 'splash') return <SplashScreen />

  return (
    <AppShell>
      {screen === 'pageNumberSearch' && <PageNumberSearchScreen />}
      {screen === 'pageLinks' && <PageLinksScreen />}
      {screen === 'fuzzySearch' && <FuzzySearchScreen />}
    </AppShell>
  )
}

export default App
