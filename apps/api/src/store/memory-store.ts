import { createDefaultPolicyPack, entitlementStateSchema, type EntitlementState, type ExtensionEvent, type JustificationRequest, type PolicyPack } from "@promptshield/core";
import { randomUUID } from "node:crypto";

import { hashToken, randomToken } from "../lib/crypto.js";
import type {
  AuthBundle,
  BillingRecord,
  BillingUpdate,
  DataStore,
  DeviceCodeRecord,
  DeviceRecord,
  EventFilters,
  EventRecord,
  JustificationRecord,
  MagicLinkRecord,
  OrganizationRecord,
  OverviewRecord,
  PublishPolicyInput,
  RefreshTokenRecord,
  UserRecord
} from "./types.js";

type MemoryState = {
  organizations: Map<string, OrganizationRecord>;
  users: Map<string, UserRecord>;
  magicLinks: Map<string, MagicLinkRecord>;
  refreshTokens: Map<string, RefreshTokenRecord>;
  deviceCodes: Map<string, DeviceCodeRecord>;
  devices: Map<string, DeviceRecord>;
  policies: Map<string, PolicyPack>;
  events: Map<string, EventRecord>;
  justifications: Map<string, JustificationRecord>;
  billing: Map<string, BillingRecord>;
};

export type SerializedMemoryState = {
  version: 1;
  organizations: OrganizationRecord[];
  users: UserRecord[];
  magicLinks: MagicLinkRecord[];
  refreshTokens: RefreshTokenRecord[];
  deviceCodes: DeviceCodeRecord[];
  devices: DeviceRecord[];
  policies: PolicyPack[];
  events: EventRecord[];
  justifications: JustificationRecord[];
  billing: BillingRecord[];
};

function nowIso(): string {
  return new Date().toISOString();
}

function addDays(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function inferOrganizationName(email: string, orgName?: string): string {
  if (orgName?.trim()) {
    return orgName.trim();
  }
  const [localPart = "PromptShield"] = email.split("@");
  const base = localPart.replace(/[._-]+/g, " ").trim();
  return `${base.charAt(0).toUpperCase()}${base.slice(1)} Labs`;
}

export class MemoryStore implements DataStore {
  protected readonly state: MemoryState = {
    organizations: new Map(),
    users: new Map(),
    magicLinks: new Map(),
    refreshTokens: new Map(),
    deviceCodes: new Map(),
    devices: new Map(),
    policies: new Map(),
    events: new Map(),
    justifications: new Map(),
    billing: new Map()
  };

  constructor(
    protected readonly defaultTrialDays = 14,
    private readonly seedDemoTenantOnInitialize = true
  ) {}

  async initialize(): Promise<void> {
    if (!this.state.organizations.size && this.seedDemoTenantOnInitialize) {
      await this.seedDemoTenant();
    }
  }

  async createMagicLink(email: string, orgName?: string): Promise<{ token: string; session: AuthBundle }> {
    const session = this.findOrCreateUser(email, orgName);
    const token = randomToken(24);
    const record: MagicLinkRecord = {
      id: randomUUID(),
      tokenHash: hashToken(token),
      email,
      userId: session.user.id,
      orgId: session.organization.id,
      expiresAt: addDays(1),
      usedAt: null
    };
    this.state.magicLinks.set(record.id, record);
    return { token, session };
  }

  async consumeMagicLink(tokenHash: string): Promise<AuthBundle | null> {
    const link = Array.from(this.state.magicLinks.values()).find(
      (record) => record.tokenHash === tokenHash && record.usedAt === null && new Date(record.expiresAt) > new Date()
    );
    if (!link) {
      return null;
    }
    link.usedAt = nowIso();
    return this.getAuthBundle(link.userId, link.orgId);
  }

  async createRefreshToken(userId: string, orgId: string, tokenHash: string, expiresAt: string): Promise<void> {
    this.state.refreshTokens.set(tokenHash, {
      id: randomUUID(),
      tokenHash,
      userId,
      orgId,
      expiresAt,
      revokedAt: null
    });
  }

  async consumeRefreshToken(tokenHash: string): Promise<AuthBundle | null> {
    const token = this.state.refreshTokens.get(tokenHash);
    if (!token || token.revokedAt !== null || new Date(token.expiresAt) <= new Date()) {
      return null;
    }
    return this.getAuthBundle(token.userId, token.orgId);
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    const token = this.state.refreshTokens.get(tokenHash);
    if (token) {
      token.revokedAt = nowIso();
    }
  }

  async createDeviceCode(userId: string, orgId: string, expiresAt: string): Promise<DeviceCodeRecord> {
    const code = randomToken(4).slice(0, 8).toUpperCase();
    const record: DeviceCodeRecord = {
      id: randomUUID(),
      code,
      userId,
      orgId,
      expiresAt,
      usedAt: null
    };
    this.state.deviceCodes.set(code, record);
    return record;
  }

  async consumeDeviceCode(
    code: string,
    deviceId: string,
    extensionVersion: string | null
  ): Promise<(AuthBundle & { device: DeviceRecord }) | null> {
    const record = this.state.deviceCodes.get(code);
    if (!record || record.usedAt !== null || new Date(record.expiresAt) <= new Date()) {
      return null;
    }
    record.usedAt = nowIso();

    const authBundle = await this.getAuthBundle(record.userId, record.orgId);
    if (!authBundle) {
      return null;
    }

    const device: DeviceRecord = {
      id: deviceId,
      userId: record.userId,
      orgId: record.orgId,
      extensionVersion,
      lastSeenAt: nowIso(),
      status: "active"
    };
    this.state.devices.set(deviceId, device);

    return {
      ...authBundle,
      device
    };
  }

  async getAuthBundle(userId: string, orgId: string): Promise<AuthBundle | null> {
    const user = this.state.users.get(userId);
    const organization = this.state.organizations.get(orgId);
    const billing = this.state.billing.get(orgId);
    if (!user || !organization || !billing) {
      return null;
    }
    return {
      user,
      organization,
      entitlement: this.toEntitlement(billing)
    };
  }

  async getPolicy(orgId: string): Promise<PolicyPack> {
    const pack = this.state.policies.get(orgId) ?? createDefaultPolicyPack(orgId);
    this.state.policies.set(orgId, pack);
    return pack;
  }

  async publishPolicy(orgId: string, _userId: string, input: PublishPolicyInput): Promise<PolicyPack> {
    const current = await this.getPolicy(orgId);
    const nextPack: PolicyPack = {
      ...current,
      id: `${orgId}-v${current.version + 1}`,
      version: current.version + 1,
      name: input.name,
      protectedDomains: input.protectedDomains,
      rules: input.rules,
      status: "published"
    };
    this.state.policies.set(orgId, nextPack);
    return nextPack;
  }

  async recordEvents(orgId: string, userId: string, deviceId: string | undefined, events: ExtensionEvent[]): Promise<number> {
    events.forEach((event) => {
      this.state.events.set(event.id, {
        ...event,
        orgId,
        userId,
        deviceId
      });
    });
    return events.length;
  }

  async listEvents(orgId: string, filters: EventFilters): Promise<EventRecord[]> {
    return Array.from(this.state.events.values())
      .filter((event) => event.orgId === orgId)
      .filter((event) => !filters.severity || event.severity === filters.severity)
      .filter((event) => !filters.action || event.action === filters.action)
      .filter((event) => !filters.destinationDomain || event.destinationDomain === filters.destinationDomain)
      .filter((event) => {
        if (!filters.query) {
          return true;
        }
        const query = filters.query.toLowerCase();
        return (
          event.destinationDomain.toLowerCase().includes(query) ||
          event.detectorIds.some((id) => id.toLowerCase().includes(query))
        );
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async createJustification(orgId: string, userId: string, payload: JustificationRequest): Promise<JustificationRecord> {
    const record: JustificationRecord = {
      id: randomUUID(),
      orgId,
      userId,
      eventId: payload.eventId,
      text: payload.text,
      ticket: payload.ticket ?? null,
      status: "submitted",
      createdAt: nowIso()
    };
    this.state.justifications.set(record.id, record);
    return record;
  }

  async getOverview(orgId: string): Promise<OverviewRecord> {
    const organization = this.state.organizations.get(orgId);
    const billing = this.state.billing.get(orgId);
    const users = Array.from(this.state.users.values()).filter((user) => user.orgId === orgId);
    const events = Array.from(this.state.events.values()).filter((event) => event.orgId === orgId);
    const policy = await this.getPolicy(orgId);

    if (!organization || !billing) {
      throw new Error("Organization not found");
    }

    const detectorCounts = new Map<string, number>();
    events.forEach((event) => {
      event.detectorIds.forEach((detectorId) => {
        detectorCounts.set(detectorId, (detectorCounts.get(detectorId) ?? 0) + 1);
      });
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return {
      organization,
      entitlement: this.toEntitlement(billing),
      activeSeats: users.length,
      eventsToday: events.filter((event) => new Date(event.createdAt) >= startOfDay).length,
      totalPolicies: policy.rules.length,
      recentEvents: events.sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 10),
      topDetectors: Array.from(detectorCounts.entries())
        .map(([detectorId, count]) => ({ detectorId, count }))
        .sort((left, right) => right.count - left.count)
        .slice(0, 5)
    };
  }

  async listUsersAndDevices(orgId: string): Promise<Array<UserRecord & { devices: DeviceRecord[] }>> {
    const devicesByUser = new Map<string, DeviceRecord[]>();
    Array.from(this.state.devices.values())
      .filter((device) => device.orgId === orgId)
      .forEach((device) => {
        const existing = devicesByUser.get(device.userId) ?? [];
        existing.push(device);
        devicesByUser.set(device.userId, existing);
      });

    return Array.from(this.state.users.values())
      .filter((user) => user.orgId === orgId)
      .map((user) => ({
        ...user,
        devices: devicesByUser.get(user.id) ?? []
      }));
  }

  async updateBilling(update: BillingUpdate): Promise<BillingRecord> {
    const current = this.state.billing.get(update.orgId);
    const next: BillingRecord = {
      orgId: update.orgId,
      stripeCustomerId: update.stripeCustomerId ?? current?.stripeCustomerId ?? null,
      stripeSubscriptionId: update.stripeSubscriptionId ?? current?.stripeSubscriptionId ?? null,
      state: update.state ?? current?.state ?? "trialing",
      plan: update.plan ?? current?.plan ?? "team",
      seatLimit: update.seatLimit ?? current?.seatLimit ?? 10,
      trialEndsAt: update.trialEndsAt ?? current?.trialEndsAt ?? addDays(this.defaultTrialDays),
      currentPeriodEnd: update.currentPeriodEnd ?? current?.currentPeriodEnd ?? null
    };
    this.state.billing.set(update.orgId, next);
    return next;
  }

  async getBilling(orgId: string): Promise<BillingRecord> {
    const billing = this.state.billing.get(orgId);
    if (!billing) {
      return this.updateBilling({ orgId });
    }
    return billing;
  }

  async cleanupExpiredRecords(): Promise<void> {
    const now = new Date();

    Array.from(this.state.magicLinks.entries()).forEach(([id, record]) => {
      if (new Date(record.expiresAt) <= now) {
        this.state.magicLinks.delete(id);
      }
    });

    Array.from(this.state.refreshTokens.entries()).forEach(([tokenHash, record]) => {
      if (record.revokedAt !== null || new Date(record.expiresAt) <= now) {
        this.state.refreshTokens.delete(tokenHash);
      }
    });

    Array.from(this.state.deviceCodes.entries()).forEach(([code, record]) => {
      if (record.usedAt !== null || new Date(record.expiresAt) <= now) {
        this.state.deviceCodes.delete(code);
      }
    });
  }

  private findOrCreateUser(email: string, orgName?: string): AuthBundle {
    const existingUser = Array.from(this.state.users.values()).find((user) => user.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      const organization = this.state.organizations.get(existingUser.orgId);
      const billing = this.state.billing.get(existingUser.orgId);
      if (!organization || !billing) {
        throw new Error("Corrupt store state");
      }
      return {
        user: existingUser,
        organization,
        entitlement: this.toEntitlement(billing)
      };
    }

    const orgId = randomUUID();
    const organization: OrganizationRecord = {
      id: orgId,
      name: inferOrganizationName(email, orgName),
      plan: "team",
      status: "trialing",
      createdAt: nowIso()
    };
    const user: UserRecord = {
      id: randomUUID(),
      orgId,
      email,
      role: "owner",
      createdAt: nowIso()
    };

    this.state.organizations.set(orgId, organization);
    this.state.users.set(user.id, user);
    this.state.policies.set(orgId, createDefaultPolicyPack(orgId));
    this.state.billing.set(orgId, {
      orgId,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      state: "trialing",
      plan: "team",
      seatLimit: 10,
      trialEndsAt: addDays(this.defaultTrialDays),
      currentPeriodEnd: null
    });

    return {
      user,
      organization,
      entitlement: entitlementStateSchema.parse({
        plan: "team",
        status: "trialing",
        seatLimit: 10,
        trialEndsAt: addDays(this.defaultTrialDays)
      })
    };
  }

  private toEntitlement(billing: BillingRecord): EntitlementState {
    return entitlementStateSchema.parse({
      plan: billing.plan,
      status: billing.state,
      seatLimit: billing.seatLimit,
      trialEndsAt: billing.trialEndsAt
    });
  }

  protected snapshotState(): SerializedMemoryState {
    return {
      version: 1,
      organizations: Array.from(this.state.organizations.values()),
      users: Array.from(this.state.users.values()),
      magicLinks: Array.from(this.state.magicLinks.values()),
      refreshTokens: Array.from(this.state.refreshTokens.values()),
      deviceCodes: Array.from(this.state.deviceCodes.values()),
      devices: Array.from(this.state.devices.values()),
      policies: Array.from(this.state.policies.values()),
      events: Array.from(this.state.events.values()),
      justifications: Array.from(this.state.justifications.values()),
      billing: Array.from(this.state.billing.values())
    };
  }

  protected restoreState(snapshot: SerializedMemoryState): void {
    this.state.organizations.clear();
    this.state.users.clear();
    this.state.magicLinks.clear();
    this.state.refreshTokens.clear();
    this.state.deviceCodes.clear();
    this.state.devices.clear();
    this.state.policies.clear();
    this.state.events.clear();
    this.state.justifications.clear();
    this.state.billing.clear();

    snapshot.organizations.forEach((record) => this.state.organizations.set(record.id, record));
    snapshot.users.forEach((record) => this.state.users.set(record.id, record));
    snapshot.magicLinks.forEach((record) => this.state.magicLinks.set(record.id, record));
    snapshot.refreshTokens.forEach((record) => this.state.refreshTokens.set(record.tokenHash, record));
    snapshot.deviceCodes.forEach((record) => this.state.deviceCodes.set(record.code, record));
    snapshot.devices.forEach((record) => this.state.devices.set(record.id, record));
    snapshot.policies.forEach((record) => {
      if (record.orgId) {
        this.state.policies.set(record.orgId, record);
      }
    });
    snapshot.events.forEach((record) => this.state.events.set(record.id, record));
    snapshot.justifications.forEach((record) => this.state.justifications.set(record.id, record));
    snapshot.billing.forEach((record) => this.state.billing.set(record.orgId, record));
  }

  protected async seedDemoTenant(): Promise<void> {
    const { session } = await this.createMagicLink("demo@promptshield.dev", "PromptShield Demo");
    const trialEndsAt = addDays(this.defaultTrialDays);
    await this.updateBilling({
      orgId: session.organization.id,
      plan: "team",
      state: "trialing",
      seatLimit: 25,
      trialEndsAt
    });

    await this.recordEvents(session.organization.id, session.user.id, undefined, [
      {
        id: randomUUID(),
        eventType: "block",
        severity: "high",
        detectorIds: ["api_key"],
        ruleIds: ["secret-api-key"],
        destinationDomain: "chatgpt.com",
        action: "block",
        createdAt: nowIso()
      },
      {
        id: randomUUID(),
        eventType: "redact",
        severity: "medium",
        detectorIds: ["email"],
        ruleIds: ["personal-email"],
        destinationDomain: "claude.ai",
        action: "redact",
        createdAt: nowIso()
      }
    ]);
  }
}
