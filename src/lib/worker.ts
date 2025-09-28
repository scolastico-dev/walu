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
    const swUrl = URL.createObjectURL(swBlob);
    console.log('[WALU] Registering cache interceptor service worker...');
    const registration = await navigator.serviceWorker.register(swUrl);
    URL.revokeObjectURL(swUrl);
    console.log('[WALU] Service Worker registered successfully:', registration);
    return registration;
  } catch (error) {
    console.error('[WALU] Service Worker registration failed...');
    throw error;
  }
}
