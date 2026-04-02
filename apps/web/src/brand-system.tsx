import type { ReactNode } from "react";

const BRAND_MARK_SRC = "/promptshield-logo-mark.png";
const BRAND_LOCKUP_SRC = "/promptshield-logo-lockup.png";

export type UiGlyphName =
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
  | "search"
  | "browser"
  | "privacy"
  | "mail"
  | "spark"
  | "launch"
  | "check";

export type IconTone = "neutral" | "accent" | "mint" | "peach" | "ink";

export function UiGlyph({ name }: { name: UiGlyphName }) {
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
    case "browser":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <rect x="2.6" y="4.1" width="14.8" height="11.8" rx="2.1" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M2.9 7.7h14.2M5.4 5.8h.01M8 5.8h.01M10.6 5.8h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "privacy":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <rect x="4.7" y="8.6" width="10.6" height="7" rx="1.8" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6.9 8.3V6.7a3.1 3.1 0 1 1 6.2 0v1.6M10 11.1v2.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="10" cy="11" r="0.9" fill="currentColor" />
        </svg>
      );
    case "mail":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <rect x="3.1" y="4.8" width="13.8" height="10.4" rx="1.8" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="m4.6 6.4 5.4 4.3 5.4-4.3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "spark":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M10 2.5 11.85 8.15 17.5 10l-5.65 1.85L10 17.5l-1.85-5.65L2.5 10l5.65-1.85L10 2.5Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "launch":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M11.3 4.4h4.3v4.3M10.9 9.1l4.7-4.7M15.2 11.1v3.4a1.2 1.2 0 0 1-1.2 1.2H5.6a1.2 1.2 0 0 1-1.2-1.2V6a1.2 1.2 0 0 1 1.2-1.2H9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "check":
      return (
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="m4.6 10.2 3.2 3.2 7.6-7.3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

export function IconBadge({ name, tone = "neutral" }: { name: UiGlyphName; tone?: IconTone }) {
  return (
    <span className={`glyph-badge glyph-badge-${tone}`} aria-hidden="true">
      <UiGlyph name={name} />
    </span>
  );
}

export function IconText({
  icon,
  children,
  tone = "neutral",
  className = ""
}: {
  icon: UiGlyphName;
  children: ReactNode;
  tone?: IconTone;
  className?: string;
}) {
  return (
    <span className={`icon-text ${className}`.trim()}>
      <IconBadge name={icon} tone={tone} />
      <span>{children}</span>
    </span>
  );
}

export function TonePill({ label, tone }: { label: string; tone: string }) {
  const iconByTone: Partial<Record<string, UiGlyphName>> = {
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

export function PromptShieldLogo() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <img src={BRAND_MARK_SRC} alt="" />
    </span>
  );
}

export function BrandGraphic({ className = "" }: { className?: string }) {
  return <img className={`brand-graphic ${className}`.trim()} src={BRAND_LOCKUP_SRC} alt="PromptShield" />;
}

export function BrandLockup({
  caption,
  className = "",
  compact = false
}: {
  caption?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={`brand-lockup${compact ? " brand-lockup-compact" : ""}${className ? ` ${className}` : ""}`}>
      <BrandGraphic className="brand-lockup-image" />
      {caption ? <span className="brand-lockup-caption brand-lockup-supporting">{caption}</span> : null}
    </span>
  );
}

export type DestinationProvider = "chatgpt" | "claude" | "gemini" | "copilot" | "generic";

export function destinationProvider(domain: string): DestinationProvider {
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

export function ProviderGlyph({ provider }: { provider: DestinationProvider }) {
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

export function ProviderPill({ provider, label }: { provider: DestinationProvider; label: string }) {
  return (
    <span className="provider-pill">
      <span className={`destination-mark destination-mark-${provider}`}>
        <ProviderGlyph provider={provider} />
      </span>
      <span>{label}</span>
    </span>
  );
}

export function DestinationLabel({ domain }: { domain: string }) {
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
