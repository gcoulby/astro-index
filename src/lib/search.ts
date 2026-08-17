/**
 * Fuzzy search over the extracted index. Headings are weighted higher than
 * body text so a page titled "Combat" outranks the ~140 pages that merely
 * mention combat in passing.
 */
import Fuse, { type FuseResultMatch } from 'fuse.js'
import type { AstroIndexPage } from '@/converter/extract'

const SNIPPET_WORD_RADIUS = 8

export interface FuzzySearchResult {
  page: AstroIndexPage
  snippet: string
}

export function createSearchIndex(pages: AstroIndexPage[]): Fuse<AstroIndexPage> {
  return new Fuse(pages, {
    keys: [
      { name: 'heading', weight: 0.7 },
      { name: 'text', weight: 0.3 },
    ],
    includeMatches: true,
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
  })
}

/**
 * Builds a short snippet around a match: a fixed number of words either
 * side of the matched text. Never returns the full page text.
 */
function snippetFromMatch(text: string, match: FuseResultMatch): string {
  const [start, end] = match.indices[0] ?? [0, Math.min(text.length, 40)]

  const words = text.split(/\s+/)
  let charCount = 0
  let matchWordIndex = 0

  for (let i = 0; i < words.length; i++) {
    charCount += words[i].length + 1
    if (charCount > start) {
      matchWordIndex = i
      break
    }
  }

  const lowStart = Math.max(0, matchWordIndex - SNIPPET_WORD_RADIUS)
  const highEnd = Math.min(words.length, matchWordIndex + SNIPPET_WORD_RADIUS + 1)
  const snippetWords = words.slice(lowStart, highEnd)

  const prefix = lowStart > 0 ? '… ' : ''
  const suffix = highEnd < words.length ? ' …' : ''

  void end
  return `${prefix}${snippetWords.join(' ')}${suffix}`
}

/** Runs a fuzzy query and returns ranked results with a capped snippet. */
export function searchPages(
  fuse: Fuse<AstroIndexPage>,
  query: string,
): FuzzySearchResult[] {
  if (!query.trim()) return []

  return fuse.search(query).map((result) => {
    const bodyMatch = result.matches?.find((m) => m.key === 'text')
    const snippet = bodyMatch
      ? snippetFromMatch(result.item.text, bodyMatch)
      : result.item.heading

    return { page: result.item, snippet }
  })
}
