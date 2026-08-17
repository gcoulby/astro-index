import type { ReactNode } from 'react'
import { BookText, Search, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/logo'
import { useNavStore, type Screen } from '@/stores/nav-store'

interface AppShellProps {
  children: ReactNode
}

const TABS: { screen: Screen; label: string; icon: typeof BookText }[] = [
  { screen: 'pageNumberSearch', label: 'Pages', icon: BookText },
  { screen: 'fuzzySearch', label: 'Search', icon: Search },
  { screen: 'settings', label: 'Settings', icon: Settings },
]

/** Shared shell: centered wordmark up top, bottom tab bar for navigation. */
export function AppShell({ children }: AppShellProps) {
  const { screen, goTo } = useNavStore()

  const activeTab: Screen =
    screen === 'fuzzySearch' || screen === 'settings' ? screen : 'pageNumberSearch'

  return (
    <div className="flex flex-col bg-astro-black h-dvh text-astro-white">
      <header className="flex justify-center items-center py-2.5 border-astro-white/10 border-b shrink-0">
        <div className="scale-75">
          <Logo />
        </div>
      </header>

      <div className="flex-1 min-h-0">{children}</div>

      <nav className="flex shrink-0 border-astro-white/10 border-t">
        {TABS.map(({ screen: tabScreen, label, icon: Icon }) => {
          const active = activeTab === tabScreen
          return (
            <button
              key={tabScreen}
              type="button"
              onClick={() => goTo(tabScreen)}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 font-mono text-xs transition-colors',
                active
                  ? 'text-accent-pink'
                  : 'text-astro-white/50 hover:text-astro-white/80',
              )}
            >
              <Icon className="size-5" />
              {label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
