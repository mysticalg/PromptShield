import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import nodemailer from "nodemailer";

import type { AppConfig } from "../config.js";

type EmailProvider = "preview" | "smtp" | "ses";

function hasSmtpConfig(config: AppConfig) {
  return !!(config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS);
}

function resolveSesRegion(config: AppConfig) {
  return config.SES_REGION ?? process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION;
}

function resolveEmailProvider(config: AppConfig): EmailProvider {
  if (config.EMAIL_PROVIDER === "preview" || config.EMAIL_PROVIDER === "smtp" || config.EMAIL_PROVIDER === "ses") {
    return config.EMAIL_PROVIDER;
  }

  if (hasSmtpConfig(config)) {
    return "smtp";
  }

  if (resolveSesRegion(config)) {
    return "ses";
  }

  return "preview";
}

export async function sendMagicLinkEmail(
  config: AppConfig,
  email: string,
  verifyUrl: string
): Promise<{ previewUrl?: string }> {
  const provider = resolveEmailProvider(config);

  if (provider === "preview") {
    return { previewUrl: verifyUrl };
  }

  if (provider === "smtp") {
    if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) {
      throw new Error("SMTP is enabled but SMTP_HOST, SMTP_USER, or SMTP_PASS is missing.");
    }

    const transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: config.SMTP_FROM,
      to: email,
      subject: "PromptShield sign-in link",
      text: `Use this secure link to sign in to PromptShield: ${verifyUrl}`
    });

    return {};
  }

  const region = resolveSesRegion(config);
  if (!region) {
    throw new Error("SES is enabled but SES_REGION or AWS_REGION is missing.");
  }

  const ses = new SESv2Client({ region });
  await ses.send(
    new SendEmailCommand({
      FromEmailAddress: config.SMTP_FROM,
      FromEmailAddressIdentityArn: config.SES_FROM_ARN,
      ReplyToAddresses: config.SES_REPLY_TO ? [config.SES_REPLY_TO] : undefined,
      ConfigurationSetName: config.SES_CONFIGURATION_SET,
      Destination: {
        ToAddresses: [email]
      },
      Content: {
        Simple: {
          Subject: {
            Data: "PromptShield sign-in link"
          },
          Body: {
            Text: {
              Data: `Use this secure link to sign in to PromptShield: ${verifyUrl}`
            }
          }
        }
      }
    })
  );

  return {};
}
