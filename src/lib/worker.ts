/**
 * Registers a Service Worker that intercepts HTTP requests and serves cached files from IndexedDB.
 * This function creates a Service Worker from the inline worker code, registers it with the browser,
 * and returns the registration. If a Service Worker is already active, it returns the existing registration.
 * 
 * @param cfg - The WALU configuration object
 * @returns Promise that resolves to the Service Worker registration
 * @throws {Error} If Service Workers are not supported, registration fails, or existing registration cannot be retrieved
 */
export async function registerCacheInterceptor(cfg: WaluConfig): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) throw new Error('[WALU] Service Workers are not supported in this browser.');
  if (navigator.serviceWorker.controller) {
    console.log('[WALU] A service worker is already running and controlling this page.');
    const worker = await navigator.serviceWorker.getRegistration();
    if (!worker) throw new Error('[WALU] Failed to get existing service worker registration.');
    return worker;
  }

  try {
    console.log('[WALU] Registering cache interceptor service worker...');
    const registration = await navigator.serviceWorker.register(cfg.getWorkerPath(), { scope: './' });
    console.log('[WALU] Service Worker registered successfully:', registration);
    return registration;
  } catch (error) {
    console.error('[WALU] Service Worker registration failed...');
    throw error;
  }
}

// @ts-ignore
import swSrc from 'bundle-text:./worker.raw.js';
import { WaluConfig } from './config';
export const SERVICE_WORKER_SOURCE = swSrc;
