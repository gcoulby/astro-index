import type { ReactNode } from 'react'
import { ArrowLeft, ChevronRight, CornerUpLeft } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ClippedPanel } from '@/components/clipped-panel'
import { useIndexStore } from '@/stores/index-store'
import { useNavStore } from '@/stores/nav-store'

/** Shows a page's heading and both directions of its link graph. */
export function PageLinksScreen() {
  const pages = useIndexStore((s) => s.pages)
  const { selectedPage, openPage, goTo } = useNavStore()

  const page = pages.find((p) => p.pageNumber === selectedPage)

  if (!page) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="font-mono text-astro-white/40 text-sm">Page not found.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 shrink-0">
        <button
          type="button"
          onClick={() => goTo('pageNumberSearch')}
          className="flex items-center gap-1.5 mb-4 font-mono text-astro-white/50 text-sm hover:text-accent-pink"
        >
          <ArrowLeft className="size-4" />
          Back to pages
        </button>

        <ClippedPanel tone="ink" className="border border-astro-white/15">
          <span className="font-mono text-sm text-accent-pink">
            Page {page.pageNumber}
          </span>
          <h1 className="mt-1 font-powerr font-extrabold text-2xl">
            {page.heading || 'Untitled page'}
          </h1>
        </ClippedPanel>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col gap-6 p-4 pt-0">
          <LinkSection
            title="Links to"
            icon={<ChevronRight className="size-4" />}
            pageNumbers={page.links_to_pages}
            onOpen={openPage}
          />
          <LinkSection
            title="Linked from"
            icon={<CornerUpLeft className="size-4" />}
            pageNumbers={page.linked_from_pages}
            onOpen={openPage}
          />
        </div>
      </ScrollArea>
    </div>
  )
}

interface LinkSectionProps {
  title: string
  icon: ReactNode
  pageNumbers: number[]
  onOpen: (page: number) => void
}

function LinkSection({ title, icon, pageNumbers, onOpen }: LinkSectionProps) {
  return (
    <div>
      <h2 className="mb-2 font-mono text-astro-white/40 text-xs uppercase tracking-wide">
        {title}
      </h2>
      {pageNumbers.length === 0 ? (
        <p className="font-mono text-astro-white/30 text-sm">None</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {pageNumbers.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onOpen(n)}
              className="flex items-center gap-1 px-2.5 py-1 border border-astro-white/15 hover:border-accent-pink font-mono text-astro-white/80 text-sm hover:text-accent-pink"
            >
              {icon}
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
