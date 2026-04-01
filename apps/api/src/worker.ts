import { loadConfig } from "./config.js";
import { createStore } from "./store/index.js";

async function main() {
  const config = loadConfig();
  const store = createStore(config);
  await store.initialize();

  console.log("PromptShield worker started");

  setInterval(async () => {
    try {
      await store.cleanupExpiredRecords();
    } catch (error) {
      console.error("Worker cleanup failed", error);
    }
  }, 60_000);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
