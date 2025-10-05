import type { WaluConfig } from "./config";
import { registerCacheInterceptor } from "./worker";
import { prepareCache } from "./cache";
import { checkIfValidSignature } from "./crypto";
import { reloadApp } from "./reload";
import { logger } from "./logging";
import * as JSZip from "jszip";

/**
 * Shows a file dialog to allow users to manually install a WALU update bundle.
 * This function prompts the user to select a .bundle file, validates its contents,
 * verifies the signature, stores the update, and prepares the cache.
 * 
 * @param cfg - The WALU configuration object
 * @returns Promise that resolves when the installation is complete
 * @throws {Error} If no file is selected, the bundle is invalid, signature verification fails, or installation fails
 */
export async function showInstallDialog(cfg: WaluConfig): Promise<void> {
  logger.info('Asking for update bundle...');
  let file: File | null = null;
  await new Promise<void>((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.bundle';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.onchange = async () => {
      if (input.files && input.files.length > 0) {
        file = input.files[0];
        const reader = new FileReader();
        reader.onload = async () => {
          if (reader.result && reader.result instanceof ArrayBuffer) {
            try {
              resolve();
            } catch (e) {
              reject(e);
            } finally {
              document.body.removeChild(input);
            }
          } else {
            reject(new Error('[WALU] Failed to read file.'));
            document.body.removeChild(input);
          }
        };
        reader.onerror = () => {
          reject(new Error('[WALU] Failed to read file.'));
          document.body.removeChild(input);
        };
        reader.readAsArrayBuffer(file);
      } else {
        reject(new Error('[WALU] No file selected.'));
        document.body.removeChild(input);
      }
    };
    input.click();
  });

  if (!file) throw new Error('[WALU] No file selected after dialog.');
  logger.info('Extracting version.json from bundle...');
  const zip = await JSZip.loadAsync(file);
  if (!zip.file('version.json')) throw new Error('[WALU] Invalid bundle: version.json not found.');
  if (!zip.file('update.bin')) throw new Error('[WALU] Invalid bundle: update.bin not found.');
  const versionFile = await zip.file('version.json').async('string');
  const updateBinFile = await zip.file('update.bin').async('arraybuffer');
  const remoteVersion = JSON.parse(versionFile);
  logger.info('Checking signature...');
  await checkIfValidSignature(cfg, remoteVersion);

  logger.info('Verifying file integrity...');
  const wordArray = CryptoJS.lib.WordArray.create(updateBinFile);
  const fileHash = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
  const computedHash = CryptoJS.SHA256(fileHash + remoteVersion.version).toString(CryptoJS.enc.Hex);

  if (computedHash !== remoteVersion.hash) {
    logger.error(`Hash verification failed: expected ${remoteVersion.hash}, got ${computedHash}`);
    throw new Error('[WALU] Hash mismatch. Bundle file is corrupted.');
  }
  logger.info('Hash verification successful.');

  logger.info('Storing update file...');
  await cfg.storageWrite({
    ...remoteVersion,
    file: new Blob([updateBinFile], { type: 'application/octet-stream' }),
  });
  logger.info('Update to version', remoteVersion.version, 'installed successfully.');

  logger.info('Preparing cache...');
  const version = await cfg.storageRead();
  if (!version) throw new Error('[WALU] No version installed after update.');
  await prepareCache(cfg, version);
  logger.info('Registering cache interceptor...');
  await registerCacheInterceptor(cfg);
  logger.info('Installation complete.');
  await reloadApp();
}
