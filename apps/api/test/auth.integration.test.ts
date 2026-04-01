import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { loadConfig } from "../src/config.js";
import { createApp } from "../src/server.js";
import { MemoryStore } from "../src/store/memory-store.js";

describe("auth and admin flow", () => {
  const config = loadConfig({
    ...process.env,
    NODE_ENV: "test",
    JWT_SECRET: "promptshield-test-secret-12345",
    ENABLE_DEV_MAGIC_LINK_PREVIEW: "true"
  });
  const store = new MemoryStore(14);
  let app: Awaited<ReturnType<typeof createApp>>;

  beforeAll(async () => {
    await store.initialize();
    app = await createApp(config, store);
  });

  afterAll(async () => {
    await app.close();
  });

  it("creates a session from a magic link and reads overview", async () => {
    const requestLink = await app.inject({
      method: "POST",
      url: "/v1/auth/magic-links",
      payload: {
        email: "owner@example.com",
        orgName: "Example Org"
      }
    });

    expect(requestLink.statusCode).toBe(202);
    const previewUrl = requestLink.json().previewUrl as string;
    const token = new URL(previewUrl).searchParams.get("token");
    expect(token).toBeTruthy();

    const sessionResponse = await app.inject({
      method: "POST",
      url: "/v1/auth/session",
      payload: {
        magicToken: token
      }
    });

    expect(sessionResponse.statusCode).toBe(200);
    const session = sessionResponse.json();
    expect(session.organization.name).toBe("Example Org");

    const overviewResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/overview",
      headers: {
        authorization: `Bearer ${session.accessToken}`
      }
    });

    expect(overviewResponse.statusCode).toBe(200);
    expect(overviewResponse.json().organization.name).toBe("Example Org");
  });
});
