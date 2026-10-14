/** Personal per-lesson notes in IndexedDB. Local only; survives app updates. */
const DB = 'tt-local'
const STORE = 'notes'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'))
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise<T>((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  }).finally(() => db.close())
}

export const getNote = (lessonId: string) => tx<string | undefined>('readonly', (s) => s.get(lessonId))
export async function setNote(lessonId: string, text: string): Promise<void> {
  if (text.trim()) await tx('readwrite', (s) => s.put(text, lessonId))
  else await tx('readwrite', (s) => s.delete(lessonId))
}
