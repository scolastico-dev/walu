import type { WaluConfig } from "./config";
import { registerCacheInterceptor } from "./worker";
import { prepareCache } from "./cache";
import { checkIfValidSignature } from "./crypto";
import * as JSZip from "jszip";
import { reloadApp } from "./reload";

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
  console.log('[WALU] Asking for update bundle...');
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
  console.log('[WALU] Extracting version.json from bundle...');
  const zip = await JSZip.loadAsync(file);
  if (!zip.file('version.json')) throw new Error('[WALU] Invalid bundle: version.json not found.');
  if (!zip.file('update.bin')) throw new Error('[WALU] Invalid bundle: update.bin not found.');
  const versionFile = await zip.file('version.json').async('string');
  const remoteVersion = JSON.parse(versionFile);
  console.log('[WALU] Checking signature...');
  await checkIfValidSignature(cfg, remoteVersion);

  console.log('[WALU] Storing update file...');
  await cfg.storageWrite({
    ...remoteVersion,
    file: new Blob([
      await zip.file('update.bin').async('arraybuffer')
    ], { type: 'application/octet-stream' }),
  });
  console.log('[WALU] Update to version', remoteVersion.version, 'installed successfully.');

  console.log('[WALU] Starting service worker and preparing cache...');
  await registerCacheInterceptor();
  const version = await cfg.storageRead();
  if (!version) throw new Error('[WALU] No version installed after update.');
  await prepareCache(cfg, version);
  console.log('[WALU] Installation complete.');
  await reloadApp();
}
