export const DB_NAME = 'walu';
export const CACHE_STORE = 'cache';
export const DOWNLOAD_STORE = 'download';
export const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    console.log('[WALU] Opening IndexedDB connection...');
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('[WALU] IndexedDB error:', (event.target as IDBOpenDBRequest).error);
      dbPromise = null;
      reject('Error opening DB');
    };

    request.onsuccess = (event) => {
      console.log('[WALU] IndexedDB connection successful.');
      const db = (event.target as IDBOpenDBRequest).result;
      // Close the connection if the tab is closed
      db.onclose = () => {
        console.log('[WALU] IndexedDB connection closed.');
        dbPromise = null;
      };
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const upgradeDb = (event.target as IDBOpenDBRequest).result;
      console.log(`[WALU] Upgrading IndexedDB from version ${event.oldVersion} to ${event.newVersion}`);
      if (!upgradeDb.objectStoreNames.contains(CACHE_STORE)) {
        console.log(`[WALU] Creating object store: ${CACHE_STORE}`);
        upgradeDb.createObjectStore(CACHE_STORE, { keyPath: 'path' });
      }
      if (!upgradeDb.objectStoreNames.contains(DOWNLOAD_STORE)) {
        console.log(`[WALU] Creating object store: ${DOWNLOAD_STORE}`);
        // Use a simple number key for chunk order
        upgradeDb.createObjectStore(DOWNLOAD_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
  });

  return dbPromise;
}

export async function clearStore(storeName: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject((event.target as IDBRequest).error);
  });
}

export async function writeToStore<T>(storeName: string, data: T): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
}

export async function readFromStore<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result as T | undefined);
        request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
}

export async function readAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = (event) => reject((event.target as IDBRequest).error);
  });
}
