import { openDb, readFromStore, CACHE_STORE } from './database';

// Simple logging system for Service Worker
const LOG_LEVEL_KEY = 'walu-log-level';
const DEFAULT_LOG_LEVEL = 'INFO';

function getLogLevel() {
  try {
    const stored = self.clients && self.clients.matchAll 
      ? null // In service worker context, we can't access sessionStorage directly
      : sessionStorage?.getItem(LOG_LEVEL_KEY);
    if (stored && ['NONE', 'ERROR', 'WARN', 'INFO'].includes(stored)) {
      return stored;
    }
  } catch (e) {
    // sessionStorage might not be available
  }
  return DEFAULT_LOG_LEVEL;
}

function shouldLog(level) {
  const currentLevel = getLogLevel();
  
  if (currentLevel === 'NONE') return false;
  if (currentLevel === 'ERROR') return level === 'ERROR';
  if (currentLevel === 'WARN') return level === 'ERROR' || level === 'WARN';
  if (currentLevel === 'INFO') return level === 'ERROR' || level === 'WARN' || level === 'INFO';
  
  return false;
}

const logger = {
  error: (message, ...args) => {
    if (shouldLog('ERROR')) {
      console.error(`[WALU] ${message}`, ...args);
    }
  },
  warn: (message, ...args) => {
    if (shouldLog('WARN')) {
      console.warn(`[WALU] ${message}`, ...args);
    }
  },
  info: (message, ...args) => {
    if (shouldLog('INFO')) {
      console.log(`[WALU] ${message}`, ...args);
    }
  }
};

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

        logger.info(`Cache miss, forwarding to network: ${url.pathname}`);
        return fetch(request);
      } catch (error) {
        logger.error(`An error occurred during fetch interception: ${error}`);
        // Fallback to network on any error
        return fetch(request);
      }
    })()
  );
});
