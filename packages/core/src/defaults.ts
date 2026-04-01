import type { PolicyPack } from "./schemas.js";

export function createDefaultPolicyPack(orgId?: string, version = 1): PolicyPack {
  return {
    id: `${orgId ?? "system"}-v${version}`,
    orgId,
    version,
    name: "PromptShield Default Pack",
    status: "published",
    protectedDomains: [
      "chat.openai.com",
      "chatgpt.com",
      "claude.ai",
      "gemini.google.com",
      "copilot.microsoft.com"
    ],
    rules: [
      {
        id: "secret-api-key",
        name: "Secret API keys",
        description: "Block secrets and token-looking strings.",
        severity: "high",
        action: "block",
        matcher: {
          kind: "detector",
          detector: "api_key"
        },
        domains: [],
        enabled: true,
        message: "This looks like an API key and cannot be sent to a protected destination.",
        redactionLabel: "[REDACTED]"
      },
      {
        id: "personal-email",
        name: "Personal data email",
        description: "Redact email addresses before submission.",
        severity: "medium",
        action: "redact",
        matcher: {
          kind: "detector",
          detector: "email"
        },
        domains: [],
        enabled: true,
        message: "Email addresses must be redacted before sending.",
        redactionLabel: "[REDACTED]"
      },
      {
        id: "customer-reference",
        name: "Customer identifiers",
        description: "Require justification when customer references are shared.",
        severity: "medium",
        action: "justify",
        matcher: {
          kind: "detector",
          detector: "customer_id"
        },
        domains: [],
        enabled: true,
        message: "Customer identifiers require a documented business reason.",
        redactionLabel: "[REDACTED]"
      },
      {
        id: "project-codename",
        name: "Internal project names",
        description: "Warn when internal codenames appear in protected prompts.",
        severity: "low",
        action: "warn",
        matcher: {
          kind: "detector",
          detector: "internal_codename"
        },
        domains: [],
        enabled: true,
        message: "Internal codenames should be reviewed before sharing externally.",
        redactionLabel: "[REDACTED]"
      },
      {
        id: "sensitive-file-extension",
        name: "Sensitive file types",
        description: "Block database dumps and private key uploads.",
        severity: "critical",
        action: "block",
        matcher: {
          kind: "file_extension",
          fileExtensions: [".pem", ".key", ".sql", ".sqlite", ".env"]
        },
        domains: [],
        enabled: true,
        message: "This file type is blocked for protected destinations.",
        redactionLabel: "[REDACTED]"
      }
    ]
  };
}
