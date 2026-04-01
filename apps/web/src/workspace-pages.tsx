import { startTransition, useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react";
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

type UiGlyphName =
  | "overview"
  | "policies"
  | "events"
  | "users"
  | "billing"
  | "settings"
  | "device-code"
  | "export"
  | "seats"
  | "signals"
  | "rules"
  | "detectors"
  | "trend"
  | "response"
  | "incident"
  | "severity"
  | "destination"
  | "rule"
  | "clock"
  | "shield"
  | "search";

function UiGlyph({ name }: { name: UiGlyphName }) {
  switch (name) {
    case "overview":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <rect x="3" y="3" width="5.5" height="5.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <rect x="11.5" y="3" width="5.5" height="5.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <rect x="3" y="11.5" width="5.5" height="5.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "policies":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M5 4.2h10v11.6H5z" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M7.4 7.2h5.2M7.4 10h5.2M7.4 12.8h3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "events":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M4.2 14.6V5.4M8.1 14.6V8.2M11.9 14.6V3.8M15.8 14.6V10.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "users":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <circle cx="7" cy="7.1" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="13.4" cy="8.2" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M3.6 15.4c.5-2 2-3.2 4-3.2s3.6 1.2 4 3.2M10.7 15.3c.34-1.3 1.35-2.16 2.8-2.16 1.44 0 2.45.86 2.8 2.16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "billing":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M4 5.2h12v9.6H4z" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M4 8.1h12M7.2 11.5h2.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "settings":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10 3.6v1.8M10 14.6v1.8M3.6 10h1.8M14.6 10h1.8M5.4 5.4l1.3 1.3M13.3 13.3l1.3 1.3M14.6 5.4l-1.3 1.3M6.7 13.3l-1.3 1.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "device-code":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <rect x="3.4" y="4.2" width="13.2" height="11.6" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M6.5 8h7M6.5 11h4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "export":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M10 3.8v8.1M6.9 8.9 10 12l3.1-3.1M4.4 15.6h11.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "seats":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M5.5 9.4V6.7a2.5 2.5 0 0 1 5 0v2.7M4.2 9.4h7.6v5.1H4.2zM12.9 9.4h2.9v5.1h-2.9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "signals":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M4 13.8h2.6V9.6H4zM8.7 13.8h2.6V6.7H8.7zM13.4 13.8H16V4.5h-2.6z" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "rules":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M5.1 5.2h9.8M5.1 10h9.8M5.1 14.8h9.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "detectors":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="5.8" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="10" cy="10" r="1.8" fill="currentColor" />
        </svg>
      );
    case "trend":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M4 13.6 7.2 10.4l2.5 2.4 5.6-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "response":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M4.2 6.2h11.6M4.2 10h8.2M4.2 13.8h5.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "incident":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M10 3.5 16.2 15H3.8L10 3.5Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M10 7.3v3.9M10 13.3h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "severity":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M5.2 12.7h3.1l1.7-5.4 1.8 8.8 1.6-3.4h1.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "destination":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M4 10h12M10 4a8 8 0 0 1 0 12M10 4a8 8 0 0 0 0 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="10" cy="10" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "rule":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M6 4.5h8v11H6z" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8.2 8h3.6M8.2 11h3.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "clock":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10 6.6v3.8l2.5 1.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "shield":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M10 2.9 15.2 4.9v4.1c0 3.3-1.9 6-5.2 7.5C6.7 15 4.8 12.3 4.8 9V4.9L10 2.9Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    case "search":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <circle cx="8.6" cy="8.6" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="m12.1 12.1 3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
  }
}

function IconBadge({ name, tone = "neutral" }: { name: UiGlyphName; tone?: "neutral" | "accent" | "mint" | "peach" | "ink" }) {
  return (
    <span className={`glyph-badge glyph-badge-${tone}`} aria-hidden="true">
      <UiGlyph name={name} />
    </span>
  );
}

function IconText({
  icon,
  children,
  tone = "neutral",
  className = ""
}: {
  icon: UiGlyphName;
  children: ReactNode;
  tone?: "neutral" | "accent" | "mint" | "peach" | "ink";
  className?: string;
}) {
  return (
    <span className={`icon-text ${className}`.trim()}>
      <IconBadge name={icon} tone={tone} />
      <span>{children}</span>
    </span>
  );
}

function TonePill({ label, tone }: { label: string; tone: string }) {
  const iconByTone: Record<string, UiGlyphName> = {
    block: "shield",
    redact: "events",
    justify: "rule",
    warn: "incident"
  };

  return (
    <span className={`tone-pill tone-${tone}`}>
      {iconByTone[tone] ? <UiGlyph name={iconByTone[tone]} /> : null}
      <span>{label}</span>
    </span>
  );
}

function PromptShieldLogo() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path
          d="M12 2.4 18.4 4.85v5.05c0 4.08-2.42 7.53-6.4 9.28C8.02 17.43 5.6 13.98 5.6 9.9V4.85L12 2.4Z"
          fill="#bf6233"
        />
        <path
          d="M12 5.3 15.7 6.72v3.06c0 2.54-1.43 4.67-3.7 5.8-2.27-1.13-3.7-3.26-3.7-5.8V6.72L12 5.3Z"
          fill="#fff8f1"
        />
        <path d="M12 7.05 13.95 7.8 12.9 10.5h2.1l-3.25 4.45.88-2.95H10.4L12 7.05Z" fill="#bf6233" />
      </svg>
    </span>
  );
}

type DestinationProvider = "chatgpt" | "claude" | "gemini" | "copilot" | "generic";

function destinationProvider(domain: string): DestinationProvider {
  const normalized = domain.toLowerCase();
  if (normalized.includes("chatgpt") || normalized.includes("openai")) {
    return "chatgpt";
  }
  if (normalized.includes("claude") || normalized.includes("anthropic")) {
    return "claude";
  }
  if (normalized.includes("gemini") || normalized.includes("google")) {
    return "gemini";
  }
  if (normalized.includes("copilot") || normalized.includes("microsoft")) {
    return "copilot";
  }
  return "generic";
}

function ProviderGlyph({ provider }: { provider: DestinationProvider }) {
  switch (provider) {
    case "chatgpt":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <g fill="#16624b">
            <rect x="8.85" y="1.9" width="2.3" height="6.6" rx="1.15" />
            <rect x="8.85" y="1.9" width="2.3" height="6.6" rx="1.15" transform="rotate(60 10 10)" />
            <rect x="8.85" y="1.9" width="2.3" height="6.6" rx="1.15" transform="rotate(120 10 10)" />
            <rect x="8.85" y="1.9" width="2.3" height="6.6" rx="1.15" transform="rotate(180 10 10)" />
            <rect x="8.85" y="1.9" width="2.3" height="6.6" rx="1.15" transform="rotate(240 10 10)" />
            <rect x="8.85" y="1.9" width="2.3" height="6.6" rx="1.15" transform="rotate(300 10 10)" />
          </g>
          <circle cx="10" cy="10" r="1.7" fill="#f4fbf7" />
        </svg>
      );
    case "claude":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path
            d="M4.9 15.8 9.05 4.1h1.9l4.15 11.7h-2.55l-.82-2.35H8.18l-.8 2.35H4.9Zm3.98-4.45h2.25L10 7.7l-1.12 3.65Z"
            fill="#a34f22"
          />
          <path d="M6.15 16.4h7.7" stroke="#da8b61" strokeWidth="1.2" strokeLinecap="round" opacity="0.65" />
        </svg>
      );
    case "gemini":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M10 2.1 12.35 7.65 17.9 10l-5.55 2.35L10 17.9l-2.35-5.55L2.1 10l5.55-2.35L10 2.1Z" fill="#5970ff" />
          <path d="M13.95 4.25 14.8 6.55 17.1 7.4 14.8 8.25 13.95 10.55 13.1 8.25 10.8 7.4 13.1 6.55Z" fill="#d66cf6" />
        </svg>
      );
    case "copilot":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <circle cx="7.15" cy="7.15" r="3.2" fill="#6b6cf8" />
          <circle cx="12.85" cy="7.15" r="3.2" fill="#3d8cff" />
          <circle cx="7.15" cy="12.85" r="3.2" fill="#6a9ff8" />
          <circle cx="12.85" cy="12.85" r="3.2" fill="#48c8ba" />
          <circle cx="10" cy="10" r="2.2" fill="#f6fbff" />
        </svg>
      );
    default:
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="6.5" fill="none" stroke="#7d6d60" strokeWidth="1.6" />
          <path
            d="M3.8 10h12.4M10 3.6c1.95 2 2.8 4.17 2.8 6.4 0 2.23-.85 4.4-2.8 6.4-1.95-2-2.8-4.17-2.8-6.4 0-2.23.85-4.4 2.8-6.4Z"
            fill="none"
            stroke="#7d6d60"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

function DestinationLabel({ domain }: { domain: string }) {
  const provider = destinationProvider(domain);

  return (
    <span className="destination-label">
      <span className={`destination-mark destination-mark-${provider}`}>
        <ProviderGlyph provider={provider} />
      </span>
      <span>{domain}</span>
    </span>
  );
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
          <div className="brand-lockup">
            <PromptShieldLogo />
            <p className="eyebrow">PromptShield</p>
          </div>
          <h1>{session.organization.name}</h1>
          <p className="sidebar-copy">Policy-pack deployment for browser-side GenAI controls.</p>
        </div>

        <nav className="nav-links">
          <NavLink to="/app/overview">
            <IconText icon="overview" tone="accent">Overview</IconText>
          </NavLink>
          <NavLink to="/app/policies">
            <IconText icon="policies" tone="accent">Policies</IconText>
          </NavLink>
          <NavLink to="/app/events">
            <IconText icon="events" tone="accent">Events</IconText>
          </NavLink>
          <NavLink to="/app/users">
            <IconText icon="users" tone="accent">Users and devices</IconText>
          </NavLink>
          <NavLink to="/app/billing">
            <IconText icon="billing" tone="accent">Billing</IconText>
          </NavLink>
          <NavLink to="/app/settings">
            <IconText icon="settings" tone="accent">Settings</IconText>
          </NavLink>
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
            <span className="meta-pill">
              <UiGlyph name="detectors" />
              <span>{activeDetectorFamilies} active detector families</span>
            </span>
            <span className="meta-pill">
              <UiGlyph name="destination" />
              <span>{protectedDestinations} protected destinations in feed</span>
            </span>
            <span className="meta-pill">
              <UiGlyph name="trend" />
              <span>{overview.topDetectors.length} ranked detector trends</span>
            </span>
          </div>
        </div>

        <div className="overview-actions">
          <button className="primary-button" onClick={createDeviceCode} type="button">
            <IconText icon="device-code" tone="ink" className="button-label">Generate activation code</IconText>
          </button>
          <NavLink className="secondary-button" to="/app/policies">
            <IconText icon="policies" tone="neutral" className="button-label">Adjust policies</IconText>
          </NavLink>
          <p className="muted-copy">
            {deviceCode ?? "Issue short-lived activation codes when you need to onboard another protected browser."}
          </p>
        </div>
      </section>

      <section className="stat-row stat-row-four">
        <article className="stat-panel">
          <span className="stat-panel-label">
            <IconBadge name="seats" tone="peach" />
            <span>Active seats</span>
          </span>
          <strong>{overview.activeSeats}</strong>
        </article>
        <article className="stat-panel">
          <span className="stat-panel-label">
            <IconBadge name="signals" tone="mint" />
            <span>Events today</span>
          </span>
          <strong>{overview.eventsToday}</strong>
        </article>
        <article className="stat-panel">
          <span className="stat-panel-label">
            <IconBadge name="rules" tone="peach" />
            <span>Policy rules</span>
          </span>
          <strong>{overview.totalPolicies}</strong>
        </article>
        <article className="stat-panel">
          <span className="stat-panel-label">
            <IconBadge name="detectors" tone="mint" />
            <span>Top detector families</span>
          </span>
          <strong>{activeDetectorFamilies}</strong>
        </article>
      </section>

      <div className="overview-detail-grid">
        <section className="panel">
          <div className="section-heading">
            <p className="eyebrow">Signal volume</p>
            <h3>
              <IconText icon="trend" tone="mint">Interventions over the last six hours</IconText>
            </h3>
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
            <h3>
              <IconText icon="response" tone="peach">How PromptShield is intervening right now</IconText>
            </h3>
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
            <h3 className="destination-heading">
              {spotlight ? (
                <>
                  <span>{actionLabel(spotlight.action)} on</span>
                  <DestinationLabel domain={spotlight.destinationDomain} />
                </>
              ) : (
                "No incidents yet"
              )}
            </h3>
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
            <h3>
              <IconText icon="severity" tone="mint">Where the pressure is concentrated</IconText>
            </h3>
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
          <h3>
            <IconText icon="events" tone="peach">Latest intervention events</IconText>
          </h3>
        </div>
        <div className="timeline-list compact">
          {overview.recentEvents.slice(0, 6).map((event) => (
            <div key={event.id} className="timeline-row">
              <div>
                <TonePill label={actionLabel(event.action)} tone={event.action} />
                <strong>
                  <DestinationLabel domain={event.destinationDomain} />
                </strong>
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
            <IconText icon="shield" tone="ink" className="button-label">Publish v{policy.version + 1}</IconText>
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
            <h3>
              <IconText icon="search" tone="peach">Event search</IconText>
            </h3>
          </div>
          <button className="secondary-button" onClick={exportCsv} type="button">
            <IconText icon="export" tone="neutral" className="button-label">Export CSV</IconText>
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
                    <strong>
                      <DestinationLabel domain={event.destinationDomain} />
                    </strong>
                    <span>{event.detectorIds.map(detectorLabel).join(", ")}</span>
                    <span>{new Date(event.createdAt).toLocaleString()}</span>
                  </button>
                ))}
              </div>

              {selectedEvent ? (
                <div className="event-inspector">
                  <div className="section-heading">
                    <p className="eyebrow">Selected incident</p>
                    <h3 className="destination-heading">
                      <span>{actionLabel(selectedEvent.action)} on</span>
                      <DestinationLabel domain={selectedEvent.destinationDomain} />
                    </h3>
                  </div>

                  <div className="event-inspector-meta">
                    <TonePill label={titleCase(selectedEvent.severity)} tone={selectedEvent.action} />
                    <span>{new Date(selectedEvent.createdAt).toLocaleString()}</span>
                  </div>

                  <p className="muted-copy">{recommendationForEvent(selectedEvent)}</p>

                  <div className="event-inspector-grid">
                    <div className="detail-card">
                      <span className="detail-card-label">
                        <IconBadge name="destination" tone="peach" />
                        <span>Destination</span>
                      </span>
                      <strong>
                        <DestinationLabel domain={selectedEvent.destinationDomain} />
                      </strong>
                    </div>
                    <div className="detail-card">
                      <span className="detail-card-label">
                        <IconBadge name="detectors" tone="mint" />
                        <span>Detector count</span>
                      </span>
                      <strong>{selectedEvent.detectorIds.length}</strong>
                    </div>
                    <div className="detail-card">
                      <span className="detail-card-label">
                        <IconBadge name="rules" tone="peach" />
                        <span>Rule count</span>
                      </span>
                      <strong>{selectedEvent.ruleIds.length}</strong>
                    </div>
                  </div>

                  <div className="inspector-section">
                    <p className="eyebrow">Matched detectors</p>
                    <div className="incident-tags">
                      {uniqueDetectors.map((detectorId) => (
                        <span key={detectorId} className="meta-pill">
                          <UiGlyph name="detectors" />
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
                          <UiGlyph name="rule" />
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
