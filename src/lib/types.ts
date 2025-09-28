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
export interface IStorageData extends IVersionFile {
  /** The binary update file as a Blob */
  file: Blob;
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
