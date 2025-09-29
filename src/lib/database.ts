import { logger } from "./logging";

/** The name of the IndexedDB database used by WALU */
export const DB_NAME = 'walu';

/** The name of the object store used for caching files */
export const CACHE_STORE = 'cache';

/** The name of the object store used for temporary download chunks */
export const DOWNLOAD_STORE = 'download';

/** The current version of the IndexedDB database schema */
export const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Opens a connection to the IndexedDB database and creates necessary object stores.
 * This function implements a singleton pattern to ensure only one database connection
 * is active at a time. It also handles database version upgrades automatically.
 * 
 * @returns Promise that resolves to the opened IndexedDB database instance
 * @throws {string} If the database cannot be opened or an error occurs
 */
export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    logger.info('Opening IndexedDB connection...');
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      logger.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
      dbPromise = null;
      reject('Error opening DB');
    };

    request.onsuccess = (event) => {
      logger.info('IndexedDB connection successful.');
      const db = (event.target as IDBOpenDBRequest).result;
      // Close the connection if the tab is closed
      db.onclose = () => {
        logger.info('IndexedDB connection closed.');
        dbPromise = null;
      };
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const upgradeDb = (event.target as IDBOpenDBRequest).result;
      logger.info(`Upgrading IndexedDB from version ${event.oldVersion} to ${event.newVersion}`);
      if (!upgradeDb.objectStoreNames.contains(CACHE_STORE)) {
        logger.info(`Creating object store: ${CACHE_STORE}`);
        upgradeDb.createObjectStore(CACHE_STORE, { keyPath: 'path' });
      }
      if (!upgradeDb.objectStoreNames.contains(DOWNLOAD_STORE)) {
        logger.info(`Creating object store: ${DOWNLOAD_STORE}`);
        // Use a simple number key for chunk order
        upgradeDb.createObjectStore(DOWNLOAD_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
  });

  return dbPromise;
}

/**
 * Clears all data from the specified IndexedDB object store.
 * 
 * @param storeName - The name of the object store to clear
 * @returns Promise that resolves when the store is cleared
 * @throws {any} If the clear operation fails
 */
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

/**
 * Writes data to the specified IndexedDB object store.
 * 
 * @template T - The type of data to write
 * @param storeName - The name of the object store to write to
 * @param data - The data object to store
 * @returns Promise that resolves when the data is written
 * @throws {any} If the write operation fails
 */
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

/**
 * Reads a single record from the specified IndexedDB object store by key.
 * 
 * @template T - The type of data to read
 * @param storeName - The name of the object store to read from
 * @param key - The key of the record to retrieve
 * @returns Promise that resolves to the stored data or undefined if not found
 * @throws {any} If the read operation fails
 */
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

/**
 * Reads all records from the specified IndexedDB object store.
 * 
 * @template T - The type of data to read
 * @param storeName - The name of the object store to read from
 * @returns Promise that resolves to an array of all stored records
 * @throws {any} If the read operation fails
 */
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
