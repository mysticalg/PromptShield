import { loadConfig } from "./config.js";
import { createApp } from "./server.js";
import { createStore } from "./store/index.js";

async function main() {
  const config = loadConfig();
  const store = createStore(config);
  await store.initialize();
  const app = await createApp(config, store);
  await app.listen({
    port: config.PORT,
    host: "0.0.0.0"
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
