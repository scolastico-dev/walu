import { logger } from "./logging";

export async function reloadApp(): Promise<void> {
  logger.info('Starting application reload...');
  
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
