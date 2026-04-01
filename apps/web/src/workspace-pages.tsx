import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation } from "react-router-dom";

import {
  actionLabel,
  buildActionMix,
  buildPressureIndex,
  buildPresentationOverview,
  buildSeverityMix,
  buildTrend,
  detectorLabel,
  getWorkspaceDefinition,
  overviewSummary,
  pickSpotlight,
  recommendationForEvent,
  sampleRecentEvents,
  titleCase,
  type BillingData,
  type DashboardEvent,
  type OverviewData,
  type PolicyData,
  type UserWithDevices
} from "./app-data";
import { apiRequest, API_BASE_URL } from "./lib/api";
import { storeSession } from "./lib/session";
import { useSessionContext } from "./session-context";

function TonePill({ label, tone }: { label: string; tone: string }) {
  return <span className={`tone-pill tone-${tone}`}>{label}</span>;
}

export function ProtectedLayout() {
  const { session, setSession } = useSessionContext();
  const location = useLocation();
  const workspace = getWorkspaceDefinition(location.pathname);

  if (!session) {
    return <Navigate to="/login" replace state={{ next: location.pathname }} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <p className="eyebrow">PromptShield</p>
          <h1>{session.organization.name}</h1>
          <p className="sidebar-copy">Policy-pack deployment for browser-side GenAI controls.</p>
        </div>

        <nav className="nav-links">
          <NavLink to="/app/overview">Overview</NavLink>
          <NavLink to="/app/policies">Policies</NavLink>
          <NavLink to="/app/events">Events</NavLink>
          <NavLink to="/app/users">Users and devices</NavLink>
          <NavLink to="/app/billing">Billing</NavLink>
          <NavLink to="/app/settings">Settings</NavLink>
        </nav>

        <div className="sidebar-bottom">
          <Link className="text-link" to="/trust">
            Trust Center
          </Link>
          <button
            className="secondary-button"
            onClick={() => {
              setSession(null);
              storeSession(null);
            }}
            type="button"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">{workspace.eyebrow}</p>
            <h2>{workspace.title}</h2>
            <p className="workspace-copy">{workspace.description}</p>
          </div>
          <div className="workspace-header-meta">
            <span className="meta-pill">{session.user.email}</span>
            <span className="meta-pill">{titleCase(session.entitlement.plan)}</span>
            <span className="meta-pill">{titleCase(session.entitlement.status)}</span>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}

export function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [deviceCode, setDeviceCode] = useState<string | null>(null);

  useEffect(() => {
    void apiRequest<OverviewData>("/v1/admin/overview").then((payload) => {
      startTransition(() => setData(payload));
    });
  }, []);

  async function createDeviceCode() {
    const response = await apiRequest<{ code: string; expiresAt: string }>("/v1/auth/device-codes", {
      method: "POST"
    });
    setDeviceCode(`${response.code} | expires ${new Date(response.expiresAt).toLocaleTimeString()}`);
  }

  const overview = useMemo(() => (data ? buildPresentationOverview(data) : null), [data]);

  if (!overview) {
    return <div className="panel">Loading overview...</div>;
  }

  const actionMix = buildActionMix(overview.recentEvents);
  const severityMix = buildSeverityMix(overview.recentEvents);
  const trend = buildTrend(overview.recentEvents);
  const spotlight = pickSpotlight(overview.recentEvents);
  const leadAction = actionMix.find((item) => item.count > 0)?.action;
  const activeDetectorFamilies = new Set([
    ...overview.topDetectors.map((item) => item.detectorId),
    ...overview.recentEvents.flatMap((event) => event.detectorIds)
  ]).size;
  const protectedDestinations = new Set(overview.recentEvents.map((event) => event.destinationDomain)).size;
  const pressureIndex = buildPressureIndex(overview.recentEvents);

  return (
    <div className="page-grid">
      {overview.usingSampleData ? (
        <div className="inline-banner">Showing representative signal until the tenant's first live interventions arrive.</div>
      ) : null}

      <section className="panel overview-hero">
        <div>
          <p className="eyebrow">Executive snapshot</p>
          <h3>{pressureIndex} / 100 protection pressure</h3>
          <p className="overview-summary">{overviewSummary(leadAction, overview.eventsToday, protectedDestinations)}</p>
          <div className="overview-tags">
            <span className="meta-pill">{activeDetectorFamilies} active detector families</span>
            <span className="meta-pill">{protectedDestinations} protected destinations in feed</span>
            <span className="meta-pill">{overview.topDetectors.length} ranked detector trends</span>
          </div>
        </div>

        <div className="overview-actions">
          <button className="primary-button" onClick={createDeviceCode} type="button">
            Generate activation code
          </button>
          <NavLink className="secondary-button" to="/app/policies">
            Adjust policies
          </NavLink>
          <p className="muted-copy">
            {deviceCode ?? "Issue short-lived activation codes when you need to onboard another protected browser."}
          </p>
        </div>
      </section>

      <section className="stat-row stat-row-four">
        <article className="stat-panel">
          <span>Active seats</span>
          <strong>{overview.activeSeats}</strong>
        </article>
        <article className="stat-panel">
          <span>Events today</span>
          <strong>{overview.eventsToday}</strong>
        </article>
        <article className="stat-panel">
          <span>Policy rules</span>
          <strong>{overview.totalPolicies}</strong>
        </article>
        <article className="stat-panel">
          <span>Top detector families</span>
          <strong>{activeDetectorFamilies}</strong>
        </article>
      </section>

      <div className="overview-detail-grid">
        <section className="panel">
          <div className="section-heading">
            <p className="eyebrow">Signal volume</p>
            <h3>Interventions over the last six hours</h3>
          </div>
          <div className="trend-chart">
            {trend.map((point) => (
              <div key={point.key} className="trend-column">
                <div className="trend-bar">
                  <div className="trend-bar-fill" style={{ height: point.height }} />
                </div>
                <strong>{point.count}</strong>
                <span>{point.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <p className="eyebrow">Response mix</p>
            <h3>How PromptShield is intervening right now</h3>
          </div>
          <div className="stack-list">
            {actionMix.map((item) => (
              <div key={item.action}>
                <div className="bar-copy">
                  <span>{actionLabel(item.action)}</span>
                  <strong>{item.count}</strong>
                </div>
                <div className="bar-track">
                  <div className={`bar-fill tone-${item.action}`} style={{ width: item.width }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="overview-detail-grid">
        <section className="panel incident-panel">
          <div className="section-heading">
            <p className="eyebrow">Incident spotlight</p>
            <h3>{spotlight ? `${actionLabel(spotlight.action)} on ${spotlight.destinationDomain}` : "No incidents yet"}</h3>
          </div>

          {spotlight ? (
            <>
              <div className="incident-header">
                <TonePill label={titleCase(spotlight.severity)} tone={spotlight.action} />
                <span>{new Date(spotlight.createdAt).toLocaleString()}</span>
              </div>
              <p className="incident-copy">{recommendationForEvent(spotlight)}</p>
              <div className="incident-tags">
                {spotlight.detectorIds.map((detectorId) => (
                  <span key={detectorId} className="meta-pill">
                    {detectorLabel(detectorId)}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="muted-copy">No intervention events are available yet.</p>
          )}
        </section>

        <section className="panel">
          <div className="section-heading">
            <p className="eyebrow">Severity split</p>
            <h3>Where the pressure is concentrated</h3>
          </div>
          <div className="stack-list">
            {severityMix.map((item) => (
              <div key={item.severity}>
                <div className="bar-copy">
                  <span>{titleCase(item.severity)}</span>
                  <strong>{item.count}</strong>
                </div>
                <div className="bar-track">
                  <div className={`bar-fill severity-${item.severity}`} style={{ width: item.width }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Recent incidents</p>
          <h3>Latest intervention events</h3>
        </div>
        <div className="timeline-list compact">
          {overview.recentEvents.slice(0, 6).map((event) => (
            <div key={event.id} className="timeline-row">
              <div>
                <TonePill label={actionLabel(event.action)} tone={event.action} />
                <strong>{event.destinationDomain}</strong>
              </div>
              <span>{event.detectorIds.map(detectorLabel).join(", ")}</span>
              <span>{new Date(event.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function PoliciesPage() {
  const [policy, setPolicy] = useState<PolicyData | null>(null);
  const [domainsText, setDomainsText] = useState("");
  const [rulesText, setRulesText] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    void apiRequest<PolicyData>("/v1/admin/policies/current").then((current) => {
      setPolicy(current);
      setDomainsText(current.protectedDomains.join("\n"));
      setRulesText(JSON.stringify(current.rules, null, 2));
    });
  }, []);

  async function publishPolicy() {
    if (!policy) {
      return;
    }
    setStatus("Publishing...");
    try {
      const nextPolicy = await apiRequest<PolicyData>("/v1/admin/policies/publish", {
        method: "POST",
        body: JSON.stringify({
          name: policy.name,
          protectedDomains: domainsText
            .split("\n")
            .map((domain) => domain.trim())
            .filter(Boolean),
          rules: JSON.parse(rulesText)
        })
      });
      setPolicy(nextPolicy);
      setStatus("Policy published.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Publish failed");
    }
  }

  if (!policy) {
    return <div className="panel">Loading policies...</div>;
  }

  return (
    <div className="page-grid wide-grid">
      <section className="panel">
        <p className="eyebrow">Protected domains</p>
        <h3>Protected AI and web destinations</h3>
        <textarea value={domainsText} onChange={(event) => setDomainsText(event.target.value)} rows={10} />
      </section>
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Rule pack</p>
            <h3>{policy.name}</h3>
          </div>
          <button className="primary-button" onClick={publishPolicy} type="button">
            Publish v{policy.version + 1}
          </button>
        </div>
        <textarea value={rulesText} onChange={(event) => setRulesText(event.target.value)} rows={24} />
        {status ? <p className="status-line">{status}</p> : null}
      </section>
    </div>
  );
}

export function EventsPage() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<DashboardEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    void apiRequest<DashboardEvent[]>(`/v1/admin/events?query=${encodeURIComponent(deferredQuery)}`).then((nextRows) => {
      startTransition(() => setRows(nextRows));
    });
  }, [deferredQuery]);

  async function exportCsv() {
    const csv = await apiRequest<string>("/v1/admin/events/export.csv");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
      anchor.download = "promptshield-events.csv";
      anchor.click();
      URL.revokeObjectURL(url);
  }

  const displayRows = rows.length ? rows : !deferredQuery ? sampleRecentEvents : [];

  useEffect(() => {
    if (!displayRows.length) {
      setSelectedEventId(null);
      return;
    }

    if (!selectedEventId || !displayRows.some((event) => event.id === selectedEventId)) {
      setSelectedEventId(displayRows[0]?.id ?? null);
    }
  }, [displayRows, selectedEventId]);

  const selectedEvent = displayRows.find((event) => event.id === selectedEventId) ?? displayRows[0] ?? null;
  const uniqueDetectors = selectedEvent ? Array.from(new Set(selectedEvent.detectorIds)) : [];
  const uniqueRules = selectedEvent ? Array.from(new Set(selectedEvent.ruleIds)) : [];

  return (
    <div className="page-grid">
      {!rows.length && !deferredQuery ? (
        <div className="inline-banner">Showing representative incidents until the tenant records live intervention events.</div>
      ) : null}

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Audit review</p>
            <h3>Event search</h3>
          </div>
          <button className="secondary-button" onClick={exportCsv} type="button">
            Export CSV
          </button>
        </div>
        <input
          className="filter-input"
          placeholder="Search destination or detector"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="event-review-grid">
          {displayRows.length ? (
            <>
              <div className="event-list">
                {displayRows.map((event) => (
                  <button
                    key={event.id}
                    className={`event-list-row${event.id === selectedEventId ? " active" : ""}`}
                    onClick={() => setSelectedEventId(event.id)}
                    type="button"
                  >
                    <div className="event-list-row-top">
                      <TonePill label={actionLabel(event.action)} tone={event.action} />
                      <span>{titleCase(event.severity)}</span>
                    </div>
                    <strong>{event.destinationDomain}</strong>
                    <span>{event.detectorIds.map(detectorLabel).join(", ")}</span>
                    <span>{new Date(event.createdAt).toLocaleString()}</span>
                  </button>
                ))}
              </div>

              {selectedEvent ? (
                <div className="event-inspector">
                  <div className="section-heading">
                    <p className="eyebrow">Selected incident</p>
                    <h3>
                      {actionLabel(selectedEvent.action)} on {selectedEvent.destinationDomain}
                    </h3>
                  </div>

                  <div className="event-inspector-meta">
                    <TonePill label={titleCase(selectedEvent.severity)} tone={selectedEvent.action} />
                    <span>{new Date(selectedEvent.createdAt).toLocaleString()}</span>
                  </div>

                  <p className="muted-copy">{recommendationForEvent(selectedEvent)}</p>

                  <div className="event-inspector-grid">
                    <div className="detail-card">
                      <span>Destination</span>
                      <strong>{selectedEvent.destinationDomain}</strong>
                    </div>
                    <div className="detail-card">
                      <span>Detector count</span>
                      <strong>{selectedEvent.detectorIds.length}</strong>
                    </div>
                    <div className="detail-card">
                      <span>Rule count</span>
                      <strong>{selectedEvent.ruleIds.length}</strong>
                    </div>
                  </div>

                  <div className="inspector-section">
                    <p className="eyebrow">Matched detectors</p>
                    <div className="incident-tags">
                      {uniqueDetectors.map((detectorId) => (
                        <span key={detectorId} className="meta-pill">
                          {detectorLabel(detectorId)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="inspector-section">
                    <p className="eyebrow">Matched rules</p>
                    <div className="incident-tags">
                      {uniqueRules.map((ruleId) => (
                        <span key={ruleId} className="meta-pill">
                          {titleCase(ruleId)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="inspector-section">
                    <p className="eyebrow">Payload shape</p>
                    <pre className="settings-pre">
{JSON.stringify(
  {
    id: selectedEvent.id,
    action: selectedEvent.action,
    severity: selectedEvent.severity,
    destinationDomain: selectedEvent.destinationDomain,
    detectorIds: selectedEvent.detectorIds,
    ruleIds: selectedEvent.ruleIds,
    createdAt: selectedEvent.createdAt
  },
  null,
  2
)}
                    </pre>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <p className="muted-copy">No events match the current search.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export function UsersPage() {
  const [rows, setRows] = useState<UserWithDevices[]>([]);

  useEffect(() => {
    void apiRequest<UserWithDevices[]>("/v1/admin/users-devices").then(setRows);
  }, []);

  return (
    <div className="page-grid">
      <section className="panel">
        <p className="eyebrow">Rollout visibility</p>
        <h3>Users and installed extension devices</h3>
        <div className="user-list">
          {rows.map((user) => (
            <article key={user.id} className="user-card">
              <div className="user-card-header">
                <div>
                  <strong>{user.email}</strong>
                  <span>{titleCase(user.role)}</span>
                </div>
                <span>{user.devices.length} active device(s)</span>
              </div>
              {user.devices.length ? (
                user.devices.map((device) => (
                  <code key={device.id}>
                    {device.id} | {device.extensionVersion ?? "unknown"} | {titleCase(device.status)}
                  </code>
                ))
              ) : (
                <p className="muted-copy">No active browsers are bound for this user yet.</p>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export function BillingPage() {
  const [billing, setBilling] = useState<BillingData | null>(null);

  useEffect(() => {
    void apiRequest<BillingData>("/v1/admin/billing").then(setBilling);
  }, []);

  async function beginCheckout(plan: "pro" | "team" | "enterprise") {
    const response = await apiRequest<{ url: string }>("/v1/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ plan })
    });
    window.location.href = response.url;
  }

  async function openPortal() {
    const response = await apiRequest<{ url: string }>("/v1/billing/portal", {
      method: "POST"
    });
    window.location.href = response.url;
  }

  if (!billing) {
    return <div className="panel">Loading billing...</div>;
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <p className="eyebrow">Entitlement</p>
        <h3>
          {titleCase(billing.plan)} | {titleCase(billing.state)}
        </h3>
        <p className="muted-copy">Seat limit: {billing.seatLimit}</p>
        <p className="muted-copy">
          Trial ends: {billing.trialEndsAt ? new Date(billing.trialEndsAt).toLocaleDateString() : "n/a"}
        </p>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Upgrade or manage</p>
            <h3>Stripe-powered lifecycle</h3>
          </div>
        </div>
        <div className="billing-actions">
          <button className="primary-button" onClick={() => beginCheckout("pro")} type="button">
            Start Pro
          </button>
          <button className="primary-button" onClick={() => beginCheckout("team")} type="button">
            Start Team
          </button>
          <button className="secondary-button" onClick={() => beginCheckout("enterprise")} type="button">
            Start Enterprise
          </button>
          <button className="secondary-button" onClick={openPortal} type="button">
            Open Billing Portal
          </button>
        </div>
      </section>
    </div>
  );
}

export function SettingsPage() {
  const { session } = useSessionContext();
  const diagnostics = {
    api: API_BASE_URL,
    role: session?.user.role,
    plan: session?.entitlement.plan
  };

  return (
    <div className="page-grid">
      <section className="panel">
        <p className="eyebrow">Operational defaults</p>
        <h3>Retention and support posture</h3>
        <ul className="settings-list">
          <li>Incident metadata stays primary; raw content capture remains disabled by default.</li>
          <li>Support diagnostics require explicit operator intent.</li>
          <li>Protected browser rollouts depend on short-lived activation codes and signed sessions.</li>
          <li>OpenAPI documentation remains available for extension and admin integration work.</li>
        </ul>
      </section>

      <section className="panel">
        <p className="eyebrow">Environment</p>
        <pre className="settings-pre">{JSON.stringify(diagnostics, null, 2)}</pre>
      </section>
    </div>
  );
}
