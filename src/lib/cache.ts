import { WaluConfig } from "./config";
import { CACHE_STORE, clearStore, writeToStore } from "./database";
import { ICacheData } from "./types";
import { logger } from "./logging";
import * as JSZip from "jszip";

/**
 * Prepares the cache by extracting files from a ZIP archive and storing them in IndexedDB.
 * This function clears the existing cache, extracts all files from the provided ZIP data,
 * and stores each file as a blob in the cache store with progress tracking.
 * 
 * @param cfg - The WALU configuration object containing download status callback
 * @param data - The storage data containing the ZIP file to be cached
 * @returns A promise that resolves when the cache preparation is complete
 * @throws {Error} If the ZIP file cannot be loaded or processed
 */
export async function prepareCache(cfg: WaluConfig, data: ICacheData): Promise<void> {
  logger.info('Starting cache preparation...');
  cfg.downloadStatus('Preparing cache...', 0);
  await clearStore(CACHE_STORE);

  try {
    const zip = await JSZip.loadAsync(data.file);
    const files = Object.values(zip.files).filter(file => !file.dir);
    let processedFiles = 0;

    logger.info(`Cache preparation: Found ${files.length} files to process`);
    cfg.downloadStatus('Installing files to cache...', 0.1);
    
    for (const file of files) {
      const blob = await file.async('blob');
      const path = `/${file.name}`;
      await writeToStore(CACHE_STORE, { path, blob });

      processedFiles++;
      cfg.downloadStatus(
          `Installing files to cache: ${processedFiles}/${files.length}`,
          0.1 + (processedFiles / files.length) * 0.9
      );
    }

    logger.info(`Cache preparation completed successfully: ${processedFiles} files cached`);
    cfg.downloadStatus('Installation complete', 1);
  } catch (error) {
    logger.error('Cache preparation failed:', error);
    throw error;
  }
}
