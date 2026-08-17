/**
 * Owns the extracted book index: building it from a user-supplied PDF,
 * persisting it to IndexedDB, and hydrating it back on app start.
 */
import { create } from 'zustand'
import type { AstroIndexPage } from '@/converter/extract'
import { extractAstroIndex } from '@/converter/extract'
import { pdfjsLib } from '@/lib/pdf'
import { clearIndex, loadIndex, saveIndex } from '@/lib/db'
import { ocrTocEntries } from '@/lib/ocr-toc'

export type IndexStatus =
  | 'hydrating'
  | 'empty'
  | 'extracting'
  | 'ready'
  | 'error'

interface IndexState {
  status: IndexStatus
  pages: AstroIndexPage[]
  error: string | null
  hydrate: () => Promise<void>
  buildFromFile: (file: File) => Promise<void>
  reset: () => Promise<void>
}

export const useIndexStore = create<IndexState>((set) => ({
  status: 'hydrating',
  pages: [],
  error: null,

  hydrate: async () => {
    const saved = await loadIndex()
    set(
      saved && saved.length > 0
        ? { status: 'ready', pages: saved }
        : { status: 'empty', pages: [] },
    )
  },

  buildFromFile: async (file: File) => {
    set({ status: 'extracting', error: null })
    try {
      const bytes = await file.arrayBuffer()
      const pages = await extractAstroIndex(
        bytes,
        { ignore: [1, 2, 3, 144], offset: 3 },
        pdfjsLib,
        ocrTocEntries,
      )
      await saveIndex(pages)
      set({ status: 'ready', pages })
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to read that PDF.',
      })
    }
  },

  reset: async () => {
    await clearIndex()
    set({ status: 'empty', pages: [], error: null })
  },
}))
