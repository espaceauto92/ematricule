/**
 * Utility for storing larger files in IndexedDB (guest mode persistence)
 */

const DB_NAME = 'emattricule_temp_store'
const STORE_NAME = 'pending_files'
const DB_VERSION = 1

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
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

/**
 * Save a dictionary of files to IndexedDB
 * @param filesMap Object where keys are document types and values are File objects
 */
export async function saveFilesToIndexedDB(filesMap: Record<string, File>): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    // Clear previous files first
    store.clear()

    // Save each file
    for (const [key, file] of Object.entries(filesMap)) {
      if (file) {
        store.put(file, key)
      }
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    console.error('Error saving to IndexedDB:', error)
    throw error
  }
}

/**
 * Retrieve all pending files from IndexedDB
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
          files[cursor.key] = cursor.value
          cursor.continue()
        } else {
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
