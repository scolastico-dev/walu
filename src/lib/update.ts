import { WaluConfig } from "./config";
import { downloadUpdateBin, downloadVersionJson } from "./download";
import { checkIfValidSignature } from "./crypto";

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
  console.log('[WALU] Checking for updates...');
  const localVersion = await cfg.storageRead();
  console.log('[WALU] Current version:', localVersion ? localVersion.version : 'none');
  if (localVersion && localVersion.version === 'IN-DEV') return;
  const remoteVersion = await downloadVersionJson(cfg);
  console.log('[WALU] Remote version:', remoteVersion.version);
  if (remoteVersion.version === 'IN-DEV') return;
  if (localVersion && localVersion.version === remoteVersion.version) return;
  console.log('[WALU] Version mismatch. Checking signature...');
  await checkIfValidSignature(cfg, remoteVersion);
  console.log('[WALU] Signature is valid. Starting download...');
  await downloadUpdateBin(cfg, remoteVersion);
  console.log('[WALU] Update to version', remoteVersion.version, 'installed successfully.');
}
