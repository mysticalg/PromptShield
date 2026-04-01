import { z } from "zod";

export const severitySchema = z.enum(["low", "medium", "high", "critical"]);
export type Severity = z.infer<typeof severitySchema>;

export const actionSchema = z.enum(["allow", "warn", "redact", "justify", "block"]);
export type Action = z.infer<typeof actionSchema>;

export const matcherKindSchema = z.enum([
  "regex",
  "dictionary",
  "detector",
  "file_name",
  "file_extension"
]);
export type MatcherKind = z.infer<typeof matcherKindSchema>;

export const fileMetadataSchema = z.object({
  name: z.string(),
  size: z.number().int().nonnegative(),
  mime: z.string().optional()
});
export type FileMetadata = z.infer<typeof fileMetadataSchema>;

export const ruleMatcherSchema = z.object({
  kind: matcherKindSchema,
  pattern: z.string().optional(),
  flags: z.string().optional(),
  values: z.array(z.string()).optional(),
  detector: z.string().optional(),
  fileExtensions: z.array(z.string()).optional()
});
export type RuleMatcher = z.infer<typeof ruleMatcherSchema>;

export const policyRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  severity: severitySchema,
  action: actionSchema,
  matcher: ruleMatcherSchema,
  domains: z.array(z.string()).default([]),
  message: z.string().optional(),
  redactionLabel: z.string().default("[REDACTED]")
});
export type PolicyRule = z.infer<typeof policyRuleSchema>;

export const policyPackSchema = z.object({
  id: z.string(),
  orgId: z.string().optional(),
  version: z.number().int().positive(),
  name: z.string(),
  status: z.enum(["draft", "published"]).default("published"),
  protectedDomains: z.array(z.string()),
  rules: z.array(policyRuleSchema)
});
export type PolicyPack = z.infer<typeof policyPackSchema>;

export const classificationInputSchema = z.object({
  text: z.string().optional(),
  destinationDomain: z.string(),
  fileMeta: fileMetadataSchema.optional()
});
export type ClassificationInput = z.infer<typeof classificationInputSchema>;

export const detectionSchema = z.object({
  ruleId: z.string(),
  detectorId: z.string(),
  severity: severitySchema,
  action: actionSchema,
  matchedValues: z.array(z.string()),
  message: z.string().optional()
});
export type Detection = z.infer<typeof detectionSchema>;

export const policyOutcomeSchema = z.object({
  action: actionSchema,
  severity: severitySchema,
  detections: z.array(detectionSchema),
  redactedText: z.string().optional(),
  requiresJustification: z.boolean(),
  shouldWarn: z.boolean(),
  shouldBlock: z.boolean(),
  matchedRuleIds: z.array(z.string())
});
export type PolicyOutcome = z.infer<typeof policyOutcomeSchema>;

export const extensionEventSchema = z.object({
  id: z.string(),
  orgId: z.string().optional(),
  userId: z.string().optional(),
  deviceId: z.string().optional(),
  eventType: z.enum(["allow", "warn", "redact", "justify", "block"]),
  severity: severitySchema,
  detectorIds: z.array(z.string()),
  ruleIds: z.array(z.string()),
  destinationDomain: z.string(),
  action: actionSchema,
  fileMetadata: fileMetadataSchema.optional(),
  contentHash: z.string().optional(),
  createdAt: z.string()
});
export type ExtensionEvent = z.infer<typeof extensionEventSchema>;

export const justificationRequestSchema = z.object({
  eventId: z.string(),
  text: z.string().min(5),
  ticket: z.string().optional()
});
export type JustificationRequest = z.infer<typeof justificationRequestSchema>;

export const planSchema = z.enum(["free", "pro", "team", "enterprise"]);
export type Plan = z.infer<typeof planSchema>;

export const entitlementStateSchema = z.object({
  plan: planSchema,
  status: z.enum(["trialing", "active", "past_due", "canceled", "free"]),
  seatLimit: z.number().int().positive(),
  trialEndsAt: z.string().nullable().default(null)
});
export type EntitlementState = z.infer<typeof entitlementStateSchema>;

export const authSessionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    role: z.enum(["owner", "billing_admin", "security_admin", "analyst", "member"])
  }),
  organization: z.object({
    id: z.string(),
    name: z.string()
  }),
  entitlement: entitlementStateSchema
});
export type AuthSession = z.infer<typeof authSessionSchema>;

