import type { WaluConfig } from "./config";
import { registerCacheInterceptor } from "./worker";
import { updateWalu } from "./update";
import { prepareCache } from "./cache";

export async function installWalu(cfg: WaluConfig): Promise<void> {
  await registerCacheInterceptor();
  await updateWalu(cfg);
  const version = await cfg.storageRead();
  if (!version) throw new Error('[WALU] No version installed after update.');
  await prepareCache(cfg, version);
}
