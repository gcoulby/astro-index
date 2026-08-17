import { useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClippedPanel } from '@/components/clipped-panel'
import { NumberedIndexRow } from '@/components/numbered-index-row'
import { useIndexStore } from '@/stores/index-store'
import { useNavStore } from '@/stores/nav-store'
import type { AstroIndexPage } from '@/converter/extract'

/** Shows a page's heading and both directions of its link graph, each as a
 * searchable scrollable list — same pattern as the Pages screen. */
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

  const linksTo = resolvePages(pages, page.links_to_pages)
  const linkedFrom = resolvePages(pages, page.linked_from_pages)

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

      <Tabs defaultValue="linksTo" className="flex flex-col flex-1 min-h-0">
        <TabsList className="mx-4">
          <TabsTrigger value="linksTo">Links to ({linksTo.length})</TabsTrigger>
          <TabsTrigger value="linkedFrom">
            Linked from ({linkedFrom.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="linksTo" className="flex-1 min-h-0">
          <LinkList pages={linksTo} onOpen={openPage} emptyText="Nothing on this page links elsewhere." />
        </TabsContent>
        <TabsContent value="linkedFrom" className="flex-1 min-h-0">
          <LinkList pages={linkedFrom} onOpen={openPage} emptyText="No other page links here." />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function resolvePages(
  pages: AstroIndexPage[],
  pageNumbers: number[],
): AstroIndexPage[] {
  const byNumber = new Map(pages.map((p) => [p.pageNumber, p]))
  return pageNumbers
    .map((n) => byNumber.get(n))
    .filter((p): p is AstroIndexPage => p !== undefined)
}

interface LinkListProps {
  pages: AstroIndexPage[]
  onOpen: (page: number) => void
  emptyText: string
}

function LinkList({ pages, onOpen, emptyText }: LinkListProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return pages
    return pages.filter(
      (p) =>
        String(p.pageNumber).startsWith(trimmed) ||
        p.heading.toLowerCase().includes(trimmed),
    )
  }, [pages, query])

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-2 shrink-0">
        <Input
          placeholder="Search these links…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-transparent border-astro-white/20 font-mono text-astro-white placeholder:text-astro-white/40"
        />
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="pb-4">
          {filtered.map((p) => (
            <NumberedIndexRow
              key={p.pageNumber}
              page={p}
              onSelect={() => onOpen(p.pageNumber)}
            />
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-8 font-mono text-astro-white/40 text-sm text-center">
              {pages.length === 0 ? emptyText : `No match for "${query}".`}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
