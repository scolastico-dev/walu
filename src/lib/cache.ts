import { WaluConfig } from "./config";
import { CACHE_STORE, clearStore, writeToStore } from "./database";
import { IStorageData } from "./types";
import * as JSZip from "jszip";

export async function prepareCache(cfg: WaluConfig, data: IStorageData): Promise<void> {
  cfg.downloadStatus('Preparing cache...', 0);
  await clearStore(CACHE_STORE);

  const zip = await JSZip.loadAsync(data.file);
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
