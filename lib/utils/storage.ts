/**
 * Utility for storing files in IndexedDB (guest mode persistence)
 * Stores raw ArrayBuffer + metadata so files survive page navigation
 */

const DB_NAME = 'emattricule_temp_store'
const STORE_NAME = 'pending_files'
const DB_VERSION = 2 // bumped to force schema upgrade

interface StoredFile {
  buffer: ArrayBuffer
  name: string
  type: string
  size: number
}

/**
 * Initialize/Open the database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result
      // Drop old store if it exists (schema upgrade)
      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME)
      }
      db.createObjectStore(STORE_NAME)
    }
  })
}

/**
 * Save a dictionary of files to IndexedDB.
 * Converts each File to an ArrayBuffer so it survives page navigation.
 */
export async function saveFilesToIndexedDB(filesMap: Record<string, File>): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    // Clear previous files first
    store.clear()

    // Convert each File to a plain serializable object before storing
    const entries = Object.entries(filesMap).filter(([, file]) => file instanceof File)

    for (const [key, file] of entries) {
      try {
        const buffer = await file.arrayBuffer()
        const storedFile: StoredFile = {
          buffer,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
        }
        store.put(storedFile, key)
      } catch (err) {
        console.error(`Failed to serialize file "${key}":`, err)
      }
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log(`Saved ${entries.length} files to IndexedDB`)
        resolve()
      }
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(new Error('IndexedDB transaction aborted'))
    })
  } catch (error) {
    console.error('Error saving to IndexedDB:', error)
    throw error
  }
}

/**
 * Retrieve all pending files from IndexedDB.
 * Reconstructs File objects from stored ArrayBuffers.
 */
export async function getFilesFromIndexedDB(): Promise<Record<string, File>> {
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.openCursor()

    const files: Record<string, File> = {}

    return new Promise((resolve, reject) => {
      request.onsuccess = (event: any) => {
        const cursor = event.target.result
        if (cursor) {
          const key = cursor.key as string
          const value = cursor.value

          // Handle both old (File object) and new (StoredFile) formats
          if (value instanceof File) {
            files[key] = value
          } else if (value && value.buffer instanceof ArrayBuffer) {
            const storedFile = value as StoredFile
            const blob = new Blob([storedFile.buffer], { type: storedFile.type })
            files[key] = new File([blob], storedFile.name, { type: storedFile.type })
          }

          cursor.continue()
        } else {
          console.log(`Retrieved ${Object.keys(files).length} files from IndexedDB:`, Object.keys(files))
          resolve(files)
        }
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error reading from IndexedDB:', error)
    return {}
  }
}

/**
 * Clear all files from IndexedDB
 */
export async function clearIndexedDB(): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    store.clear()

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    console.error('Error clearing IndexedDB:', error)
  }
}
