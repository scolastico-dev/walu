import type { WaluConfig } from "./config";
import { registerCacheInterceptor } from "./worker";
import { updateWalu } from "./update";
import { clearStore, writeToStore, CACHE_STORE } from "./database";
import * as JSZip from "jszip";

export async function installWalu(cfg: WaluConfig): Promise<void> {
  await registerCacheInterceptor();
  await updateWalu(cfg);

  const version = await cfg.storageRead();
  if (!version) throw new Error('[WALU] No version installed after update.');

  cfg.downloadStatus('Preparing cache...', 0);
  await clearStore(CACHE_STORE);

  const zip = await JSZip.loadAsync(version.file);
  const files = Object.values(zip.files).filter(file => !file.dir);
  let processedFiles = 0;

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

  cfg.downloadStatus('Installation complete', 1);
}
