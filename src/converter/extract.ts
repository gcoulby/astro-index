/**
 * AstroIndex extractor (pdf.js based).
 *
 * Works in the browser (React app, pass an ArrayBuffer from a File) or
 * Node (pass a Buffer/Uint8Array), same function, same output shape as
 * the original Python/PyMuPDF version.
 *
 * Extracts per BOOK page (not raw PDF page):
 *   - text (whitespace collapsed, no \n)
 *   - heading: the book's own table-of-contents title for that page/spread
 *     (e.g. "The World", or "The World (part 2)" for multi-page spreads),
 *     parsed from the contents page. Falls back to a largest-font guess for
 *     any page the contents doesn't cover.
 *   - internal links only (page -> page). External/URL links are never
 *     inspected or stored, out of scope by design.
 *   - backlinks (linked_from_pages)
 *
 * Book page numbers vs PDF page numbers:
 *   book_page = pdf_page_number - offset
 *   pages listed in `ignore` (1-indexed PDF page numbers) are skipped
 *   entirely and never appear in the output or as a link target.
 */

import type {
  PDFDocumentProxy,
  TextContent,
  TextItem,
} from 'pdfjs-dist/types/src/display/api'

export interface AstroIndexOptions {
  offset: number
  ignore: number[]
}

export interface InternalLinkDetail {
  target_page: number
}

export interface AstroIndexPage {
  pageNumber: number
  heading: string
  text: string
  links_to_pages: number[]
  internal_links_detail: InternalLinkDetail[]
  linked_from_pages: number[]
}

/** Minimal shape of the pdf.js module we depend on, so this file has no
 * hard import of a specific build (browser vs Node legacy build). */
export interface PdfJsLike {
  getDocument(src: { data: Uint8Array | ArrayBuffer }): {
    promise: Promise<PDFDocumentProxy>
  }
}

export const ASTROINDEX_DEFAULTS: AstroIndexOptions = {
  offset: 3,
  ignore: [1, 2, 3, 144],
}

/**
 * Resolve a link annotation's destination to a PDF page index (0-based).
 * Handles both direct destinations (array) and named destinations (string),
 * which pdf.js exposes differently depending on how the PDF encoded them.
 */
export async function resolveDestPageIndex(
  pdfDoc: PDFDocumentProxy,
  dest: unknown,
): Promise<number | null> {
  let explicitDest = dest

  if (typeof dest === 'string') {
    explicitDest = await pdfDoc.getDestination(dest)
  }

  if (!explicitDest || !Array.isArray(explicitDest)) return null

  const ref = explicitDest[0] // first element is the page ref (or index)
  try {
    const pageIndex = await pdfDoc.getPageIndex(ref)
    return pageIndex // 0-based
  } catch {
    // some PDFs store a raw page index instead of a ref
    return typeof ref === 'number' ? ref : null
  }
}

/**
 * Guess the heading for a page: the text item(s) with the largest font
 * size, in the order they appear in the text content stream. Best-effort,
 * not exact, same caveat as label matching would carry in any approach.
 */
function extractHeading(textContent: TextContent): string {
  const items = textContent.items as TextItem[]
  let maxSize = 0

  for (const item of items) {
    // transform[3] approximates the font's vertical scale (its size)
    const size = Math.abs(item.transform[3])
    if (size > maxSize) maxSize = size
  }

  if (maxSize === 0) return ''

  const headingWords = items
    .filter((item) => Math.abs(item.transform[3]) >= maxSize - 0.5)
    .map((item) => item.str.trim())
    .filter(Boolean)

  return headingWords.join(' ').trim()
}

/**
 * Collapse all whitespace (including newlines) to single spaces.
 */
function flattenText(textContent: TextContent): string {
  const items = textContent.items as TextItem[]
  const raw = items.map((item) => item.str).join(' ')
  return raw.split(/\s+/).filter(Boolean).join(' ')
}

export interface TocEntry {
  title: string
  startPage: number
}

/**
 * Groups a page's text items into visual lines by y-position, each line
 * ordered left-to-right — the layout the "Title .... 12" contents rows
 * are printed in, which per-item reading order alone doesn't preserve.
 */
function groupIntoLines(
  textContent: TextContent,
  yTolerance = 3,
): TextItem[][] {
  const items = textContent.items as TextItem[]
  const lines: { y: number; items: TextItem[] }[] = []

  for (const item of items) {
    if (!item.str.trim()) continue
    const y = item.transform[5]
    const line = lines.find((l) => Math.abs(l.y - y) <= yTolerance)
    if (line) line.items.push(item)
    else lines.push({ y, items: [item] })
  }

  lines.sort((a, b) => b.y - a.y) // pdf.js y grows upward — descending is top-to-bottom
  for (const line of lines)
    line.items.sort((a, b) => a.transform[4] - b.transform[4])

  return lines.map((l) => l.items)
}

function lineText(line: TextItem[]): string {
  return line
    .map((item) => item.str)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** A contents row is a title, a run of leader dots/dashes/spaces, then the
 * page number it starts on — e.g. "THE WORLD ........... 1". */
const TOC_LINE_PATTERN = /^(.+?)[\s.·•∙\-—]{2,}(\d{1,4})$/
const TOC_LINE_FALLBACK_PATTERN = /^(.+?)\s+(\d{1,4})$/

export function parseTocLine(text: string): TocEntry | null {
  const match =
    TOC_LINE_PATTERN.exec(text) ?? TOC_LINE_FALLBACK_PATTERN.exec(text)
  if (!match) return null

  const title = match[1].replace(/[\s.·•∙\-—]+$/, '').trim()
  const startPage = Number(match[2])
  if (
    !title ||
    title.length > 80 ||
    !Number.isInteger(startPage) ||
    startPage <= 0
  ) {
    return null
  }

  return { title, startPage }
}

const TOC_SCAN_PAGE_LIMIT = 15
const TOC_MIN_LINK_ANNOTATIONS = 15

/**
 * Finds the table-of-contents page by structure, not by a "Contents" label
 * — plenty of book layouts (this one included) never print that word. A
 * contents page reliably stands out by having far more internal-destination
 * link annotations than any normal content page (one per entry, vs. maybe
 * a handful of in-text cross-references), so the page with the most wins,
 * as long as it clears a minimum that a normal page wouldn't reach.
 */
export async function findTocPageNumber(
  pdfDoc: PDFDocumentProxy,
): Promise<number | null> {
  let bestPage: number | null = null
  let bestCount = 0

  for (
    let pdfPageNum = 1;
    pdfPageNum <= Math.min(TOC_SCAN_PAGE_LIMIT, pdfDoc.numPages);
    pdfPageNum++
  ) {
    const page = await pdfDoc.getPage(pdfPageNum)
    const annotations = await page.getAnnotations()
    const linkCount = annotations.filter(
      (a) => a.subtype === 'Link' && a.dest,
    ).length

    if (linkCount > bestCount) {
      bestCount = linkCount
      bestPage = pdfPageNum
    }
  }

  return bestCount >= TOC_MIN_LINK_ANNOTATIONS ? bestPage : null
}

/**
 * Parses a known contents page's title/starting-page rows straight from its
 * text layer. Works when the contents page's labels are real selectable
 * text; some PDFs (this book included) bake that column into a background
 * image instead, in which case this simply finds nothing to parse.
 */
async function findTocEntriesFromText(
  pdfDoc: PDFDocumentProxy,
  tocPageNumber: number,
): Promise<TocEntry[]> {
  const page = await pdfDoc.getPage(tocPageNumber)
  const textContent = await page.getTextContent()
  const lines = groupIntoLines(textContent)

  return lines
    .map((line) => parseTocLine(lineText(line)))
    .filter((entry): entry is TocEntry => entry !== null)
}

/**
 * Applies contents titles to already-extracted pages, in place. A title
 * covers every page up to (not including) the next entry's starting page;
 * spreads longer than one page get "(part N)" suffixes, per book page.
 * Pages outside any contents range keep their largest-font-heuristic
 * heading (the caller's best guess for front/back matter).
 */
export function applyTocTitles(
  pages: AstroIndexPage[],
  entries: TocEntry[],
): void {
  if (entries.length === 0 || pages.length === 0) return

  // Later entries win ties on the same starting page — in reading order a
  // subsection (e.g. "THE WORLD") follows its parent section header (e.g.
  // "INTRODUCTION"), and the subsection is the more useful title.
  const titleByStartPage = new Map<number, string>()
  for (const entry of entries)
    titleByStartPage.set(entry.startPage, entry.title)

  const startPages = [...titleByStartPage.keys()].sort((a, b) => a - b)
  const maxPage = Math.max(...pages.map((p) => p.pageNumber))
  const pageByNumber = new Map(pages.map((p) => [p.pageNumber, p]))

  for (let i = 0; i < startPages.length; i++) {
    const start = startPages[i]
    const end = i + 1 < startPages.length ? startPages[i + 1] - 1 : maxPage
    const title = titleByStartPage.get(start)!
    const spreadLength = end - start + 1

    for (let pageNumber = start; pageNumber <= end; pageNumber++) {
      const page = pageByNumber.get(pageNumber)
      if (!page) continue
      const part = pageNumber - start + 1
      page.heading = spreadLength > 1 ? `${title} (part ${part})` : title
    }
  }
}

/** Below this many parsed rows, the contents page's text layer is assumed
 * to be missing or unreliable (e.g. baked into a background image) rather
 * than the book genuinely having a short contents list. */
const MIN_CONFIDENT_TEXT_TOC_ENTRIES = 5

/** Reads a known contents page's title rows when its text layer doesn't
 * have them — e.g. by OCR-ing the page image, cropped per row using the
 * page's own link annotations. Browser-only, so it's injected rather than
 * imported directly; this file stays usable from Node without it. */
export type TocOcrFallback = (
  pdfDoc: PDFDocumentProxy,
  tocPageNumber: number,
  offset: number,
) => Promise<TocEntry[]>

/**
 * Main entry point.
 *
 * @param pdfData raw PDF bytes
 * @param opts offset/ignore config, defaults to ASTROINDEX_DEFAULTS
 * @param pdfjsLib the pdf.js module (browser build or Node legacy build),
 *   passed in rather than imported directly so this file works with either
 * @param ocrFallback optional; used when the contents page is found but its
 *   text layer yields too few rows to trust
 * @returns sorted array of book-page objects
 */
export async function extractAstroIndex(
  pdfData: Uint8Array | ArrayBuffer,
  opts: Partial<AstroIndexOptions>,
  pdfjsLib: PdfJsLike,
  ocrFallback?: TocOcrFallback,
): Promise<AstroIndexPage[]> {
  const { offset, ignore } = { ...ASTROINDEX_DEFAULTS, ...opts }

  const loadingTask = pdfjsLib.getDocument({ data: pdfData })
  const pdfDoc = await loadingTask.promise

  const pagesByBookPage = new Map<number, AstroIndexPage>()

  for (let pdfPageNum = 1; pdfPageNum <= pdfDoc.numPages; pdfPageNum++) {
    if (ignore.includes(pdfPageNum)) continue

    const bookPage = pdfPageNum - offset
    if (bookPage < 1) continue

    const page = await pdfDoc.getPage(pdfPageNum)
    const textContent = await page.getTextContent()
    const text = flattenText(textContent)
    const heading = extractHeading(textContent)

    const annotations = await page.getAnnotations()
    const internalLinksDetail: InternalLinkDetail[] = []

    for (const annotation of annotations) {
      if (annotation.subtype !== 'Link') continue
      if (annotation.url) continue // external link, out of scope, skip entirely
      if (!annotation.dest) continue // no destination, nothing to resolve

      const targetPdfIndex = await resolveDestPageIndex(pdfDoc, annotation.dest)
      if (targetPdfIndex === null) continue

      const targetPdfNum = targetPdfIndex + 1 // 1-indexed
      if (ignore.includes(targetPdfNum)) continue // target isn't indexed

      const targetBookPage = targetPdfNum - offset
      if (targetBookPage < 1) continue

      internalLinksDetail.push({ target_page: targetBookPage })
    }

    const linksToPages = [
      ...new Set(internalLinksDetail.map((l) => l.target_page)),
    ].sort((a, b) => a - b)

    pagesByBookPage.set(bookPage, {
      pageNumber: bookPage,
      heading,
      text,
      links_to_pages: linksToPages,
      internal_links_detail: internalLinksDetail,
      linked_from_pages: [], // filled in below
    })
  }

  // build backlinks
  const backlinks = new Map<number, number[]>()
  for (const p of pagesByBookPage.values()) backlinks.set(p.pageNumber, [])
  for (const p of pagesByBookPage.values()) {
    for (const target of p.links_to_pages) {
      backlinks.get(target)?.push(p.pageNumber)
    }
  }
  for (const p of pagesByBookPage.values()) {
    p.linked_from_pages = [...new Set(backlinks.get(p.pageNumber) ?? [])].sort(
      (a, b) => a - b,
    )
  }

  const pages = [...pagesByBookPage.values()].sort(
    (a, b) => a.pageNumber - b.pageNumber,
  )

  const tocPageNumber = await findTocPageNumber(pdfDoc)
  if (tocPageNumber !== null) {
    let tocEntries = await findTocEntriesFromText(pdfDoc, tocPageNumber)
    if (tocEntries.length < MIN_CONFIDENT_TEXT_TOC_ENTRIES && ocrFallback) {
      tocEntries = await ocrFallback(pdfDoc, tocPageNumber, offset)
    }
    applyTocTitles(pages, tocEntries)
  }

  return pages
}
