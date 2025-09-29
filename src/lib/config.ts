import { IApiUrls, ICacheData, IStorageData } from "./types";
import { logger } from "./logging";
import { STORAGE_STORE, writeToStore, readFromStore, openDb } from "./database";

/**
 * Configuration class for WALU.
 * Manages API URLs, storage functions, and cryptographic verification settings.
 * Provides a centralized configuration interface for all WALU operations.
 */
export class WaluConfig {
  protected readonly workerPath: string;
  protected readonly publicKey: string;
  protected readonly apiUrls: IApiUrls;
  protected readonly storageReadFunction: () => Promise<ICacheData | null>;
  protected readonly storageWriteFunction: (data: ICacheData) => Promise<void>;
  protected readonly downloadStatusFunction: (msg: string, progress: number) => Promise<void> = async () => {};

  /**
   * Creates a new WaluConfig instance with the specified configuration options.
   * 
   * @param config - Configuration object containing all necessary settings
   * @param config.workerPath - Path to the service worker script
   * @param config.publicKey - RSA public key in PEM format for signature verification
   * @param config.apiUrls - API URLs object or base URL string for version and update endpoints
   * @param config.storageReadFunction - Optional custom function to read storage data
   * @param config.storageWriteFunction - Optional custom function to write storage data
   * @param config.downloadStatusFunction - Optional callback for download progress updates
   */
  constructor(
    protected readonly config: {
      workerPath: typeof WaluConfig.prototype.workerPath,
      publicKey: typeof WaluConfig.prototype.publicKey,
      apiUrls: typeof WaluConfig.prototype.apiUrls | string,
      storageReadFunction?: typeof WaluConfig.prototype.storageReadFunction,
      storageWriteFunction?: typeof WaluConfig.prototype.storageWriteFunction,
      downloadStatusFunction?: typeof WaluConfig.prototype.downloadStatusFunction,
    }
  ) {
    logger.info('Initializing WALU configuration...');
    this.workerPath = config.workerPath;
    this.publicKey = config.publicKey;
    
    if (typeof config.apiUrls === 'string') {
      const base = config.apiUrls.endsWith('/') ? config.apiUrls : config.apiUrls + '/';
      this.apiUrls = {
        versionJson: base + 'version.json',
        updateBin: base + 'update.bin',
      };
      logger.info(`API URLs configured from base: ${config.apiUrls}`);
    } else {
      this.apiUrls = config.apiUrls;
      logger.info('API URLs configured from object');
    }
    
    this.storageReadFunction = config.storageReadFunction ?? (async () => {
      await openDb();
      const [version, file] = await Promise.all([
        readFromStore<IStorageData>(STORAGE_STORE, 'version'),
        readFromStore<IStorageData>(STORAGE_STORE, 'file'),
      ]);
      if (!version || !file) return null;
      try {
        const parsed = JSON.parse(version.value as string);
        if (!parsed.file || !parsed.version || !parsed.signature) {
          logger.warn('Invalid storage data found, missing required fields');
          return null;
        }
        return { ...parsed, file: file.value as Blob };
      } catch (error) {
        logger.warn('Failed to parse storage data:', error);
        return null;
      }
    });
    
    this.storageWriteFunction = config.storageWriteFunction ?? (async (data) => {
      try {
        await openDb();
        await Promise.all([
          writeToStore<IStorageData>(STORAGE_STORE, {
            key: 'version',
            value: JSON.stringify({ ...data, file: undefined })
          }),
          writeToStore<IStorageData>(STORAGE_STORE, {
            key: 'file',
            value: data.file
          }),
        ]);
        logger.info('Storage data written successfully');
      } catch (error) {
        logger.error('Failed to write storage data:', error);
        throw error;
      }
    });
    
    this.downloadStatusFunction = config.downloadStatusFunction ?? (async () => {});
    logger.info('WALU configuration initialized successfully');
  }

  /**
   * Gets the path to the service worker script.
   * 
   * @returns The worker path as a string
   */
  getWorkerPath() { return this.workerPath; }

  /**
   * Gets the RSA public key used for signature verification.
   * 
   * @returns The public key in PEM format
   */
  getPublicKey() { return this.publicKey; }
  
  /**
   * Gets the API URLs configuration.
   * 
   * @returns The API URLs object containing version and update endpoints
   */
  getApiUrls() { return this.apiUrls; }
  
  /**
   * Reads storage data using the configured storage read function.
   * 
   * @returns Promise resolving to the stored data or null if no data exists
   */
  storageRead(): Promise<ICacheData | null> { return this.storageReadFunction(); }
  
  /**
   * Writes storage data using the configured storage write function.
   * 
   * @param data - The storage data to write
   * @returns Promise that resolves when the data is written
   */
  storageWrite(data: ICacheData): Promise<void> { return this.storageWriteFunction(data); }
  
  /**
   * Reports download status using the configured status function.
   * 
   * @param msg - Status message to display
   * @param progress - Progress value between 0 and 1
   */
  downloadStatus(msg: string, progress: number): Promise<void> { return this.downloadStatusFunction(msg, progress); }
}
