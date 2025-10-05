import { openDb, writeToStore, readAllFromStore, clearStore, DOWNLOAD_STORE } from "./database";
import { WaluConfig } from "./config";
import { IDownloadChunk, IVersionFile } from "./types";
import { logger } from "./logging";
import * as CryptoJS from "crypto-js";

const fetchOptions: RequestInit = { method: 'GET', cache: 'no-store' };

async function downloadToDb(
  url: string,
  cfg: WaluConfig,
  statusMessage: string,
  progressMultiplier: number = 1
): Promise<void> {
  logger.info(`Starting download from: ${url}`);
  await openDb();
  await clearStore(DOWNLOAD_STORE);

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    logger.error(`Download failed: ${response.status} ${response.statusText} for URL: ${url}`);
    throw new Error(`[WALU] Failed to download: ${response.status} ${response.statusText}`);
  }

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  let loaded = 0;
  
  logger.info(`Download initiated: ${total > 0 ? `${total} bytes` : 'unknown size'}`);

  const reader = response.body?.getReader();
  if (!reader) {
    logger.error('Unable to read response body for URL:', url);
    throw new Error('[WALU] Unable to read response body');
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Write each chunk directly to IndexedDB
    await writeToStore<IDownloadChunk>(DOWNLOAD_STORE, { data: value });

    loaded += value.byteLength;
    if (total > 0) {
      cfg.downloadStatus(statusMessage, (loaded / total) * progressMultiplier);
    }
  }
  
  logger.info(`Download completed: ${loaded} bytes downloaded from ${url}`);
}

async function getDownloadedDataAsUint8Array(): Promise<Uint8Array> {
  logger.info('Reassembling downloaded data from chunks...');
  const chunks = await readAllFromStore<IDownloadChunk>(DOWNLOAD_STORE);
  chunks.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.data.byteLength, 0);
  logger.info(`Reassembling ${chunks.length} chunks, total size: ${totalLength} bytes`);
  
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk.data, offset);
    offset += chunk.data.byteLength;
  }

  await clearStore(DOWNLOAD_STORE);
  logger.info('Data reassembly completed');

  return result;
}

/**
 * Downloads and parses the version.json file from the configured API endpoint.
 * This function retrieves the version information including hash and signature
 * that are needed for update verification.
 * 
 * @param cfg - The WALU configuration containing API URLs and status callback
 * @returns Promise that resolves to the parsed version file object
 * @throws {Error} If the download fails or the JSON cannot be parsed
 */
export async function downloadVersionJson(cfg: WaluConfig): Promise<IVersionFile> {
  logger.info('Starting version.json download...');
  cfg.downloadStatus('Downloading version information...', 0);
  await downloadToDb(
    cfg.getApiUrls().versionJson,
    cfg,
    'Downloading version information...'
  );
  const data = await getDownloadedDataAsUint8Array();
  cfg.downloadStatus('Version information downloaded', 1);
  
  try {
    const jsonText = new TextDecoder().decode(data);
    const versionFile = JSON.parse(jsonText);
    logger.info(`Version.json downloaded successfully: version ${versionFile.version}`);
    return versionFile;
  } catch (error) {
    logger.error('Failed to parse version.json:', error);
    throw error;
  }
}

/**
 * Downloads the update.bin file from the configured API endpoint with integrity verification.
 * This function downloads the binary update file in chunks, verifies its hash matches
 * the expected value from the version file, and stores it for installation.
 * 
 * @param cfg - The WALU configuration containing API URLs and storage functions
 * @param version - The version file object containing the expected hash for verification
 * @returns Promise that resolves when the download and verification are complete
 * @throws {Error} If the download fails, hash verification fails, or storage fails
 */
export async function downloadUpdateBin(cfg: WaluConfig, version: IVersionFile): Promise<void> {
  logger.info(`Starting update.bin download for version ${version.version}...`);
  cfg.downloadStatus('Starting update file download...', 0);
  await downloadToDb(
    cfg.getApiUrls().updateBin,
    cfg,
    'Downloading update file...',
    0.8 // 80% for download
  );

  cfg.downloadStatus('Verifying file integrity...', 0.8);
  logger.info('Starting hash verification of downloaded file...');

  // Reassemble the file from IndexedDB for verification
  const data = await getDownloadedDataAsUint8Array();
  const blob = new Blob([data as any]);

  const wordArray = CryptoJS.lib.WordArray.create(data.buffer as any);
  const fileHash = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
  logger.info(`Computed file hash: ${fileHash}`);
  const computedHash = CryptoJS.SHA256(fileHash + version.version).toString(CryptoJS.enc.Hex);

  if (computedHash !== version.hash) {
    logger.error(`Hash verification failed: expected ${version.hash}, got ${computedHash}`);
    throw new Error('[WALU] Hash mismatch. Downloaded file is corrupted.');
  }
  
  logger.info('Hash verification successful');
  cfg.downloadStatus('Saving update file...', 0.9);
  
  try {
    await cfg.storageWrite({ ...version, file: blob });
    logger.info(`Update.bin saved successfully for version ${version.version}`);
    cfg.downloadStatus('Update file ready', 1);
  } catch (error) {
    logger.error('Failed to save update file:', error);
    throw error;
  }
}
