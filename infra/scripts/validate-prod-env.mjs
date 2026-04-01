import fs from "node:fs";
import path from "node:path";

const envPath = process.argv[2] ?? path.join(process.cwd(), "infra", "aws", ".env.prod");

function parseEnvFile(contents) {
  const values = {};
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1);
    values[key] = value;
  }
  return values;
}

function isPlaceholder(value) {
  return (
    !value ||
    value === "change-me" ||
    value.includes("example.com") ||
    value === "security@promptshield.example.com"
  );
}

if (!fs.existsSync(envPath)) {
  console.error(`Missing env file: ${envPath}`);
  process.exit(1);
}

const env = parseEnvFile(fs.readFileSync(envPath, "utf8"));
const requiredKeys = [
  "PROMPTSHIELD_DOMAIN",
  "PROMPTSHIELD_API_DOMAIN",
  "JWT_SECRET",
  "API_BASE_URL",
  "WEB_BASE_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_PRO",
  "STRIPE_PRICE_TEAM",
  "STRIPE_PRICE_ENTERPRISE",
  "EMAIL_PROVIDER",
  "SMTP_FROM",
  "ENABLE_DEV_MAGIC_LINK_PREVIEW"
];

const missing = requiredKeys.filter((key) => !(key in env) || isPlaceholder(env[key]));
const notes = [];
const hasPostgres = !!env.POSTGRES_URL && !isPlaceholder(env.POSTGRES_URL);
const hasS3Store =
  !!env.STORE_S3_BUCKET &&
  !!env.STORE_S3_KEY &&
  !isPlaceholder(env.STORE_S3_BUCKET) &&
  !isPlaceholder(env.STORE_S3_KEY);
const hasSmtp =
  !!env.SMTP_HOST &&
  !!env.SMTP_USER &&
  !!env.SMTP_PASS &&
  !isPlaceholder(env.SMTP_HOST) &&
  !isPlaceholder(env.SMTP_USER) &&
  !isPlaceholder(env.SMTP_PASS);
const usesSes = env.EMAIL_PROVIDER === "ses";
const hasSes =
  usesSes &&
  !!env.SES_REGION &&
  !isPlaceholder(env.SES_REGION);
const hasPreviewFallback = env.ENABLE_DEV_MAGIC_LINK_PREVIEW === "true";

if (!hasPostgres && !hasS3Store) {
  missing.push("POSTGRES_URL or STORE_S3_BUCKET/STORE_S3_KEY");
}

if (hasPostgres && (!("POSTGRES_PASSWORD" in env) || isPlaceholder(env.POSTGRES_PASSWORD))) {
  missing.push("POSTGRES_PASSWORD");
}

if (hasPostgres && (!("REDIS_URL" in env) || isPlaceholder(env.REDIS_URL))) {
  missing.push("REDIS_URL");
}

if (!hasSmtp && !hasSes && !hasPreviewFallback) {
  missing.push("SMTP_HOST / SMTP_USER / SMTP_PASS or EMAIL_PROVIDER=ses with SES_REGION or ENABLE_DEV_MAGIC_LINK_PREVIEW=true");
}

if (env.STRIPE_SECRET_KEY && !env.STRIPE_SECRET_KEY.startsWith("sk_")) {
  notes.push("STRIPE_SECRET_KEY does not look like a Stripe secret key.");
}
if (env.WEB_BASE_URL && !env.WEB_BASE_URL.startsWith("https://")) {
  notes.push("WEB_BASE_URL should use https in staging/production.");
}
if (env.API_BASE_URL && !env.API_BASE_URL.startsWith("https://")) {
  notes.push("API_BASE_URL should use https in staging/production.");
}
if (hasSmtp && env.SMTP_PORT && Number.isNaN(Number(env.SMTP_PORT))) {
  notes.push("SMTP_PORT must be numeric.");
}
if (usesSes && hasSmtp) {
  notes.push("EMAIL_PROVIDER=ses ignores SMTP_HOST, SMTP_USER, and SMTP_PASS.");
}
if (hasPreviewFallback) {
  notes.push("ENABLE_DEV_MAGIC_LINK_PREVIEW=true exposes raw sign-in links and should be replaced with SMTP before broader rollout.");
}

if (!missing.length && !notes.length) {
  console.log(`Production env looks complete: ${envPath}`);
  process.exit(0);
}

if (!missing.length && notes.length) {
  console.warn(`Production env looks complete with warnings: ${envPath}`);
  console.warn("Validation notes:");
  for (const note of notes) {
    console.warn(`- ${note}`);
  }
  process.exit(0);
}

if (missing.length) {
  console.error("Missing or placeholder values:");
  for (const key of missing) {
    console.error(`- ${key}`);
  }
}

if (notes.length) {
  console.error("Validation notes:");
  for (const note of notes) {
    console.error(`- ${note}`);
  }
}

process.exit(1);
