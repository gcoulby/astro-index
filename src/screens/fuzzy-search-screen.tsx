import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { createSearchIndex, searchPages } from '@/lib/search'
import { useIndexStore } from '@/stores/index-store'
import { useNavStore } from '@/stores/nav-store'

/** Fuzzy content search over headings and body text, heading-weighted. */
export function FuzzySearchScreen() {
  const pages = useIndexStore((s) => s.pages)
  const openPage = useNavStore((s) => s.openPage)
  const [query, setQuery] = useState('')

  const fuse = useMemo(() => createSearchIndex(pages), [pages])
  const results = useMemo(() => searchPages(fuse, query), [fuse, query])

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 shrink-0">
        <div className="relative">
          <Search className="top-1/2 left-2.5 absolute size-4 text-astro-white/40 -translate-y-1/2 pointer-events-none" />
          <Input
            placeholder="Search the book…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent pl-8 border-astro-white/20 font-mono text-astro-white placeholder:text-astro-white/40"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col gap-2 p-4 pt-0">
          {results.map(({ page, snippet }) => (
            <button
              key={page.pageNumber}
              type="button"
              onClick={() => openPage(page.pageNumber)}
              className="flex flex-col gap-1 px-3 py-2.5 border border-astro-white/15 hover:border-accent-pink text-left"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-accent-pink">
                  Page {page.pageNumber}
                </span>
                <span className="font-powerr font-bold text-astro-white text-sm truncate">
                  {page.heading || 'Untitled page'}
                </span>
              </div>
              <p className="font-mono text-astro-white/50 text-xs">{snippet}</p>
            </button>
          ))}
          {query.trim() && results.length === 0 && (
            <p className="px-1 py-8 font-mono text-astro-white/40 text-sm text-center">
              No results for "{query}".
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
