import { logger } from "./logging";
import type { WaluConfig } from "./config";

/**
 * Reloads the application using the method specified in the configuration.
 * 
 * @param cfg - The optional WALU configuration object
 * @returns Promise that resolves if the reload is initiated (or if document.write finish)
 */
export async function reloadApp(cfg?: WaluConfig): Promise<void> {
  logger.info('Starting application reload...');
  const reloadMethod = cfg ? cfg.getReloadMethod() : 'document.write';

  if (reloadMethod === 'location.update') {
    try {
      // 1. Ensure the Service Worker is actively controlling the page
      if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
        logger.info('Waiting for Service Worker to take control...');
        await new Promise<void>((resolve) => {
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            resolve();
          }, { once: true });
        });
      }

      logger.info('Service Worker is controlling the page. Navigating to apply update...');
      
      // 2. Use location.href instead of location.reload()
      // This triggers a standard navigation request (which the SW heavily intercepts) 
      // rather than a "reload" action which some browsers handle weirdly with caches.
      window.location.href = window.location.pathname + window.location.search;
    } catch (error) {
      logger.error('Application reload failed:', error);
      throw error;
    }
    return;
  }

  // Default: document.write
  try {
    const index = await fetch('/index.html', { cache: 'no-store' });
    if (!index.ok) {
      logger.error(`Failed to fetch index.html: ${index.status} ${index.statusText}`);
      throw new Error('Failed to fetch index.html');
    }
    
    const text = await index.text();
    logger.info('Successfully fetched fresh index.html');
    
    try {
      logger.info('Attempting document.write reload method...');
      document.open();
      document.write(text);
      document.close();
      logger.info('Application reloaded successfully using document.write');
    } catch (e) {
      logger.warn('Document write failed:', e);
      logger.info('Using document.body fallback for reload...');
      
      const currentHeadElements = document.head.querySelectorAll('script, link[rel="stylesheet"], style');
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(text, 'text/html');
      const newBodyContent = newDoc.body.innerHTML;
      
      document.body.innerHTML = newBodyContent;
      currentHeadElements.forEach(el => {
        const clonedEl = el.cloneNode(true);
        document.body.appendChild(clonedEl);
      });
      document.head.innerHTML = '';
      
      logger.info('Application reloaded successfully using fallback method');
    }
  } catch (error) {
    logger.error('Application reload failed:', error);
    throw error;
  }
}
