import { redactSensitiveText, runMatcher } from "./detectors.js";
import type {
  Action,
  ClassificationInput,
  Detection,
  PolicyOutcome,
  PolicyPack,
  PolicyRule,
  Severity
} from "./schemas.js";

const severityWeight: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

const actionWeight: Record<Action, number> = {
  allow: 0,
  warn: 1,
  redact: 2,
  justify: 3,
  block: 4
};

export function matchesProtectedDomain(domain: string, protectedDomains: string[]): boolean {
  return protectedDomains.some((candidate) => domain === candidate || domain.endsWith(`.${candidate}`));
}

function isRuleInScope(rule: PolicyRule, domain: string): boolean {
  if (!rule.enabled) {
    return false;
  }
  if (!rule.domains.length) {
    return true;
  }
  return matchesProtectedDomain(domain, rule.domains);
}

function sortDetections(left: Detection, right: Detection): number {
  const severityCompare = severityWeight[right.severity] - severityWeight[left.severity];
  if (severityCompare !== 0) {
    return severityCompare;
  }
  return actionWeight[right.action] - actionWeight[left.action];
}

export function classifyContent(input: ClassificationInput, policyPack: PolicyPack): PolicyOutcome {
  const detections = policyPack.rules
    .filter((rule) => isRuleInScope(rule, input.destinationDomain))
    .flatMap((rule) => {
      const matches = runMatcher(rule.matcher, input.text, input.fileMeta?.name);
      if (!matches.length) {
        return [];
      }

      return [
        {
          ruleId: rule.id,
          detectorId: rule.matcher.detector ?? rule.matcher.kind,
          severity: rule.severity,
          action: rule.action,
          matchedValues: matches,
          message: rule.message
        } satisfies Detection
      ];
    })
    .sort(sortDetections);

  if (!detections.length) {
    return {
      action: "allow",
      severity: "low",
      detections: [],
      redactedText: input.text,
      requiresJustification: false,
      shouldWarn: false,
      shouldBlock: false,
      matchedRuleIds: []
    };
  }

  const strongest = detections[0]!;
  const matchedRuleIds = detections.map((detection) => detection.ruleId);
  const redactionMatches = detections.flatMap((detection) => detection.matchedValues);
  const redactedText =
    input.text && strongest.action === "redact"
      ? redactSensitiveText(input.text, redactionMatches)
      : input.text;

  return {
    action: strongest.action,
    severity: strongest.severity,
    detections,
    redactedText,
    requiresJustification: strongest.action === "justify",
    shouldWarn: strongest.action === "warn",
    shouldBlock: strongest.action === "block",
    matchedRuleIds
  };
}

export function resolvePolicyLayers(layers: Array<PolicyPack | undefined>): PolicyPack | undefined {
  return layers.find(Boolean);
}
