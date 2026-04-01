# Deployment Guide

## Environment model

- `dev`: local Docker services for Postgres and Redis, with the API and web app run from source.
- `staging`: production-shaped AWS host or VM with the production compose file, but scrubbed test data only.
- `pilot`: same production topology with limited customer tenants and feature flags.
- `production`: EC2-first deployment with nginx, Docker Compose, Postgres, Redis, API, worker, and static web container.

## Required configuration

Copy `infra/aws/.env.prod.example` to `infra/aws/.env.prod` and set:

- `JWT_SECRET`
- one storage backend:
  - `POSTGRES_URL` and `POSTGRES_PASSWORD`
  - `STORE_S3_BUCKET` and `STORE_S3_KEY` for single-instance App Runner deployments
- `API_BASE_URL`
- `WEB_BASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_TEAM`
- `STRIPE_PRICE_ENTERPRISE`
- one email delivery mode:
  - `EMAIL_PROVIDER=ses`, `SMTP_FROM`, and `SES_REGION` for App Runner IAM-role-based SES delivery
  - `EMAIL_PROVIDER=smtp` plus `SMTP_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS`
  - `EMAIL_PROVIDER=preview` plus `ENABLE_DEV_MAGIC_LINK_PREVIEW=true` as a temporary fallback until SES or SMTP is ready

Validate before deploying:

```bash
npm run validate:prod-env
```

## EC2-first production sequence

1. Provision an Ubuntu EC2 instance with inbound `80` and `443`.
2. Clone the repo to `/opt/promptshield`.
3. Run `infra/scripts/bootstrap-ec2.sh`.
4. Place `infra/aws/.env.prod` on the host.
5. Build and deploy:

```bash
cd /opt/promptshield
infra/scripts/deploy-ec2.sh
```

6. Point Route 53 or your DNS provider at the EC2 host.
7. Terminate TLS at a load balancer or replace the nginx config with your certificate-mounted TLS server block.
8. Configure the Stripe webhook endpoint to hit `https://api.promptshield.example.com/v1/webhooks/stripe` or route `/api/v1/webhooks/stripe` through nginx.
9. Run smoke checks:
   - `npm run smoke:deploy -- https://your-domain`
   - login
   - extension activation
   - policy fetch
   - block/redact/justify flow
   - event batch ingestion
   - Stripe checkout and portal

## CI/CD

- `.github/workflows/ci.yml` runs typecheck, tests, builds, and archives the extension build.
- `.github/workflows/deploy-production.yml` packages the extension, syncs the repo to an EC2 host, and runs the production compose deploy script.

## Backup and recovery

- Use host or managed-volume snapshots for Postgres.
- Keep Redis ephemeral; it only stores transient queue and cache state.
- Export policy snapshots and CSV exports to S3 if you extend the worker for object storage.
- Document quarterly restore drills before pilot customers onboard.
