# PromptShield Architecture

## Monorepo layout

- `packages/core`: shared schemas, detectors, and policy engine.
- `apps/api`: Fastify API, auth, policy publishing, billing hooks, worker, and pluggable persistence.
- `apps/web`: Vite + React marketing site and admin console.
- `apps/extension`: Chrome Manifest V3 extension with local enforcement and event batching.
- `infra`: Docker, nginx, EC2 bootstrap, and production compose assets.

## Core runtime flow

1. An admin signs in with a magic link.
2. The admin console generates a short-lived device activation code.
3. The extension exchanges that code for a scoped session, bootstraps entitlement state, and syncs the latest published policy pack.
4. Content scripts classify text and file metadata locally against the shared deterministic rule engine.
5. The extension warns, redacts, requires justification, or blocks before the risky action leaves the browser.
6. Metadata-only events queue locally and upload in batch to the API.
7. The admin console reads overview, events, users/devices, policy state, and billing state from the same API.

## Persistence model

- Development and production use Postgres when `POSTGRES_URL` is set.
- Single-instance App Runner deployments can use an S3-backed snapshot store when `STORE_S3_BUCKET` and `STORE_S3_KEY` are set.
- Tests use the in-memory store for deterministic integration coverage.
- Policy rules, detector IDs, rule IDs, and file metadata are persisted as JSONB payloads.
- Raw prompt content is not stored by default.

## Billing and entitlement

- The web app starts Stripe Checkout through `/v1/billing/checkout`.
- Stripe webhooks update the mirrored billing state in `billing_accounts`.
- The extension and admin console consume entitlement state through bootstrap and admin APIs.
