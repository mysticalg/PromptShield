import {
  classifyContent,
  createDefaultPolicyPack,
  type PolicyOutcome
} from "@promptshield/core";

export type DashboardEvent = {
  id: string;
  eventType: string;
  severity: string;
  destinationDomain: string;
  detectorIds: string[];
  ruleIds: string[];
  action: string;
  createdAt: string;
};

export type OverviewData = {
  activeSeats: number;
  eventsToday: number;
  totalPolicies: number;
  recentEvents: DashboardEvent[];
  topDetectors: Array<{ detectorId: string; count: number }>;
};

export type PolicyData = {
  id: string;
  name: string;
  version: number;
  protectedDomains: string[];
  rules: unknown[];
};

export type UserDevice = {
  id: string;
  extensionVersion: string | null;
  status: string;
};

export type UserWithDevices = {
  id: string;
  email: string;
  role: string;
  devices: UserDevice[];
};

export type BillingData = {
  plan: string;
  state: string;
  seatLimit: number;
  trialEndsAt: string | null;
};

export type DemoScenario = {
  id: string;
  label: string;
  title: string;
  detail: string;
  destinationDomain: string;
  prompt: string;
};

export type PresentationOverview = OverviewData & {
  usingSampleData: boolean;
};

export const demoPolicy = createDefaultPolicyPack("demo-org", 8);

export const demoScenarios: DemoScenario[] = [
  {
    id: "block",
    label: "Live secret",
    title: "Block live credentials before they leave the browser.",
    detail: "PromptShield stops hard secrets outright on protected AI destinations.",
    destinationDomain: "chatgpt.com",
    prompt:
      "Summarise this production incident and include the live Stripe credential sk_live_1234567890ABCDEF1234 so the assistant can verify the failure."
  },
  {
    id: "redact",
    label: "Personal data",
    title: "Redact sensitive customer details automatically.",
    detail: "The same policy engine can replace personal data while allowing the rest of the prompt through.",
    destinationDomain: "claude.ai",
    prompt:
      "Draft a renewal email for alice@example.com and danielle.owens@example.com and keep the tone calm and professional."
  },
  {
    id: "justify",
    label: "Customer record",
    title: "Require a reason when customer records are referenced.",
    detail: "When the prompt includes an account identifier, PromptShield can gate the submission behind a business justification.",
    destinationDomain: "gemini.google.com",
    prompt:
      "Analyse churn risk for acct-88ZA and customer Q4B7 using the notes below, then suggest a retention playbook."
  },
  {
    id: "warn",
    label: "Internal codename",
    title: "Warn when internal project names show up in external prompts.",
    detail: "Low-friction warnings let teams keep moving while still catching early leakage patterns.",
    destinationDomain: "copilot.microsoft.com",
    prompt: "Rewrite the board update for Project Helios so it sounds more direct and less defensive."
  }
];

export const pricingTiers = [
  {
    name: "Pro",
    price: "GBP 19 / month",
    detail: "For founder-led rollouts that need real controls without a long buying cycle.",
    inclusions: "Protected domains, saved policies, file checks, exports."
  },
  {
    name: "Team",
    price: "GBP 35 / month",
    detail: "For shared policy ownership, live review, and multi-operator governance.",
    inclusions: "Shared workflows, event review, billing seats, rollout controls."
  },
  {
    name: "Enterprise",
    price: "GBP 12,000 / year",
    detail: "For formal security programs, managed deployment, and tighter operating controls.",
    inclusions: "Managed rollout, enterprise hardening, retention and access controls."
  }
] as const;

export const trustPillars = [
  {
    title: "Local first enforcement",
    body: "Classification happens inside the browser extension before the prompt reaches a protected destination."
  },
  {
    title: "Metadata-only telemetry",
    body: "PromptShield stores detector hits, rule IDs, destination domains, timestamps, and optional justifications by default, not raw prompts."
  },
  {
    title: "Operational control plane",
    body: "Admins publish policy packs, review interventions, activate devices, and manage billing from one surface."
  }
] as const;

export const templateLibrary = [
  {
    name: "PII Guard",
    body: "Redact email addresses, phone numbers, and account references before employees can paste them into a public model."
  },
  {
    name: "Source Code and Secret Guard",
    body: "Hard-block keys, token strings, and sensitive file types for engineering and DevOps teams."
  },
  {
    name: "Board and Strategy Guard",
    body: "Warn on internal codenames and require justification for confidential customer or commercial context."
  }
] as const;

export const trustFlow = [
  {
    step: "01",
    title: "Publish the policy pack",
    body: "Admins define protected destinations and the exact intervention mode for each detector."
  },
  {
    step: "02",
    title: "Activate the browser",
    body: "A short-lived device code binds the extension to the tenant and pulls entitlement and policy state."
  },
  {
    step: "03",
    title: "Intervene before send",
    body: "Paste, submit, and file-upload actions are classified locally and then blocked, redacted, warned, or gated."
  },
  {
    step: "04",
    title: "Review the signal",
    body: "Operators get auditable intervention events, top detector trends, and user/device rollout visibility."
  }
] as const;

export const trustDataHandling = {
  stores: [
    "Destination domain, severity, action, detector IDs, and rule IDs",
    "Timestamped intervention events for audit review",
    "Optional user justification text when a rule requires it",
    "File metadata such as file name, size, and MIME type when file checks trigger"
  ],
  avoids: [
    "Raw prompt bodies by default",
    "Full uploaded file contents",
    "Background scraping of non-protected destinations",
    "Support diagnostics without explicit operator intent"
  ]
} as const;

export const sampleRecentEvents: DashboardEvent[] = [
  {
    id: "evt-sample-1",
    eventType: "block",
    severity: "critical",
    destinationDomain: "chatgpt.com",
    detectorIds: ["api_key"],
    ruleIds: ["secret-api-key"],
    action: "block",
    createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString()
  },
  {
    id: "evt-sample-2",
    eventType: "redact",
    severity: "medium",
    destinationDomain: "claude.ai",
    detectorIds: ["email"],
    ruleIds: ["personal-email"],
    action: "redact",
    createdAt: new Date(Date.now() - 28 * 60 * 1000).toISOString()
  },
  {
    id: "evt-sample-3",
    eventType: "justify",
    severity: "medium",
    destinationDomain: "gemini.google.com",
    detectorIds: ["customer_id"],
    ruleIds: ["customer-reference"],
    action: "justify",
    createdAt: new Date(Date.now() - 52 * 60 * 1000).toISOString()
  },
  {
    id: "evt-sample-4",
    eventType: "warn",
    severity: "low",
    destinationDomain: "copilot.microsoft.com",
    detectorIds: ["internal_codename"],
    ruleIds: ["project-codename"],
    action: "warn",
    createdAt: new Date(Date.now() - 76 * 60 * 1000).toISOString()
  },
  {
    id: "evt-sample-5",
    eventType: "block",
    severity: "high",
    destinationDomain: "chatgpt.com",
    detectorIds: ["api_key"],
    ruleIds: ["secret-api-key"],
    action: "block",
    createdAt: new Date(Date.now() - 101 * 60 * 1000).toISOString()
  },
  {
    id: "evt-sample-6",
    eventType: "redact",
    severity: "medium",
    destinationDomain: "claude.ai",
    detectorIds: ["email"],
    ruleIds: ["personal-email"],
    action: "redact",
    createdAt: new Date(Date.now() - 132 * 60 * 1000).toISOString()
  }
];

export const sampleTopDetectors = [
  { detectorId: "api_key", count: 18 },
  { detectorId: "email", count: 11 },
  { detectorId: "customer_id", count: 7 },
  { detectorId: "internal_codename", count: 4 }
];

export const workspaceMeta: Record<string, { eyebrow: string; title: string; description: string }> = {
  overview: {
    eyebrow: "Executive view",
    title: "Overview",
    description: "Current risk pressure, intervention mix, and operator actions across the tenant."
  },
  policies: {
    eyebrow: "Policy control",
    title: "Policies",
    description: "Adjust protected destinations and publish new policy pack versions."
  },
  events: {
    eyebrow: "Audit review",
    title: "Events",
    description: "Search intervention telemetry, export evidence, and inspect detector activity."
  },
  users: {
    eyebrow: "Rollout visibility",
    title: "Users and devices",
    description: "Track who is protected, which browsers are active, and where rollout still needs coverage."
  },
  billing: {
    eyebrow: "Commercial state",
    title: "Billing",
    description: "Control entitlements, self-serve upgrades, and the customer billing lifecycle."
  },
  settings: {
    eyebrow: "Operational defaults",
    title: "Settings",
    description: "Inspect environment posture and the current product-wide operating assumptions."
  }
};

export function titleCase(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function actionLabel(action: string): string {
  return titleCase(action);
}

export function detectorLabel(detectorId: string): string {
  return titleCase(detectorId);
}

export function severityRank(severity: string): number {
  return {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4
  }[severity] ?? 0;
}

export function actionCopy(action: string): string {
  switch (action) {
    case "block":
      return "Submission is stopped until the secret is removed.";
    case "redact":
      return "Sensitive values are replaced before the prompt continues.";
    case "justify":
      return "PromptShield captures a business reason before allowing the send.";
    case "warn":
      return "The operator gets a lightweight warning before continuing.";
    default:
      return "No intervention is required for this content.";
  }
}

export function overviewSummary(leadAction: string | undefined, eventsToday: number, destinations: number): string {
  if (!leadAction) {
    return "PromptShield is live and waiting for its first intervention signal.";
  }

  return `${actionLabel(leadAction)} is the dominant control response right now, with ${eventsToday} interventions logged today across ${destinations} protected destination surfaces.`;
}

export function outcomeHeadline(outcome: PolicyOutcome): string {
  switch (outcome.action) {
    case "block":
      return "Hard block on sensitive material";
    case "redact":
      return "Automatic redaction before send";
    case "justify":
      return "Business justification required";
    case "warn":
      return "Soft warning with operator review";
    default:
      return "Prompt allowed";
  }
}

export function outcomeDetail(outcome: PolicyOutcome): string {
  if (!outcome.detections.length) {
    return "No active detectors fired for this draft.";
  }

  return `${actionCopy(outcome.action)} ${outcome.detections.length} detector${outcome.detections.length === 1 ? "" : "s"} matched in this example.`;
}

export function liveDemoOutcome(destinationDomain: string, draft: string) {
  return classifyContent(
    {
      destinationDomain,
      text: draft
    },
    demoPolicy
  );
}

export function recommendationForEvent(event: DashboardEvent): string {
  switch (event.action) {
    case "block":
      return "Confirm the user has a safe internal workflow for the blocked secret or file.";
    case "redact":
      return "Review whether the automatic redaction preserved enough context for the task.";
    case "justify":
      return "Ensure the attached reason meets the organization's approval standard.";
    case "warn":
      return "Check whether the warning should be tightened into justification or block.";
    default:
      return "No additional operator action is needed.";
  }
}

export function buildPresentationOverview(data: OverviewData): PresentationOverview {
  const hasLiveSignal = data.eventsToday > 0 || data.recentEvents.length > 0 || data.topDetectors.length > 0;
  if (hasLiveSignal) {
    return {
      ...data,
      usingSampleData: false
    };
  }

  return {
    activeSeats: Math.max(data.activeSeats, 24),
    eventsToday: Math.max(data.eventsToday, 41),
    totalPolicies: Math.max(data.totalPolicies, 12),
    recentEvents: sampleRecentEvents,
    topDetectors: sampleTopDetectors,
    usingSampleData: true
  };
}

export function buildActionMix(events: DashboardEvent[]) {
  const actions = ["block", "justify", "redact", "warn"];
  const counts = new Map(actions.map((action) => [action, 0]));

  for (const event of events) {
    if (counts.has(event.action)) {
      counts.set(event.action, (counts.get(event.action) ?? 0) + 1);
    }
  }

  const maxCount = Math.max(...Array.from(counts.values()), 1);
  return actions.map((action) => ({
    action,
    count: counts.get(action) ?? 0,
    width: `${Math.max(((counts.get(action) ?? 0) / maxCount) * 100, 10)}%`
  }));
}

export function buildSeverityMix(events: DashboardEvent[]) {
  const severities = ["critical", "high", "medium", "low"];
  const counts = new Map(severities.map((severity) => [severity, 0]));

  for (const event of events) {
    if (counts.has(event.severity)) {
      counts.set(event.severity, (counts.get(event.severity) ?? 0) + 1);
    }
  }

  const maxCount = Math.max(...Array.from(counts.values()), 1);
  return severities.map((severity) => ({
    severity,
    count: counts.get(severity) ?? 0,
    width: `${Math.max(((counts.get(severity) ?? 0) / maxCount) * 100, 10)}%`
  }));
}

export function buildTrend(events: DashboardEvent[]) {
  const currentHour = new Date();
  currentHour.setMinutes(0, 0, 0);

  const buckets = Array.from({ length: 6 }, (_, index) => {
    const timestamp = currentHour.getTime() - (5 - index) * 60 * 60 * 1000;
    return {
      key: timestamp,
      label: new Date(timestamp).toLocaleTimeString([], {
        hour: "numeric"
      }),
      count: 0
    };
  });

  for (const event of events) {
    const eventHour = new Date(event.createdAt);
    eventHour.setMinutes(0, 0, 0);
    const match = buckets.find((bucket) => bucket.key === eventHour.getTime());
    if (match) {
      match.count += 1;
    }
  }

  const maxCount = Math.max(...buckets.map((bucket) => bucket.count), 1);
  return buckets.map((bucket) => ({
    ...bucket,
    height: `${Math.max((bucket.count / maxCount) * 100, 14)}%`
  }));
}

export function buildPressureIndex(events: DashboardEvent[]): number {
  const weighted = events.reduce((total, event) => {
    const severityWeight = severityRank(event.severity) * 9;
    const actionWeight =
      event.action === "block" ? 12 : event.action === "justify" ? 9 : event.action === "redact" ? 7 : 4;
    return total + severityWeight + actionWeight;
  }, 0);

  return Math.min(96, Math.max(14, Math.round(weighted / Math.max(events.length, 1))));
}

export function pickSpotlight(events: DashboardEvent[]): DashboardEvent | null {
  if (!events.length) {
    return null;
  }

  return [...events].sort((left, right) => {
    const severityCompare = severityRank(right.severity) - severityRank(left.severity);
    if (severityCompare !== 0) {
      return severityCompare;
    }
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  })[0] ?? null;
}

export function getWorkspaceDefinition(pathname: string): {
  eyebrow: string;
  title: string;
  description: string;
} {
  const key = pathname.split("/").filter(Boolean).pop() ?? "overview";
  return workspaceMeta[key] ?? workspaceMeta.overview!;
}
