const baseUrl = process.argv[2] ?? process.env.PROMPTSHIELD_BASE_URL;
const apiUrl = process.argv[3] ?? process.env.PROMPTSHIELD_API_URL ?? (baseUrl ? `${baseUrl.replace(/\/$/, "")}/api` : "");
const smokeEmail = process.env.PROMPTSHIELD_SMOKE_EMAIL ?? "";

if (!baseUrl) {
  console.error("Usage: node infra/scripts/smoke-check.mjs <baseUrl> [apiUrl]");
  process.exit(1);
}

async function ensureOk(label, url, init) {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${label} failed (${response.status}): ${body}`);
  }
  console.log(`ok: ${label}`);
  return response;
}

await ensureOk("web root", baseUrl);
await ensureOk("api health", `${apiUrl}/health`);
await ensureOk("api openapi", `${apiUrl}/openapi.json`);

if (smokeEmail) {
  await ensureOk("magic link request", `${apiUrl}/v1/auth/magic-links`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      email: smokeEmail,
      orgName: "PromptShield Smoke"
    })
  });
}

console.log("Smoke check complete.");

