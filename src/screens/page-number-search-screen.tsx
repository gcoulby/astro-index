import { useMemo, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { NumberedIndexRow } from '@/components/numbered-index-row'
import { useIndexStore } from '@/stores/index-store'
import { useNavStore } from '@/stores/nav-store'

/** Direct-navigation screen: jump straight to a known page number. */
export function PageNumberSearchScreen() {
  const pages = useIndexStore((s) => s.pages)
  const openPage = useNavStore((s) => s.openPage)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return pages
    return pages.filter((p) => String(p.pageNumber).startsWith(query.trim()))
  }, [pages, query])

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 shrink-0">
        <Input
          type="number"
          inputMode="numeric"
          placeholder="Jump to page…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-transparent border-astro-white/20 font-mono text-astro-white placeholder:text-astro-white/40"
        />
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="pb-4">
          {filtered.map((page) => (
            <NumberedIndexRow
              key={page.pageNumber}
              page={page}
              onSelect={() => openPage(page.pageNumber)}
            />
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-8 font-mono text-astro-white/40 text-sm text-center">
              No page matches "{query}".
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
