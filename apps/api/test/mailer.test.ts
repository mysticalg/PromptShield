import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();
const createTransportMock = vi.fn();
const sendMailMock = vi.fn();

vi.mock("@aws-sdk/client-sesv2", () => ({
  SESv2Client: class {
    send = sendMock;
  },
  SendEmailCommand: class {
    input;

    constructor(input: unknown) {
      this.input = input;
    }
  }
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: createTransportMock
  }
}));

describe("sendMagicLinkEmail", () => {
  beforeEach(() => {
    createTransportMock.mockReset();
    sendMailMock.mockReset();
    sendMock.mockReset();
    delete process.env.AWS_REGION;
    delete process.env.AWS_DEFAULT_REGION;
  });

  it("falls back to preview mode when no delivery provider is configured", async () => {
    const { sendMagicLinkEmail } = await import("../src/lib/mailer.js");

    await expect(
      sendMagicLinkEmail(
        {
          NODE_ENV: "test",
          PORT: 4000,
          JWT_SECRET: "promptshield-test-secret-12345",
          POSTGRES_URL: undefined,
          STORE_S3_BUCKET: undefined,
          STORE_S3_KEY: undefined,
          REDIS_URL: undefined,
          API_BASE_URL: "http://localhost:4000",
          WEB_BASE_URL: "http://localhost:5173",
          DEFAULT_TRIAL_DAYS: 14,
          STRIPE_SECRET_KEY: undefined,
          STRIPE_WEBHOOK_SECRET: undefined,
          STRIPE_PRICE_PRO: undefined,
          STRIPE_PRICE_TEAM: undefined,
          STRIPE_PRICE_ENTERPRISE: undefined,
          STRIPE_API_VERSION: "2026-02-25.clover",
          EMAIL_PROVIDER: "auto",
          ENABLE_DEV_MAGIC_LINK_PREVIEW: true,
          SMTP_FROM: "security@promptshield.local",
          SMTP_HOST: undefined,
          SMTP_PORT: 587,
          SMTP_USER: undefined,
          SMTP_PASS: undefined,
          SES_REGION: undefined,
          SES_CONFIGURATION_SET: undefined,
          SES_FROM_ARN: undefined,
          SES_REPLY_TO: undefined
        },
        "owner@example.com",
        "https://promptshield.test/auth/verify?token=abc123"
      )
    ).resolves.toEqual({
      previewUrl: "https://promptshield.test/auth/verify?token=abc123"
    });
  });

  it("uses SES when configured", async () => {
    const { sendMagicLinkEmail } = await import("../src/lib/mailer.js");

    await sendMagicLinkEmail(
      {
        NODE_ENV: "production",
        PORT: 4000,
        JWT_SECRET: "promptshield-test-secret-12345",
        POSTGRES_URL: undefined,
        STORE_S3_BUCKET: undefined,
        STORE_S3_KEY: undefined,
        REDIS_URL: undefined,
        API_BASE_URL: "https://api.promptshield.test",
        WEB_BASE_URL: "https://promptshield.test",
        DEFAULT_TRIAL_DAYS: 14,
        STRIPE_SECRET_KEY: undefined,
        STRIPE_WEBHOOK_SECRET: undefined,
        STRIPE_PRICE_PRO: undefined,
        STRIPE_PRICE_TEAM: undefined,
        STRIPE_PRICE_ENTERPRISE: undefined,
        STRIPE_API_VERSION: "2026-02-25.clover",
        EMAIL_PROVIDER: "ses",
        ENABLE_DEV_MAGIC_LINK_PREVIEW: false,
        SMTP_FROM: "security@promptshield.test",
        SMTP_HOST: undefined,
        SMTP_PORT: 587,
        SMTP_USER: undefined,
        SMTP_PASS: undefined,
        SES_REGION: "eu-west-2",
        SES_CONFIGURATION_SET: undefined,
        SES_FROM_ARN: undefined,
        SES_REPLY_TO: undefined
      },
      "owner@example.com",
      "https://promptshield.test/auth/verify?token=abc123"
    );

    expect(sendMock).toHaveBeenCalledTimes(1);
    const command = sendMock.mock.calls[0]?.[0];
    expect(command).toBeDefined();
    expect(command?.input).toMatchObject({
      FromEmailAddress: "security@promptshield.test",
      Destination: {
        ToAddresses: ["owner@example.com"]
      }
    });
  });
});
