import { WaluConfig } from "./config";
import { downloadUpdateBin, downloadVersionJson } from "./download";
import { checkIfValidSignature } from "./crypto";
import { logger } from "./logging";

/**
 * Updates WALU to the latest version available from the configured API endpoints.
 * This function checks for version differences, verifies signatures, and downloads
 * the update if a newer version is available. Development versions are skipped.
 * 
 * @param cfg - The WALU configuration object containing API endpoints and storage functions
 * @returns Promise that resolves when the update check and download (if needed) are complete
 * @throws {Error} If version download, signature verification, or file download fails
 */
export async function updateWalu(cfg: WaluConfig): Promise<void> {
  logger.info('Checking for updates...');
  const localVersion = await cfg.storageRead();
  logger.info('Current version:', localVersion ? localVersion.version : 'none');
  if (localVersion && localVersion.version === 'IN-DEV') return;
  const remoteVersion = await downloadVersionJson(cfg);
  logger.info('Remote version:', remoteVersion.version);
  if (remoteVersion.version === 'IN-DEV') return;
  if (localVersion && localVersion.version === remoteVersion.version) return;
  logger.info('Version mismatch. Checking signature...');
  await checkIfValidSignature(cfg, remoteVersion);
  logger.info('Signature is valid. Starting download...');
  await downloadUpdateBin(cfg, remoteVersion);
  logger.info('Update to version', remoteVersion.version, 'installed successfully.');
}
