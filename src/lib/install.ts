import type { WaluConfig } from "./config";
import { registerCacheInterceptor } from "./worker";
import { updateWalu } from "./update";
import { prepareCache } from "./cache";
import { reloadApp } from "./reload";

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
  await registerCacheInterceptor(cfg);
  await updateWalu(cfg).catch(err => console.warn('[WALU] Update skipped:', err));
  const version = await cfg.storageRead();
  if (!version) throw new Error('[WALU] No version installed after update.');
  await prepareCache(cfg, version);
  await reloadApp();
}
