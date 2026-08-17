/** pdf.js instance wired up with its worker, shared by anything that needs it. */
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'

/**
 * iOS Safari's ReadableStream is missing the async iterator pdf.js uses
 * for its CMap/standard-font fetches, which throws "undefined is not a
 * function (near '...value of readableStream...')" the moment a PDF needs
 * those resources. Polyfilling it before pdf.js runs works around it.
 */
if (typeof ReadableStream !== 'undefined' && !ReadableStream.prototype[Symbol.asyncIterator]) {
  // TS's DOM lib already declares this method with a stricter generic
  // signature than a plain async generator satisfies — this is a runtime
  // shim for a missing method, not a type worth fighting.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(ReadableStream.prototype as any)[Symbol.asyncIterator] = async function* (
    this: ReadableStream<unknown>,
  ) {
    const reader = this.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) return
        yield value
      }
    } finally {
      reader.releaseLock()
    }
  }
}

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export { pdfjsLib }
