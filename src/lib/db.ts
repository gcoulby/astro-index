/**
 * IndexedDB persistence for the extracted book index. localStorage is not
 * used here — it's synchronous and would block the main thread on an
 * index this size.
 */
import type { AstroIndexPage } from '@/converter/extract'

const DB_NAME = 'astro-index'
const DB_VERSION = 1
const STORE_NAME = 'book-index'
const RECORD_KEY = 'current'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Persists the extracted book index, replacing any previously saved index. */
export async function saveIndex(pages: AstroIndexPage[]): Promise<void> {
  const db = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(pages, RECORD_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

/** Loads the previously saved book index, or null if none exists. */
export async function loadIndex(): Promise<AstroIndexPage[] | null> {
  const db = await openDatabase()
  const result = await new Promise<AstroIndexPage[] | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).get(RECORD_KEY)
    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error)
  })
  db.close()
  return result
}

/** Deletes the saved book index. */
export async function clearIndex(): Promise<void> {
  const db = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(RECORD_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}
