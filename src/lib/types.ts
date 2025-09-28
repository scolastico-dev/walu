export interface IVersionFile {
  version: string;
  signature: string;
  hash: string;
}

export interface IStorageData extends IVersionFile {
  file: Blob;
}

export interface ICacheRecord {
  path: string;
  blob: Blob;
}

export interface IApiUrls {
  versionJson: string;
  updateBin: string;
}
