# PromptShield

PromptShield is a privacy-first GenAI data leak guard built as a TypeScript monorepo:

- `apps/api`: Fastify API, worker, auth, billing, and policy/event services
- `apps/web`: marketing site and admin console
- `apps/extension`: Chrome Manifest V3 extension
- `packages/core`: shared schemas, detectors, and policy engine
- `infra`: Docker, AWS, and deployment assets

## Quick start

1. Copy `.env.example` files into local `.env` files.
2. Start infrastructure:

```powershell
docker compose up -d postgres redis
```

3. Install dependencies and bootstrap:

```powershell
npm install
npm run build -w @promptshield/core
npm run seed -w @promptshield/api
```

4. Run the API and admin web app:

```powershell
npm run dev
```

5. Build the extension:

```powershell
npm run dev -w @promptshield/extension
```

Fresh extension installs now target the live PromptShield API by default:
`https://api.promptshieldapp.co.uk`

Additional setup, testing, and deployment instructions live in [docs/deployment.md](./docs/deployment.md) and [docs/testing.md](./docs/testing.md).

## Production prep

- Validate the production env file:

```powershell
npm run validate:prod-env
```

- Run a post-deploy smoke check:

```powershell
npm run smoke:deploy -- https://promptshield.example.com
```
