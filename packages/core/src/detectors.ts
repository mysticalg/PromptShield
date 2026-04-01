import type { RuleMatcher } from "./schemas.js";

export type SystemDetector = {
  id: string;
  description: string;
  regex: RegExp;
};

const SECRET_REGEXES = {
  api_key: /(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{16,}/gi,
  aws_access_key: /\bAKIA[0-9A-Z]{16}\b/g,
  github_token: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/gi,
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  phone_number: /\b(?:\+\d{1,3}[\s-]?)?(?:\(\d{2,4}\)|\d{2,4})[\s-]?\d{3,4}[\s-]?\d{3,4}\b/g,
  card_number: /\b(?:\d[ -]*?){13,19}\b/g,
  customer_id: /\b(?:cust|customer|acct|account)[-_ ]?[A-Z0-9]{4,}\b/gi,
  internal_codename: /\b(?:project|codename|initiative)[-_ ]?[A-Z][A-Za-z0-9]{2,}\b/g
} satisfies Record<string, RegExp>;

export const systemDetectors: SystemDetector[] = Object.entries(SECRET_REGEXES).map(
  ([id, regex]) => ({
    id,
    regex,
    description: id.replaceAll("_", " ")
  })
);

export function getDetector(detectorId: string): SystemDetector | undefined {
  return systemDetectors.find((detector) => detector.id === detectorId);
}

export function runMatcher(
  matcher: RuleMatcher,
  text: string | undefined,
  fileName: string | undefined
): string[] {
  switch (matcher.kind) {
    case "regex": {
      if (!text || !matcher.pattern) {
        return [];
      }
      const regex = new RegExp(matcher.pattern, matcher.flags ?? "gi");
      return Array.from(text.matchAll(regex), (match) => match[0]);
    }
    case "dictionary": {
      if (!text || !matcher.values?.length) {
        return [];
      }
      const normalized = text.toLowerCase();
      return matcher.values.filter((value) => normalized.includes(value.toLowerCase()));
    }
    case "detector": {
      if (!text || !matcher.detector) {
        return [];
      }
      const detector = getDetector(matcher.detector);
      if (!detector) {
        return [];
      }
      return Array.from(text.matchAll(detector.regex), (match) => match[0]);
    }
    case "file_name": {
      if (!fileName || !matcher.pattern) {
        return [];
      }
      const regex = new RegExp(matcher.pattern, matcher.flags ?? "i");
      return regex.test(fileName) ? [fileName] : [];
    }
    case "file_extension": {
      if (!fileName || !matcher.fileExtensions?.length) {
        return [];
      }
      const extension = fileName.includes(".") ? fileName.slice(fileName.lastIndexOf(".")).toLowerCase() : "";
      return matcher.fileExtensions.map((value) => value.toLowerCase()).includes(extension) ? [extension] : [];
    }
    default:
      return [];
  }
}

export function redactSensitiveText(text: string, matches: string[], replacement = "[REDACTED]"): string {
  return matches.reduce((current, value) => {
    if (!value) {
      return current;
    }
    return current.replaceAll(value, replacement);
  }, text);
}
