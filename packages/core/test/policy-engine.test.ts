import { describe, expect, it } from "vitest";

import { createDefaultPolicyPack } from "../src/defaults";
import { classifyContent, matchesProtectedDomain } from "../src/policy-engine";

describe("policy engine", () => {
  const pack = createDefaultPolicyPack("org-test");

  it("matches protected domains by suffix", () => {
    expect(matchesProtectedDomain("chatgpt.com", pack.protectedDomains)).toBe(true);
    expect(matchesProtectedDomain("sub.gemini.google.com", pack.protectedDomains)).toBe(true);
    expect(matchesProtectedDomain("example.com", pack.protectedDomains)).toBe(false);
  });

  it("blocks API keys", () => {
    const outcome = classifyContent(
      {
        destinationDomain: "chatgpt.com",
        text: "Please summarise this secret sk_live_1234567890ABCDEF1234"
      },
      pack
    );

    expect(outcome.action).toBe("block");
    expect(outcome.shouldBlock).toBe(true);
    expect(outcome.matchedRuleIds).toContain("secret-api-key");
  });

  it("redacts emails", () => {
    const outcome = classifyContent(
      {
        destinationDomain: "chatgpt.com",
        text: "Contact alice@example.com for the details."
      },
      pack
    );

    expect(outcome.action).toBe("redact");
    expect(outcome.redactedText).toContain("[REDACTED]");
  });

  it("blocks sensitive file extensions", () => {
    const outcome = classifyContent(
      {
        destinationDomain: "claude.ai",
        fileMeta: {
          name: "prod.env",
          size: 1024,
          mime: "text/plain"
        }
      },
      pack
    );

    expect(outcome.action).toBe("block");
    expect(outcome.severity).toBe("critical");
  });
});
