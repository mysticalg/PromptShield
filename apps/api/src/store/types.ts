import type { AuthSession, EntitlementState, ExtensionEvent, JustificationRequest, PolicyPack } from "@promptshield/core";

export type UserRole = AuthSession["user"]["role"];

export type OrganizationRecord = {
  id: string;
  name: string;
  plan: EntitlementState["plan"];
  status: EntitlementState["status"];
  createdAt: string;
};

export type UserRecord = {
  id: string;
  orgId: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type DeviceRecord = {
  id: string;
  userId: string;
  orgId: string;
  extensionVersion: string | null;
  lastSeenAt: string;
  status: "active" | "disabled";
};

export type BillingRecord = {
  orgId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  state: EntitlementState["status"];
  plan: EntitlementState["plan"];
  seatLimit: number;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
};

export type MagicLinkRecord = {
  id: string;
  tokenHash: string;
  email: string;
  userId: string;
  orgId: string;
  expiresAt: string;
  usedAt: string | null;
};

export type RefreshTokenRecord = {
  id: string;
  tokenHash: string;
  userId: string;
  orgId: string;
  expiresAt: string;
  revokedAt: string | null;
};

export type DeviceCodeRecord = {
  id: string;
  code: string;
  userId: string;
  orgId: string;
  expiresAt: string;
  usedAt: string | null;
};

export type JustificationRecord = {
  id: string;
  orgId: string;
  userId: string;
  eventId: string;
  text: string;
  ticket: string | null;
  status: "submitted" | "approved" | "rejected";
  createdAt: string;
};

export type EventRecord = ExtensionEvent & {
  orgId: string;
  userId: string;
  deviceId: string | undefined;
};

export type AuthBundle = {
  user: UserRecord;
  organization: OrganizationRecord;
  entitlement: EntitlementState;
};

export type OverviewRecord = {
  organization: OrganizationRecord;
  entitlement: EntitlementState;
  activeSeats: number;
  eventsToday: number;
  totalPolicies: number;
  recentEvents: EventRecord[];
  topDetectors: Array<{ detectorId: string; count: number }>;
};

export type EventFilters = {
  severity?: string;
  action?: string;
  query?: string;
  destinationDomain?: string;
};

export type PublishPolicyInput = {
  name: string;
  protectedDomains: string[];
  rules: PolicyPack["rules"];
};

export type BillingUpdate = Partial<BillingRecord> & Pick<BillingRecord, "orgId">;

export type AuthContext = {
  userId: string;
  orgId: string;
  email: string;
  role: UserRole;
};

export interface DataStore {
  initialize(): Promise<void>;
  createMagicLink(email: string, orgName?: string): Promise<{ token: string; session: AuthBundle }>;
  consumeMagicLink(tokenHash: string): Promise<AuthBundle | null>;
  createRefreshToken(userId: string, orgId: string, tokenHash: string, expiresAt: string): Promise<void>;
  consumeRefreshToken(tokenHash: string): Promise<AuthBundle | null>;
  revokeRefreshToken(tokenHash: string): Promise<void>;
  createDeviceCode(userId: string, orgId: string, expiresAt: string): Promise<DeviceCodeRecord>;
  consumeDeviceCode(
    code: string,
    deviceId: string,
    extensionVersion: string | null
  ): Promise<(AuthBundle & { device: DeviceRecord }) | null>;
  getAuthBundle(userId: string, orgId: string): Promise<AuthBundle | null>;
  getPolicy(orgId: string): Promise<PolicyPack>;
  publishPolicy(orgId: string, userId: string, input: PublishPolicyInput): Promise<PolicyPack>;
  recordEvents(orgId: string, userId: string, deviceId: string | undefined, events: ExtensionEvent[]): Promise<number>;
  listEvents(orgId: string, filters: EventFilters): Promise<EventRecord[]>;
  createJustification(orgId: string, userId: string, payload: JustificationRequest): Promise<JustificationRecord>;
  getOverview(orgId: string): Promise<OverviewRecord>;
  listUsersAndDevices(orgId: string): Promise<Array<UserRecord & { devices: DeviceRecord[] }>>;
  updateBilling(update: BillingUpdate): Promise<BillingRecord>;
  getBilling(orgId: string): Promise<BillingRecord>;
  cleanupExpiredRecords(): Promise<void>;
}

