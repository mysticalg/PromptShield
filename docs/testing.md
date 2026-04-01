# Testing Guide

## Automated coverage

- `npm run typecheck`: TypeScript verification across core, API, web, and extension.
- `npm test`: shared policy-engine unit tests plus API integration coverage.
- `npm run build`: production builds for the API, web app, and extension.

## Local stack

1. Copy `.env.example` to `.env` and keep the default PromptShield ports (`5433` and `6380`) unless you explicitly want different ones.
2. Start dependencies:

```powershell
docker compose up -d postgres redis
```

3. Seed the API schema:

```powershell
npm run seed -w @promptshield/api
```

4. Start the API and web UI:

```powershell
npm run dev
```

5. Build the extension in watch mode:

```powershell
npm run dev -w @promptshield/extension
```

6. Load `apps/extension/dist` as an unpacked extension in Chrome.

## Extension production defaults

- Fresh installs now default to `https://api.promptshieldapp.co.uk`.
- If you need a local API during development, change it from the extension options page.
- To restore the live production target, use `Use production defaults` in the options page.

## Extension release packaging

- Build the production extension:

```powershell
npm run build -w @promptshield/extension
```

- Create a release zip for handoff or store submission:

```powershell
npm run package:release -w @promptshield/extension
```

- The packaged artifact is written to:
  `apps/extension/releases/promptshield-extension-0.1.0.zip`

## Manual regression suite

- Request a magic link and verify the login flow.
- Generate an activation code in the admin console and connect the extension.
- Paste an API key into `chatgpt.com` and confirm the extension blocks it.
- Paste an email address and confirm the extension redacts it.
- Submit a customer ID and confirm the extension asks for justification.
- Upload a `.env` or `.pem` file and confirm the extension blocks it.
- Confirm the event appears in the admin console and CSV export excludes raw content.
- Exercise a billing action with Stripe configured or mock checkout fallback.
