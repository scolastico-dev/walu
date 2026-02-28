/**
 * Represents a version file containing metadata about an update.
 * This interface defines the structure of the version.json file that
 * contains version information and cryptographic verification data.
 */
export interface IVersionFile {
  /** The version string identifier */
  version: string;
  /** Base64-encoded RSA signature for verification */
  signature: string;
  /** Base64-encoded SHA-256 hash of the update file */
  hash: string;
}

/**
 * Extends IVersionFile with the actual update file data.
 * This interface represents the complete storage data that includes
 * both metadata and the binary update content.
 */
export interface ICacheData extends IVersionFile {
  /** The binary update file as a Blob */
  file: Blob;
}

/**
 * Represents a key-value pair for storage operations.
 * Used for storing the current version and update file in IndexedDB,
 * as well as making config data available to the service worker.
 */
export interface IStorageData {
  key: string;
  value: string | Blob;
}

/**
 * Represents a cached file record in IndexedDB.
 * Each record contains a file path and its corresponding binary data.
 */
export interface ICacheRecord {
  /** The file path used as the cache key */
  path: string;
  /** The file content as a Blob */
  blob: Blob;
}

/**
 * Configuration object for API endpoints.
 * Defines the URLs used to fetch version information and update files.
 * **Note: Some servers or cdn's like to cache small static json files, this results in
 * hash mismatches. To prevent this, we recommend adding a query parameter with a timestamp or
 * random string to the versionJson and updateBin urls. For example: https://example.com/version.json?t=1234567890**
 */
export interface IApiUrls {
  /** URL to the version.json endpoint */
  versionJson: string;
  /** URL to the update.bin endpoint */
  updateBin: string;
}

/**
 * Represents a chunk of downloaded data.
 * Each chunk contains an optional identifier and the binary data as a Uint8Array.
 */
export interface IDownloadChunk {
  id?: number;
  data: Uint8Array;
}

/**
 * Defines the method used to reload the application after an update.
 * - 'document.write': Replaces the entire document content with fresh index.html
 * - 'location.update': Triggers a standard navigation to the current URL
 */
export type ReloadMethod = 'document.write' | 'location.update';
