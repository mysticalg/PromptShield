import { createDefaultPolicyPack, entitlementStateSchema, type EntitlementState, type ExtensionEvent, type JustificationRequest, type PolicyPack } from "@promptshield/core";
import { randomUUID } from "node:crypto";
import postgres, { type Sql } from "postgres";

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
  OrganizationRecord,
  OverviewRecord,
  PublishPolicyInput,
  UserRecord
} from "./types.js";

function nowIso(): string {
  return new Date().toISOString();
}

function addDays(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function toIso(value: string | Date | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return new Date(value).toISOString();
}

function inferOrganizationName(email: string, orgName?: string): string {
  if (orgName?.trim()) {
    return orgName.trim();
  }
  const [localPart = "PromptShield"] = email.split("@");
  const base = localPart.replace(/[._-]+/g, " ").trim();
  return `${base.charAt(0).toUpperCase()}${base.slice(1)} Labs`;
}

type OrganizationRow = {
  id: string;
  name: string;
  plan: BillingRecord["plan"];
  status: BillingRecord["state"];
  created_at: string;
};

type UserRow = {
  id: string;
  org_id: string;
  email: string;
  role: UserRecord["role"];
  created_at: string;
};

type BillingRow = {
  org_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  state: BillingRecord["state"];
  plan: BillingRecord["plan"];
  seat_limit: number;
  trial_ends_at: string | null;
  current_period_end: string | null;
};

type DeviceRow = {
  id: string;
  user_id: string;
  org_id: string;
  extension_version: string | null;
  last_seen_at: string;
  status: DeviceRecord["status"];
};

type EventRow = {
  id: string;
  org_id: string;
  user_id: string;
  device_id: string | null;
  event_type: ExtensionEvent["eventType"];
  severity: ExtensionEvent["severity"];
  detector_ids: string[];
  rule_ids: string[];
  destination_domain: string;
  action: ExtensionEvent["action"];
  file_metadata: ExtensionEvent["fileMetadata"] | null;
  content_hash: string | null;
  created_at: string;
};

export class PostgresStore implements DataStore {
  private readonly sql: Sql;

  constructor(connectionString: string, private readonly defaultTrialDays = 14) {
    this.sql = postgres(connectionString, {
      max: 5,
      onnotice: () => {}
    });
  }

  async initialize(): Promise<void> {
    await this.sql`
      create table if not exists organizations (
        id text primary key,
        name text not null,
        plan text not null,
        status text not null,
        created_at timestamptz not null default now()
      )
    `;
    await this.sql`
      create table if not exists users (
        id text primary key,
        org_id text not null references organizations(id) on delete cascade,
        email text not null unique,
        role text not null,
        created_at timestamptz not null default now()
      )
    `;
    await this.sql`
      create table if not exists billing_accounts (
        org_id text primary key references organizations(id) on delete cascade,
        stripe_customer_id text,
        stripe_subscription_id text,
        state text not null,
        plan text not null,
        seat_limit integer not null,
        trial_ends_at timestamptz,
        current_period_end timestamptz
      )
    `;
    await this.sql`
      create table if not exists policy_packs (
        id text primary key,
        org_id text not null references organizations(id) on delete cascade,
        version integer not null,
        name text not null,
        status text not null,
        protected_domains jsonb not null,
        rules jsonb not null,
        created_by text,
        created_at timestamptz not null default now(),
        unique (org_id, version)
      )
    `;
    await this.sql`
      create table if not exists magic_links (
        id text primary key,
        token_hash text not null unique,
        email text not null,
        user_id text not null references users(id) on delete cascade,
        org_id text not null references organizations(id) on delete cascade,
        expires_at timestamptz not null,
        used_at timestamptz
      )
    `;
    await this.sql`
      create table if not exists refresh_tokens (
        id text primary key,
        token_hash text not null unique,
        user_id text not null references users(id) on delete cascade,
        org_id text not null references organizations(id) on delete cascade,
        expires_at timestamptz not null,
        revoked_at timestamptz
      )
    `;
    await this.sql`
      create table if not exists device_codes (
        id text primary key,
        code text not null unique,
        user_id text not null references users(id) on delete cascade,
        org_id text not null references organizations(id) on delete cascade,
        expires_at timestamptz not null,
        used_at timestamptz
      )
    `;
    await this.sql`
      create table if not exists devices (
        id text primary key,
        user_id text not null references users(id) on delete cascade,
        org_id text not null references organizations(id) on delete cascade,
        extension_version text,
        last_seen_at timestamptz not null,
        status text not null
      )
    `;
    await this.sql`
      create table if not exists events (
        id text primary key,
        org_id text not null references organizations(id) on delete cascade,
        user_id text not null references users(id) on delete cascade,
        device_id text,
        event_type text not null,
        severity text not null,
        detector_ids jsonb not null,
        rule_ids jsonb not null,
        destination_domain text not null,
        action text not null,
        file_metadata jsonb,
        content_hash text,
        created_at timestamptz not null
      )
    `;
    await this.sql`
      create table if not exists justifications (
        id text primary key,
        org_id text not null references organizations(id) on delete cascade,
        user_id text not null references users(id) on delete cascade,
        event_id text not null,
        text text not null,
        ticket text,
        status text not null,
        created_at timestamptz not null
      )
    `;
  }

  async createMagicLink(email: string, orgName?: string): Promise<{ token: string; session: AuthBundle }> {
    const session = await this.findOrCreateUser(email, orgName);
    const token = randomToken(24);
    await this.sql`
      insert into magic_links (id, token_hash, email, user_id, org_id, expires_at, used_at)
      values (${randomUUID()}, ${hashToken(token)}, ${email}, ${session.user.id}, ${session.organization.id}, ${addDays(1)}, ${null})
    `;
    return { token, session };
  }

  async consumeMagicLink(tokenHash: string): Promise<AuthBundle | null> {
    const rows = await this.sql<{ user_id: string; org_id: string }[]>`
      update magic_links
      set used_at = now()
      where token_hash = ${tokenHash}
        and used_at is null
        and expires_at > now()
      returning user_id, org_id
    `;
    const record = rows[0];
    if (!record) {
      return null;
    }
    return this.getAuthBundle(record.user_id, record.org_id);
  }

  async createRefreshToken(userId: string, orgId: string, tokenHash: string, expiresAt: string): Promise<void> {
    await this.sql`
      insert into refresh_tokens (id, token_hash, user_id, org_id, expires_at, revoked_at)
      values (${randomUUID()}, ${tokenHash}, ${userId}, ${orgId}, ${expiresAt}, ${null})
    `;
  }

  async consumeRefreshToken(tokenHash: string): Promise<AuthBundle | null> {
    const rows = await this.sql<{ user_id: string; org_id: string }[]>`
      select user_id, org_id
      from refresh_tokens
      where token_hash = ${tokenHash}
        and revoked_at is null
        and expires_at > now()
      limit 1
    `;
    const token = rows[0];
    if (!token) {
      return null;
    }
    return this.getAuthBundle(token.user_id, token.org_id);
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await this.sql`
      update refresh_tokens
      set revoked_at = now()
      where token_hash = ${tokenHash}
    `;
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
    await this.sql`
      insert into device_codes (id, code, user_id, org_id, expires_at, used_at)
      values (${record.id}, ${record.code}, ${userId}, ${orgId}, ${expiresAt}, ${null})
    `;
    return record;
  }

  async consumeDeviceCode(
    code: string,
    deviceId: string,
    extensionVersion: string | null
  ): Promise<(AuthBundle & { device: DeviceRecord }) | null> {
    const rows = await this.sql<{ user_id: string; org_id: string }[]>`
      update device_codes
      set used_at = now()
      where code = ${code}
        and used_at is null
        and expires_at > now()
      returning user_id, org_id
    `;
    const record = rows[0];
    if (!record) {
      return null;
    }

    await this.sql`
      insert into devices (id, user_id, org_id, extension_version, last_seen_at, status)
      values (${deviceId}, ${record.user_id}, ${record.org_id}, ${extensionVersion}, ${nowIso()}, ${"active"})
      on conflict (id) do update
      set extension_version = excluded.extension_version,
          last_seen_at = excluded.last_seen_at,
          status = excluded.status
    `;

    const bundle = await this.getAuthBundle(record.user_id, record.org_id);
    if (!bundle) {
      return null;
    }

    return {
      ...bundle,
      device: {
        id: deviceId,
        userId: record.user_id,
        orgId: record.org_id,
        extensionVersion,
        lastSeenAt: nowIso(),
        status: "active"
      }
    };
  }

  async getAuthBundle(userId: string, orgId: string): Promise<AuthBundle | null> {
    const userRows = await this.sql<UserRow[]>`
      select id, org_id, email, role, created_at
      from users
      where id = ${userId} and org_id = ${orgId}
      limit 1
    `;
    const orgRows = await this.sql<OrganizationRow[]>`
      select id, name, plan, status, created_at
      from organizations
      where id = ${orgId}
      limit 1
    `;
    const billingRows = await this.sql<BillingRow[]>`
      select org_id, stripe_customer_id, stripe_subscription_id, state, plan, seat_limit, trial_ends_at, current_period_end
      from billing_accounts
      where org_id = ${orgId}
      limit 1
    `;

    const user = userRows[0];
    const organization = orgRows[0];
    const billing = billingRows[0];
    if (!user || !organization || !billing) {
      return null;
    }

    return {
      user: this.mapUser(user),
      organization: this.mapOrganization(organization),
      entitlement: this.toEntitlement(this.mapBilling(billing))
    };
  }

  async getPolicy(orgId: string): Promise<PolicyPack> {
    const rows = await this.sql<{ id: string; org_id: string; version: number; name: string; status: "draft" | "published"; protected_domains: string[]; rules: PolicyPack["rules"] }[]>`
      select id, org_id, version, name, status, protected_domains, rules
      from policy_packs
      where org_id = ${orgId}
      order by version desc
      limit 1
    `;
    const current = rows[0];
    if (current) {
      return {
        id: current.id,
        orgId: current.org_id,
        version: current.version,
        name: current.name,
        status: current.status,
        protectedDomains: current.protected_domains,
        rules: current.rules
      };
    }

    const defaultPack = createDefaultPolicyPack(orgId);
    await this.sql`
      insert into policy_packs (id, org_id, version, name, status, protected_domains, rules, created_by)
      values (
        ${defaultPack.id},
        ${orgId},
        ${defaultPack.version},
        ${defaultPack.name},
        ${defaultPack.status},
        ${this.sql.json(defaultPack.protectedDomains)},
        ${this.sql.json(defaultPack.rules)},
        ${null}
      )
    `;
    return defaultPack;
  }

  async publishPolicy(orgId: string, userId: string, input: PublishPolicyInput): Promise<PolicyPack> {
    const current = await this.getPolicy(orgId);
    const nextPolicy: PolicyPack = {
      ...current,
      id: `${orgId}-v${current.version + 1}`,
      version: current.version + 1,
      name: input.name,
      protectedDomains: input.protectedDomains,
      rules: input.rules,
      status: "published"
    };
    await this.sql`
      insert into policy_packs (id, org_id, version, name, status, protected_domains, rules, created_by)
      values (
        ${nextPolicy.id},
        ${orgId},
        ${nextPolicy.version},
        ${nextPolicy.name},
        ${nextPolicy.status},
        ${this.sql.json(nextPolicy.protectedDomains)},
        ${this.sql.json(nextPolicy.rules)},
        ${userId}
      )
    `;
    return nextPolicy;
  }

  async recordEvents(orgId: string, userId: string, deviceId: string | undefined, events: ExtensionEvent[]): Promise<number> {
    if (!events.length) {
      return 0;
    }
    const inserts = events.map((event) => ({
      id: event.id,
      org_id: orgId,
      user_id: userId,
      device_id: deviceId ?? null,
      event_type: event.eventType,
      severity: event.severity,
      detector_ids: this.sql.json(event.detectorIds),
      rule_ids: this.sql.json(event.ruleIds),
      destination_domain: event.destinationDomain,
      action: event.action,
      file_metadata: this.sql.json(event.fileMetadata ?? null),
      content_hash: event.contentHash ?? null,
      created_at: event.createdAt
    }));

    await this.sql`
      insert into events ${this.sql(inserts)}
    `;
    return events.length;
  }

  async listEvents(orgId: string, filters: EventFilters): Promise<EventRecord[]> {
    const rows = await this.sql<EventRow[]>`
      select id, org_id, user_id, device_id, event_type, severity, detector_ids, rule_ids, destination_domain, action, file_metadata, content_hash, created_at
      from events
      where org_id = ${orgId}
      order by created_at desc
    `;

    return rows
      .map((row) => this.mapEvent(row))
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
          event.detectorIds.some((detectorId) => detectorId.toLowerCase().includes(query)) ||
          event.ruleIds.some((ruleId) => ruleId.toLowerCase().includes(query))
        );
      });
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
    await this.sql`
      insert into justifications (id, org_id, user_id, event_id, text, ticket, status, created_at)
      values (${record.id}, ${orgId}, ${userId}, ${record.eventId}, ${record.text}, ${record.ticket}, ${record.status}, ${record.createdAt})
    `;
    return record;
  }

  async getOverview(orgId: string): Promise<OverviewRecord> {
    const authBundle = await this.getAnyBundleForOrg(orgId);
    if (!authBundle) {
      throw new Error("Organization not found");
    }

    const seatCountRows = await this.sql<{ count: string }[]>`
      select count(*)::text as count
      from users
      where org_id = ${orgId}
    `;
    const eventsTodayRows = await this.sql<{ count: string }[]>`
      select count(*)::text as count
      from events
      where org_id = ${orgId}
        and created_at >= date_trunc('day', now())
    `;
    const policyCountRows = await this.sql<{ count: string }[]>`
      select jsonb_array_length(rules)::text as count
      from policy_packs
      where org_id = ${orgId}
      order by version desc
      limit 1
    `;

    const recentEvents = (await this.listEvents(orgId, {})).slice(0, 10);
    const detectorCounts = new Map<string, number>();
    (await this.listEvents(orgId, {})).forEach((event) => {
      event.detectorIds.forEach((detectorId) => {
        detectorCounts.set(detectorId, (detectorCounts.get(detectorId) ?? 0) + 1);
      });
    });

    return {
      organization: authBundle.organization,
      entitlement: authBundle.entitlement,
      activeSeats: Number(seatCountRows[0]?.count ?? "0"),
      eventsToday: Number(eventsTodayRows[0]?.count ?? "0"),
      totalPolicies: Number(policyCountRows[0]?.count ?? "0"),
      recentEvents,
      topDetectors: Array.from(detectorCounts.entries())
        .map(([detectorId, count]) => ({ detectorId, count }))
        .sort((left, right) => right.count - left.count)
        .slice(0, 5)
    };
  }

  async listUsersAndDevices(orgId: string): Promise<Array<UserRecord & { devices: DeviceRecord[] }>> {
    const users = await this.sql<UserRow[]>`
      select id, org_id, email, role, created_at
      from users
      where org_id = ${orgId}
      order by created_at asc
    `;
    const devices = await this.sql<DeviceRow[]>`
      select id, user_id, org_id, extension_version, last_seen_at, status
      from devices
      where org_id = ${orgId}
      order by last_seen_at desc
    `;

    return users.map((user) => ({
      ...this.mapUser(user),
      devices: devices.filter((device) => device.user_id === user.id).map((device) => this.mapDevice(device))
    }));
  }

  async updateBilling(update: BillingUpdate): Promise<BillingRecord> {
    const current = await this.getBilling(update.orgId).catch(() => null);
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

    await this.sql`
      insert into billing_accounts (org_id, stripe_customer_id, stripe_subscription_id, state, plan, seat_limit, trial_ends_at, current_period_end)
      values (
        ${next.orgId},
        ${next.stripeCustomerId},
        ${next.stripeSubscriptionId},
        ${next.state},
        ${next.plan},
        ${next.seatLimit},
        ${next.trialEndsAt},
        ${next.currentPeriodEnd}
      )
      on conflict (org_id) do update
      set stripe_customer_id = excluded.stripe_customer_id,
          stripe_subscription_id = excluded.stripe_subscription_id,
          state = excluded.state,
          plan = excluded.plan,
          seat_limit = excluded.seat_limit,
          trial_ends_at = excluded.trial_ends_at,
          current_period_end = excluded.current_period_end
    `;

    await this.sql`
      update organizations
      set plan = ${next.plan},
          status = ${next.state}
      where id = ${next.orgId}
    `;

    return next;
  }

  async getBilling(orgId: string): Promise<BillingRecord> {
    const rows = await this.sql<BillingRow[]>`
      select org_id, stripe_customer_id, stripe_subscription_id, state, plan, seat_limit, trial_ends_at, current_period_end
      from billing_accounts
      where org_id = ${orgId}
      limit 1
    `;
    const billing = rows[0];
    if (!billing) {
      return this.updateBilling({ orgId });
    }
    return this.mapBilling(billing);
  }

  async cleanupExpiredRecords(): Promise<void> {
    await this.sql`
      delete from magic_links where expires_at <= now() or used_at is not null;
      delete from refresh_tokens where expires_at <= now() or revoked_at is not null;
      delete from device_codes where expires_at <= now() or used_at is not null;
    `;
  }

  private async findOrCreateUser(email: string, orgName?: string): Promise<AuthBundle> {
    const existingUsers = await this.sql<UserRow[]>`
      select id, org_id, email, role, created_at
      from users
      where lower(email) = lower(${email})
      limit 1
    `;
    const existingUser = existingUsers[0];
    if (existingUser) {
      const bundle = await this.getAuthBundle(existingUser.id, existingUser.org_id);
      if (!bundle) {
        throw new Error("Failed to load account");
      }
      return bundle;
    }

    const orgId = randomUUID();
    const userId = randomUUID();
    const createdAt = nowIso();
    const organizationName = inferOrganizationName(email, orgName);
    const policy = createDefaultPolicyPack(orgId);

    await this.sql`
      insert into organizations (id, name, plan, status, created_at)
      values (${orgId}, ${organizationName}, ${"team"}, ${"trialing"}, ${createdAt})
    `;
    await this.sql`
      insert into users (id, org_id, email, role, created_at)
      values (${userId}, ${orgId}, ${email}, ${"owner"}, ${createdAt})
    `;
    await this.sql`
      insert into billing_accounts (org_id, stripe_customer_id, stripe_subscription_id, state, plan, seat_limit, trial_ends_at, current_period_end)
      values (${orgId}, ${null}, ${null}, ${"trialing"}, ${"team"}, ${10}, ${addDays(this.defaultTrialDays)}, ${null})
    `;
    await this.sql`
      insert into policy_packs (id, org_id, version, name, status, protected_domains, rules, created_by)
      values (
        ${policy.id},
        ${orgId},
        ${policy.version},
        ${policy.name},
        ${policy.status},
        ${this.sql.json(policy.protectedDomains)},
        ${this.sql.json(policy.rules)},
        ${userId}
      )
    `;

    const bundle = await this.getAuthBundle(userId, orgId);
    if (!bundle) {
      throw new Error("Failed to create account");
    }
    return bundle;
  }

  private async getAnyBundleForOrg(orgId: string): Promise<AuthBundle | null> {
    const users = await this.sql<UserRow[]>`
      select id, org_id, email, role, created_at
      from users
      where org_id = ${orgId}
      order by created_at asc
      limit 1
    `;
    const user = users[0];
    if (!user) {
      return null;
    }
    return this.getAuthBundle(user.id, orgId);
  }

  private mapOrganization(row: OrganizationRow): OrganizationRecord {
    return {
      id: row.id,
      name: row.name,
      plan: row.plan,
      status: row.status,
      createdAt: toIso(row.created_at) ?? nowIso()
    };
  }

  private mapUser(row: UserRow): UserRecord {
    return {
      id: row.id,
      orgId: row.org_id,
      email: row.email,
      role: row.role,
      createdAt: toIso(row.created_at) ?? nowIso()
    };
  }

  private mapDevice(row: DeviceRow): DeviceRecord {
    return {
      id: row.id,
      userId: row.user_id,
      orgId: row.org_id,
      extensionVersion: row.extension_version,
      lastSeenAt: toIso(row.last_seen_at) ?? nowIso(),
      status: row.status
    };
  }

  private mapBilling(row: BillingRow): BillingRecord {
    return {
      orgId: row.org_id,
      stripeCustomerId: row.stripe_customer_id,
      stripeSubscriptionId: row.stripe_subscription_id,
      state: row.state,
      plan: row.plan,
      seatLimit: row.seat_limit,
      trialEndsAt: toIso(row.trial_ends_at),
      currentPeriodEnd: toIso(row.current_period_end)
    };
  }

  private mapEvent(row: EventRow): EventRecord {
    return {
      id: row.id,
      orgId: row.org_id,
      userId: row.user_id,
      deviceId: row.device_id ?? undefined,
      eventType: row.event_type,
      severity: row.severity,
      detectorIds: row.detector_ids,
      ruleIds: row.rule_ids,
      destinationDomain: row.destination_domain,
      action: row.action,
      fileMetadata: row.file_metadata ?? undefined,
      contentHash: row.content_hash ?? undefined,
      createdAt: toIso(row.created_at) ?? nowIso()
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
}
