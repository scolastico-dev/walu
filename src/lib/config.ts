import { IApiUrls, IStorageData } from "./types";

export class WaluConfig {
  protected readonly publicKey: string;
  protected readonly apiUrls: IApiUrls;
  protected readonly storageReadFunction: () => Promise<IStorageData | null>;
  protected readonly storageWriteFunction: (data: IStorageData) => Promise<void>;
  protected readonly downloadStatusFunction: (msg: string, progress: number) => void = () => {};

  constructor(
    protected readonly config: {
      publicKey: typeof WaluConfig.prototype.publicKey,
      apiUrls: typeof WaluConfig.prototype.apiUrls | string,
      storageReadFunction?: typeof WaluConfig.prototype.storageReadFunction,
      storageWriteFunction?: typeof WaluConfig.prototype.storageWriteFunction,
      downloadStatusFunction?: typeof WaluConfig.prototype.downloadStatusFunction,
    }
  ) {
    if (typeof config.apiUrls === 'string') {
      const base = config.apiUrls.endsWith('/') ? config.apiUrls : config.apiUrls + '/';
      this.apiUrls = {
        versionJson: base + 'version.json',
        updateBin: base + 'update.bin',
      };
    } else this.apiUrls = config.apiUrls;
    this.publicKey = config.publicKey;
    this.storageReadFunction = config.storageReadFunction ?? (async () => {
      const res = localStorage.getItem("walu-storage");
      if (!res) return null;
      try {
        const parsed = JSON.parse(res);
        if (!parsed.file || !parsed.version || !parsed.signature) return null;
        return {
          ...parsed,
          file: new Blob([new Uint8Array(Object.values(parsed.file.data))], { type: parsed.file.type }),
        };
      } catch {
        return null;
      }
    });
    this.storageWriteFunction = config.storageWriteFunction ?? (async (data) => {
      localStorage.setItem("walu-storage", JSON.stringify({
        ...data,
        file: { data: Array.from(new Uint8Array(data.file as any)), type: data.file.type },
      }));
    });
    this.downloadStatusFunction = config.downloadStatusFunction ?? (() => {});
  }

  getPublicKey() { return this.publicKey; }
  storageRead() { return this.storageReadFunction(); }
  storageWrite(data: IStorageData) { return this.storageWriteFunction(data); }
  downloadStatus(msg: string, progress: number) { return this.downloadStatusFunction(msg, progress); }
  getApiUrls() { return this.apiUrls; }
}
