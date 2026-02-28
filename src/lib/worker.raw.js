import { openDb, readFromStore, CACHE_STORE, STORAGE_STORE } from './database';
import { logger } from './logging';

self.addEventListener('install', (event) => {
  logger.info('Service Worker installed.');
  // openDb is now imported and will handle creation/upgrades
  event.waitUntil(openDb());
});

self.addEventListener('activate', (event) => {
  logger.info('Service Worker activated.');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept GET requests for same-origin resources
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  logger.info(`Intercepting fetch request: ${url.pathname}`);

  event.respondWith(
    (async () => {
      try {
        // Use the imported readFromStore function
        const cachedResponse = await readFromStore(CACHE_STORE, url.pathname);

        if (cachedResponse && cachedResponse.blob) {
          logger.info(`Responding from cache: ${url.pathname}`);
          const headers = new Headers({
            'Content-Type': cachedResponse.blob.type,
            'Content-Length': cachedResponse.blob.size.toString(),
            'X-Cache-Source': 'Service-Worker-IndexedDB'
          });
          return new Response(cachedResponse.blob, { headers });
        }

        // --- Cache Miss Handling ---
        logger.info(`Cache miss: ${url.pathname}`);

        // Try to load cacheMissDocument configured in storage
        const cacheMissDocEntry = await readFromStore(STORAGE_STORE, 'cacheMissDocument');
        if (cacheMissDocEntry && typeof cacheMissDocEntry.value === 'string') {
          const missPath = cacheMissDocEntry.value.startsWith('/') 
            ? cacheMissDocEntry.value 
            : `/${cacheMissDocEntry.value}`;
          
          logger.info(`Attempting to load cacheMissDocument: ${missPath}`);
          const missResponse = await readFromStore(CACHE_STORE, missPath);
          
          if (missResponse && missResponse.blob) {
            logger.info(`Responding with cacheMissDocument: ${missPath}`);
            const headers = new Headers({
              'Content-Type': missResponse.blob.type || 'text/html',
              'Content-Length': missResponse.blob.size.toString(),
              'X-Cache-Source': 'Service-Worker-IndexedDB-Fallback'
            });
            return new Response(missResponse.blob, { headers, status: 200 });
          } else {
            logger.warn(`Configured cacheMissDocument not found in cache: ${missPath}`);
          }
        }

        logger.info(`Forwarding to network: ${url.pathname}`);
        return fetch(request);
      } catch (error) {
        logger.error(`An error occurred during fetch interception: ${error}`);
        // Fallback to network on any error
        return fetch(request);
      }
    })()
  );
});
