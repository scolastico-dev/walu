import { WaluConfig } from "./config";
import { downloadUpdateBin, downloadVersionJson } from "./download";
import { checkIfValidSignature } from "./crypto";

export async function updateWalu(cfg: WaluConfig): Promise<void> {
  try {
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
  } catch (e) {
    console.error('[WALU] Update failed:', e);
    throw e;
  }
}
