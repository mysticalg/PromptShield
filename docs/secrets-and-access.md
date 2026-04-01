# Secrets And Access

## Current blockers vs unblocked work

- Stripe and AWS App Runner are now live for PromptShield.
- Native SES support is now in the API, and the branded mail domain registration has been submitted through Route 53, but the domain must finish registering before production email can be enabled.
- Custom DNS and GitHub Actions deployment secrets are still optional follow-up work.

## Repo-local secret file

Use [infra/aws/.env.prod](C:/Users/drhoo/OneDrive/Documents/GitHub/PromptShield/infra/aws/.env.prod) for local production values. It is ignored by git.

Validate it with:

```powershell
npm run validate:prod-env
```

## Live endpoints

- Web: `https://promptshieldapp.co.uk`
- API: `https://api.promptshieldapp.co.uk`
- Legacy web host: `https://n2ykw8w5vu.eu-west-2.awsapprunner.com`
- Legacy API host: `https://mc229pcfdw.eu-west-2.awsapprunner.com`
- Stripe webhook target should be: `https://api.promptshieldapp.co.uk/v1/webhooks/stripe`

## Current SES status

- SES region: `eu-west-2`
- Previous SES identity attempt used `promptshield.app`, but that domain is already registered by someone else and should be treated as obsolete.
- Current target domain: `promptshieldapp.co.uk`
- Planned sender identity: `security@promptshieldapp.co.uk`
- Route 53 registration for `promptshieldapp.co.uk` is complete.
- SES domain identity for `promptshieldapp.co.uk` has now been created in `eu-west-2`.
- Current SES identity status: `Verified`
- AWS account status: `Sandbox`
- SES production access request was denied on first submission under case `177488527500125` while the site still used the raw App Runner hostname.
- Preview-link fallback remains enabled in production until SES production access is approved.

## Current SES DNS records

- DKIM CNAME:
  `jpsckar32hss6cfnjozyhvxdrt2cdcxh._domainkey.promptshieldapp.co.uk` -> `jpsckar32hss6cfnjozyhvxdrt2cdcxh.dkim.amazonses.com`
- DKIM CNAME:
  `7fve3lajjtidt2ucxsxwwmd4hf5qir7q._domainkey.promptshieldapp.co.uk` -> `7fve3lajjtidt2ucxsxwwmd4hf5qir7q.dkim.amazonses.com`
- DKIM CNAME:
  `fjd3kdkggopmefmlan5lhzckrzqajuo7._domainkey.promptshieldapp.co.uk` -> `fjd3kdkggopmefmlan5lhzckrzqajuo7.dkim.amazonses.com`

Completed DNS work:
- Public Route 53 hosted zone exists for `promptshieldapp.co.uk`
- The three SES DKIM CNAME records are live
- DMARC TXT record exists for `_dmarc.promptshieldapp.co.uk`
- App Runner custom domains are active for `promptshieldapp.co.uk` and `api.promptshieldapp.co.uk`

## Domain selection notes

- `promptshield.app` is taken.
- `promptshieldapp.co.uk` is the current target and has been submitted through Route 53.
- New SES DKIM and DMARC records must be generated for `promptshieldapp.co.uk` after the domain registration completes.

Optional follow-up:
- Add a custom MAIL FROM subdomain inside SES after the base domain verifies.
- Submit the SES production access request once the domain status changes from pending to verified.
- Optional custom DNS if you want branded app domains instead of the App Runner hostnames.

## GitHub Actions secrets

The production workflow expects:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## Recommended order

1. Keep `promptshieldapp.co.uk` and `api.promptshieldapp.co.uk` as the canonical production domains.
2. Re-submit SES production access using `https://promptshieldapp.co.uk` after AWS allows a new review submission.
3. Once SES production access is approved, switch `EMAIL_PROVIDER=ses` and `ENABLE_DEV_MAGIC_LINK_PREVIEW=false` in [infra/aws/.env.prod](C:/Users/drhoo/OneDrive/Documents/GitHub/PromptShield/infra/aws/.env.prod).
4. Update the live Stripe webhook endpoint to `https://api.promptshieldapp.co.uk/v1/webhooks/stripe`.
5. Add GitHub Actions deployment secrets if you want CI-driven rollout.
6. Run `npm run validate:prod-env`.
7. Run `npm run smoke:deploy -- https://promptshieldapp.co.uk`.
