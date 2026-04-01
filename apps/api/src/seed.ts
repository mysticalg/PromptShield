import { loadConfig } from "./config.js";
import { createStore } from "./store/index.js";

async function main() {
  const config = loadConfig();
  const store = createStore(config);
  await store.initialize();
  console.log("PromptShield seed complete");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
