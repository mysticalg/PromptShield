import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  JWT_SECRET: z.string().min(16),
  POSTGRES_URL: z.string().url().optional(),
  STORE_S3_BUCKET: z.string().optional(),
  STORE_S3_KEY: z.string().optional(),
  REDIS_URL: z.string().url().optional(),
  API_BASE_URL: z.string().url().default("http://localhost:4000"),
  WEB_BASE_URL: z.string().url().default("http://localhost:5173"),
  DEFAULT_TRIAL_DAYS: z.coerce.number().int().positive().default(14),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_PRO: z.string().optional(),
  STRIPE_PRICE_TEAM: z.string().optional(),
  STRIPE_PRICE_ENTERPRISE: z.string().optional(),
  STRIPE_API_VERSION: z.string().default("2026-02-25.clover"),
  EMAIL_PROVIDER: z.enum(["auto", "preview", "smtp", "ses"]).default("auto"),
  ENABLE_DEV_MAGIC_LINK_PREVIEW: z
    .string()
    .optional()
    .transform((value) => value !== "false"),
  SMTP_FROM: z.string().email().default("security@promptshield.local"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SES_REGION: z.string().optional(),
  SES_CONFIGURATION_SET: z.string().optional(),
  SES_FROM_ARN: z.string().optional(),
  SES_REPLY_TO: z.string().email().optional()
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(env = process.env): AppConfig {
  return configSchema.parse(env);
}
