import type { ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Logo } from '@/components/logo'
import { useNavStore } from '@/stores/nav-store'
import { useIndexStore } from '@/stores/index-store'

interface AppShellProps {
  children: ReactNode
}

/** Shared header + tab navigation for the two search screens. */
export function AppShell({ children }: AppShellProps) {
  const { screen, goTo } = useNavStore()
  const reset = useIndexStore((s) => s.reset)

  const activeTab =
    screen === 'fuzzySearch' ? 'fuzzySearch' : 'pageNumberSearch'

  return (
    <div className="flex flex-col bg-astro-black h-dvh text-astro-white">
      <header className="flex justify-between items-center px-4 py-2.5 border-astro-white/10 border-b shrink-0">
        <div className="flex items-center h-full">
          <span className="grow">
            <Logo />
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Tabs value={activeTab} onValueChange={(v) => goTo(v as never)}>
            <TabsList>
              <TabsTrigger value="pageNumberSearch">Pages</TabsTrigger>
              <TabsTrigger value="fuzzySearch">Search</TabsTrigger>
            </TabsList>
          </Tabs>

          <button
            type="button"
            onClick={() => void reset()}
            aria-label="Remove imported book and start over"
            className="text-astro-white/40 hover:text-accent-pink"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0">{children}</div>
    </div>
  )
}
