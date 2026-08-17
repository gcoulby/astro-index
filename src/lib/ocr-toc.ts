/**
 * OCR fallback for a contents page whose title labels are baked into a
 * background image rather than real text (common when a ToC's typography
 * is hand-laid-out). Runs entirely locally — worker/core/language data are
 * vendored under public/tesseract and public/tessdata, no CDN calls.
 *
 * Each contents row is a real PDF link annotation even when its label
 * isn't real text, so this crops the rendered page to just that row's
 * clickable rectangle (grouping the several sub-rects a row is often split
 * into) and OCRs one short strip at a time, rather than the whole page —
 * far more reliable than OCR-ing a full stylized page at once. The row's
 * destination page comes straight from the annotation, not from OCR, so
 * only the title text itself needs recognizing.
 */
import { createWorker, OEM } from 'tesseract.js'
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api'
import type { PageViewport } from 'pdfjs-dist/types/src/display/page_viewport'
import {
  resolveDestPageIndex,
  type TocEntry,
  type TocOcrFallback,
} from '@/converter/extract'

const RENDER_SCALE = 3
const ROW_Y_TOLERANCE = 4
const ROW_CROP_PADDING_PX = 6

interface AnnotationRow {
  rect: [number, number, number, number] // x1, y1 (bottom), x2, y2 (top) — PDF space
  dest: unknown
}

function groupAnnotationsIntoRows(
  annotations: { subtype?: string; dest?: unknown; rect?: number[] }[],
): AnnotationRow[] {
  const rows: AnnotationRow[] = []

  for (const annotation of annotations) {
    if (annotation.subtype !== 'Link' || !annotation.dest || !annotation.rect) continue
    const [x1, y1, x2, y2] = annotation.rect
    const yCenter = (y1 + y2) / 2

    const row = rows.find(
      (r) => Math.abs((r.rect[1] + r.rect[3]) / 2 - yCenter) <= ROW_Y_TOLERANCE,
    )
    if (row) {
      row.rect = [
        Math.min(row.rect[0], x1),
        Math.min(row.rect[1], y1),
        Math.max(row.rect[2], x2),
        Math.max(row.rect[3], y2),
      ]
    } else {
      rows.push({ rect: [x1, y1, x2, y2], dest: annotation.dest })
    }
  }

  return rows
}

function cropRow(
  pageCanvas: HTMLCanvasElement,
  viewport: PageViewport,
  rect: AnnotationRow['rect'],
): HTMLCanvasElement | null {
  const [vx1, vy1] = viewport.convertToViewportPoint(rect[0], rect[3])
  const [vx2, vy2] = viewport.convertToViewportPoint(rect[2], rect[1])

  const x = Math.max(0, Math.min(vx1, vx2) - ROW_CROP_PADDING_PX)
  const y = Math.max(0, Math.min(vy1, vy2) - ROW_CROP_PADDING_PX)
  const width = Math.min(
    pageCanvas.width - x,
    Math.abs(vx2 - vx1) + ROW_CROP_PADDING_PX * 2,
  )
  const height = Math.min(
    pageCanvas.height - y,
    Math.abs(vy2 - vy1) + ROW_CROP_PADDING_PX * 2,
  )
  if (width <= 0 || height <= 0) return null

  const cropCanvas = document.createElement('canvas')
  cropCanvas.width = width
  cropCanvas.height = height
  const cropContext = cropCanvas.getContext('2d')
  if (!cropContext) return null

  cropContext.drawImage(pageCanvas, x, y, width, height, 0, 0, width, height)
  return cropCanvas
}

/** Title-cases a word, except acronyms with internal dots ("W.A.R.G.") —
 * every word in the source is uppercase, so plain case alone can't tell a
 * real acronym from a normal word. */
function titleCaseWord(word: string): string {
  const isDottedAcronym = /^([A-Z]\.){2,}$/.test(word) // e.g. "W.A.R.G."
  if (isDottedAcronym) return word
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

/** A row crop OCRs as the title plus, often, garbled noise from the
 * decorative dash leader and page number that follow it on the same row
 * (that number isn't needed anyway — the real one comes from the row's own
 * link destination). Since the source is uniformly uppercase with no
 * digits, real title words come out all-caps and digit-free; noise from
 * the leader/number reliably doesn't (mixed case, stray punctuation, or
 * the page number itself), so keep only the leading clean run. */
function isCleanTitleWord(word: string): boolean {
  if (word === '&') return true
  if (word.length <= 2) return false // no real title word here is this short
  return /^[A-Z&.'’-]+$/.test(word)
}

function extractTitle(ocrText: string): string {
  const collapsed = ocrText.replace(/\s+/g, ' ').trim()
  if (!collapsed) return ''

  const words = collapsed.split(' ')
  const kept: string[] = []
  for (const word of words) {
    if (!isCleanTitleWord(word)) break
    kept.push(word)
  }

  return kept.map(titleCaseWord).join(' ')
}

export const ocrTocEntries: TocOcrFallback = async (
  pdfDoc: PDFDocumentProxy,
  tocPageNumber: number,
  offset: number,
) => {
  const page = await pdfDoc.getPage(tocPageNumber)
  const annotations = await page.getAnnotations()
  const rows = groupAnnotationsIntoRows(annotations)
  if (rows.length === 0) return []

  const viewport = page.getViewport({ scale: RENDER_SCALE })
  const pageCanvas = document.createElement('canvas')
  pageCanvas.width = viewport.width
  pageCanvas.height = viewport.height
  const pageContext = pageCanvas.getContext('2d')
  if (!pageContext) return []

  await page.render({ canvas: pageCanvas, canvasContext: pageContext, viewport })
    .promise

  const worker = await createWorker('eng', OEM.LSTM_ONLY, {
    workerPath: `${import.meta.env.BASE_URL}tesseract/worker.min.js`,
    corePath: `${import.meta.env.BASE_URL}tesseract/tesseract-core-simd-lstm.js`,
    langPath: `${import.meta.env.BASE_URL}tessdata`,
    gzip: true,
    // Blob-wrapped worker scripts (tesseract.js's default) break the core
    // wasm's relative-path resolution — it ends up fetching a bare
    // filename with no directory. Loading the worker from its real local
    // path avoids that.
    workerBlobURL: false,
  })

  const entries: TocEntry[] = []

  try {
    for (const row of rows) {
      const targetPdfIndex = await resolveDestPageIndex(pdfDoc, row.dest)
      if (targetPdfIndex === null) continue
      const startPage = targetPdfIndex + 1 - offset
      if (startPage < 1) continue

      const cropCanvas = cropRow(pageCanvas, viewport, row.rect)
      if (!cropCanvas) continue

      const {
        data: { text },
      } = await worker.recognize(cropCanvas)
      const title = extractTitle(text)
      if (title) entries.push({ title, startPage })
    }
  } finally {
    await worker.terminate()
  }

  return entries
}
