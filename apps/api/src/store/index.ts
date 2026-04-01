import type { AppConfig } from "../config.js";

import { MemoryStore } from "./memory-store.js";
import { PostgresStore } from "./postgres-store.js";
import { S3Store } from "./s3-store.js";
import type { DataStore } from "./types.js";

export function createStore(config: AppConfig): DataStore {
  if (config.POSTGRES_URL && config.NODE_ENV !== "test") {
    return new PostgresStore(config.POSTGRES_URL, config.DEFAULT_TRIAL_DAYS);
  }

  if (config.STORE_S3_BUCKET && config.STORE_S3_KEY && config.NODE_ENV !== "test") {
    return new S3Store(config.STORE_S3_BUCKET, config.STORE_S3_KEY, config.DEFAULT_TRIAL_DAYS);
  }

  return new MemoryStore(config.DEFAULT_TRIAL_DAYS, config.NODE_ENV !== "production");
}
