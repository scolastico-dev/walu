import { openDb, readFromStore, CACHE_STORE } from './database';

self.addEventListener('install', (event) => {
  console.log('[WALU] Service Worker installed.');
  // openDb is now imported and will handle creation/upgrades
  event.waitUntil(openDb());
});

self.addEventListener('activate', (event) => {
  console.log('[WALU] Service Worker activated.');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept GET requests for same-origin resources
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  console.log(`[WALU] Intercepting fetch request: ${url.pathname}`);

  event.respondWith(
    (async () => {
      try {
        // Use the imported readFromStore function
        const cachedResponse = await readFromStore(CACHE_STORE, url.pathname);

        if (cachedResponse && cachedResponse.blob) {
          console.log(`[WALU] Responding from cache: ${url.pathname}`);
          const headers = new Headers({
            'Content-Type': cachedResponse.blob.type,
            'Content-Length': cachedResponse.blob.size.toString(),
            'X-Cache-Source': 'Service-Worker-IndexedDB'
          });
          return new Response(cachedResponse.blob, { headers });
        }

        console.log(`[WALU] Cache miss, forwarding to network: ${url.pathname}`);
        return fetch(request);
      } catch (error) {
        console.error(`[WALU] An error occurred during fetch interception: ${error}`);
        // Fallback to network on any error
        return fetch(request);
      }
    })()
  );
});
