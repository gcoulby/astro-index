/**
 * AstroIndex extractor (pdf.js based).
 *
 * Works in the browser (React app, pass an ArrayBuffer from a File) or
 * Node (pass a Buffer/Uint8Array), same function, same output shape as
 * the original Python/PyMuPDF version.
 *
 * Extracts per BOOK page (not raw PDF page):
 *   - text (whitespace collapsed, no \n)
 *   - heading (best-guess largest text on the page, for search weighting)
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
async function resolveDestPageIndex(
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

/**
 * Main entry point.
 *
 * @param pdfData raw PDF bytes
 * @param opts offset/ignore config, defaults to ASTROINDEX_DEFAULTS
 * @param pdfjsLib the pdf.js module (browser build or Node legacy build),
 *   passed in rather than imported directly so this file works with either
 * @returns sorted array of book-page objects
 */
export async function extractAstroIndex(
  pdfData: Uint8Array | ArrayBuffer,
  opts: Partial<AstroIndexOptions>,
  pdfjsLib: PdfJsLike,
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

  return [...pagesByBookPage.values()].sort(
    (a, b) => a.pageNumber - b.pageNumber,
  )
}
