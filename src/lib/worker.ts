/**
 * Registers a Service Worker that intercepts HTTP requests and serves cached files from IndexedDB.
 * This function creates a Service Worker from the inline worker code, registers it with the browser,
 * and returns the registration. If a Service Worker is already active, it returns the existing registration.
 * 
 * @returns Promise that resolves to the Service Worker registration
 * @throws {Error} If Service Workers are not supported, registration fails, or existing registration cannot be retrieved
 */
export async function registerCacheInterceptor(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) throw new Error('[WALU] Service Workers are not supported in this browser.');
  if (navigator.serviceWorker.controller) {
    console.log('[WALU] A service worker is already running and controlling this page.');
    const worker = await navigator.serviceWorker.getRegistration();
    if (!worker) throw new Error('[WALU] Failed to get existing service worker registration.');
    return worker;
  }

  try {
    // @ts-ignore
    const swWorkerCode = await import('bundle-text:./worker.raw.js');
    const swBlob = new Blob([swWorkerCode], { type: 'application/javascript' });
    const swUrl = URL.createObjectURL(swBlob).replace('blob:', '');
    console.log('[WALU] Registering cache interceptor service worker...');
    const registration = await navigator.serviceWorker.register(swUrl, { scope: '/' });
    URL.revokeObjectURL(swUrl);
    console.log('[WALU] Service Worker registered successfully:', registration);
    return registration;
  } catch (error) {
    console.error('[WALU] Service Worker registration failed...');
    throw error;
  }
}
