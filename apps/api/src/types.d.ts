import type { AppConfig } from "./config.js";
import type { AuthContext, DataStore } from "./store/types.js";

declare module "fastify" {
  interface FastifyInstance {
    config: AppConfig;
    store: DataStore;
  }

  interface FastifyRequest {
    auth?: AuthContext;
  }
}
