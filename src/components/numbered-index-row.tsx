import { ChevronRight, Link } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AstroIndexPage } from '@/converter/extract'

interface NumberedIndexRowProps {
  page: AstroIndexPage
  onSelect: () => void
  className?: string
}

/** A single ruled-line row in the page index list, e.g. "1 2 3 …" motif. */
export function NumberedIndexRow({
  page,
  onSelect,
  className,
}: NumberedIndexRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex items-center gap-3 hover:bg-astro-white/5 px-3 py-2.5 border-astro-white/10 border-b w-[95dvw] text-left transition-colors',
        className,
      )}
    >
      <span className="w-10 font-mono text-sm text-right text-accent-pink shrink-0">
        {page.pageNumber}
      </span>
      <span className="flex-1 min-w-0 font-mono text-astro-white/90 text-sm truncate">
        {page.heading || 'Untitled page'}
      </span>
      <span className="flex flex-row">
        <Link
          size={10}
          className={`${page?.links_to_pages?.length > 0 ? 'text-gradient-yellow' : 'text-pure-basic-black'}`}
        />
        <span
          className={`${page?.links_to_pages?.length > 0 ? 'text-gradient-yellow' : 'text-pure-basic-black'}`}
        >
          {page.links_to_pages.length}
        </span>
      </span>
      <ChevronRight className="size-4 text-astro-white/40 shrink-0" />
    </button>
  )
}
