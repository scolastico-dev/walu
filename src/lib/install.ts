import type { WaluConfig } from "./config";
import { registerCacheInterceptor } from "./worker";
import { updateWalu } from "./update";
import { prepareCache } from "./cache";
import { reloadApp } from "./reload";
import { logger } from "./logging";

/**
 * Installs WALU by registering the cache interceptor, updating to the latest version,
 * and preparing the cache with the downloaded files. This is the main entry point
 * for setting up WALU in a web application.
 * 
 * @param cfg - The WALU configuration object
 * @returns Promise that resolves when the installation is complete
 * @throws {Error} If service worker registration, update, or cache preparation fails
 */
export async function installWalu(cfg: WaluConfig): Promise<void> {
  logger.info('Starting WALU installation...');
  
  try {
    logger.info('Checking for updates...');
    await updateWalu(cfg).catch(err => logger.warn('Update skipped:', err));

    const version = await cfg.storageRead();
    if (!version) {
      logger.error('No version found after update attempt');
      throw new Error('[WALU] No version installed after update.');
    }

    logger.info(`Preparing cache for version ${version.version}...`);
    await prepareCache(cfg, version);

    logger.info('Registering cache interceptor...');
    await registerCacheInterceptor(cfg);

    logger.info('Reloading application...');
    await reloadApp(cfg);

    logger.info('WALU installation completed successfully');
  } catch (error) {
    logger.error('WALU installation failed:', error);
    throw error;
  }
}
