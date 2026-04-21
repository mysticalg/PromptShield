import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";

import type { AuthSession } from "@promptshield/core";

import {
  actionCopy,
  actionLabel,
  demoPolicy,
  demoScenarios,
  detectorLabel,
  liveDemoOutcome,
  outcomeDetail,
  outcomeHeadline,
  pricingTiers,
  templateLibrary,
  titleCase,
  trustDataHandling,
  trustFlow,
  trustPillars
} from "./app-data";
import {
  BrandLockup,
  BrandGraphic,
  IconBadge,
  IconText,
  ProviderPill,
  TonePill,
  type UiGlyphName
} from "./brand-system";
import { FooterAdSense } from "./footer-adsense";
import { apiRequest, API_BASE_URL } from "./lib/api";
import { storeSession } from "./lib/session";
import { useSessionContext } from "./session-context";

type RevealSectionProps = {
  id?: string;
  className?: string;
  children: ReactNode;
};

const pendingMagicTokens = new Set<string>();
const completedMagicTokens = new Set<string>();

function marketingIconForPillar(title: string): UiGlyphName {
  switch (title) {
    case "Local first enforcement":
      return "browser";
    case "Metadata-only telemetry":
      return "privacy";
    default:
      return "settings";
  }
}

function marketingIconForTemplate(name: string): UiGlyphName {
  switch (name) {
    case "PII Guard":
      return "privacy";
    case "Source Code and Secret Guard":
      return "shield";
    default:
      return "incident";
  }
}

function marketingIconForTier(name: string): UiGlyphName {
  switch (name) {
    case "Pro":
      return "spark";
    case "Team":
      return "users";
    default:
      return "shield";
  }
}

function trustFlowIcon(step: string): UiGlyphName {
  switch (step) {
    case "01":
      return "policies";
    case "02":
      return "device-code";
    case "03":
      return "shield";
    default:
      return "events";
  }
}

function privacyCardIcon(title: string): UiGlyphName {
  switch (title) {
    case "Browser-side review":
      return "browser";
    case "Policy-driven intervention":
      return "rules";
    case "Admin review":
      return "events";
    case "Deployment model":
      return "destination";
    case "`storage`":
      return "settings";
    case "`alarms`":
      return "clock";
    case "`activeTab`":
      return "browser";
    case "Host permissions":
      return "shield";
    case "Website":
      return "launch";
    default:
      return "mail";
  }
}

function RevealSection({ id, className, children }: RevealSectionProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }
        setVisible(true);
        observer.disconnect();
      },
      {
        threshold: 0.18
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section id={id} ref={ref} className={`reveal-section${visible ? " is-visible" : ""}${className ? ` ${className}` : ""}`}>
      {children}
    </section>
  );
}

function MarketingHeader() {
  return (
    <header className="marketing-topbar">
      <Link className="marketing-brand-link" to="/">
        <BrandLockup caption="Browser-first GenAI control plane" compact />
      </Link>

      <nav className="marketing-nav">
        <NavLink to="/">
          <IconText icon="overview" tone="accent">Platform</IconText>
        </NavLink>
        <NavLink to="/pricing">
          <IconText icon="billing" tone="accent">Pricing</IconText>
        </NavLink>
        <NavLink to="/trust">
          <IconText icon="shield" tone="accent">Trust Center</IconText>
        </NavLink>
      </nav>

      <div className="marketing-topbar-actions">
        <a className="text-link" href={`${API_BASE_URL}/openapi.json`} target="_blank" rel="noreferrer">
          <IconText icon="launch" tone="neutral">API</IconText>
        </a>
        <NavLink className="primary-button" to="/login">
          <IconText icon="device-code" tone="ink" className="button-label">Start Pilot</IconText>
        </NavLink>
      </div>
    </header>
  );
}

function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="marketing-footer-inner">
        <div className="marketing-footer-main">
          <BrandLockup caption="Browser-first controls for GenAI data handling." />
          <div className="marketing-footer-links">
            <NavLink to="/trust">
              <IconText icon="shield" tone="neutral">Trust Center</IconText>
            </NavLink>
            <NavLink to="/privacy">
              <IconText icon="privacy" tone="neutral">Privacy</IconText>
            </NavLink>
            <NavLink to="/pricing">
              <IconText icon="billing" tone="neutral">Pricing</IconText>
            </NavLink>
            <NavLink to="/login">
              <IconText icon="mail" tone="neutral">Admin sign-in</IconText>
            </NavLink>
          </div>
        </div>
        <FooterAdSense />
      </div>
    </footer>
  );
}

function DemoWorkbench() {
  const [scenarioId, setScenarioId] = useState(demoScenarios[0]?.id ?? "block");
  const scenario = demoScenarios.find((candidate) => candidate.id === scenarioId) ?? demoScenarios[0]!;
  const [draft, setDraft] = useState(scenario.prompt);
  const [destinationDomain, setDestinationDomain] = useState(scenario.destinationDomain);

  useEffect(() => {
    setDraft(scenario.prompt);
    setDestinationDomain(scenario.destinationDomain);
  }, [scenario]);

  const outcome = useMemo(() => liveDemoOutcome(destinationDomain, draft), [destinationDomain, draft]);

  return (
    <div className="demo-workbench">
      <div className="demo-controls">
        <div className="section-heading">
          <p className="eyebrow">
            <IconText icon="spark" tone="accent">Interactive demo</IconText>
          </p>
          <h3>Swap the scenario and watch the live intervention change.</h3>
        </div>

        <div className="demo-scenario-list">
          {demoScenarios.map((candidate) => (
            <button
              key={candidate.id}
              className={`demo-scenario-button${candidate.id === scenario.id ? " active" : ""}`}
              onClick={() => setScenarioId(candidate.id)}
              type="button"
            >
              <span className="demo-scenario-meta">
                <IconText
                  icon={
                    candidate.id === "block"
                      ? "shield"
                      : candidate.id === "redact"
                        ? "privacy"
                        : candidate.id === "justify"
                          ? "rule"
                          : "incident"
                  }
                  tone="accent"
                >
                  {candidate.label}
                </IconText>
              </span>
              <strong>{candidate.title}</strong>
            </button>
          ))}
        </div>

        <label>
          Protected destination
          <select value={destinationDomain} onChange={(event) => setDestinationDomain(event.target.value)}>
            {demoPolicy.protectedDomains.map((domain) => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))}
          </select>
        </label>

        <label>
          Prompt draft
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={9} />
        </label>

        <p className="muted-copy">
          This demo runs on the shared PromptShield policy engine, not a mocked screenshot. The current pack version is v
          {demoPolicy.version}.
        </p>
      </div>

      <div className={`demo-surface surface-${outcome.action}`}>
        <div className="demo-surface-header">
          <TonePill label={actionLabel(outcome.action)} tone={outcome.action} />
          <span>{destinationDomain}</span>
        </div>

        <div className="section-heading">
          <p className="eyebrow">
            <IconText icon="signals" tone="accent">Result</IconText>
          </p>
          <h3>{outcomeHeadline(outcome)}</h3>
          <p>{scenario.detail}</p>
        </div>

        <div className="demo-preview-grid">
          <div className="demo-preview-pane">
            <span>Original prompt</span>
            <pre>{draft}</pre>
          </div>

          <div className="demo-preview-pane">
            <span>Outcome detail</span>
            <p>{outcomeDetail(outcome)}</p>
            {outcome.redactedText && outcome.redactedText !== draft ? <pre>{outcome.redactedText}</pre> : null}
            {outcome.requiresJustification ? (
              <div className="inline-note">
                <strong>Justification required</strong>
                <p>Operators must explain the business reason before the submission is allowed.</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="detection-grid">
          {outcome.detections.map((detection) => (
            <div key={`${detection.ruleId}-${detection.detectorId}`} className="detection-item">
              <div className="detection-meta">
                <TonePill label={titleCase(detection.severity)} tone={detection.action} />
                <span>{detectorLabel(detection.detectorId)}</span>
              </div>
              <strong>{titleCase(detection.ruleId)}</strong>
              <p>{detection.message ?? actionCopy(detection.action)}</p>
            </div>
          ))}
        </div>

        <div className="demo-evidence-line">
          <span>Event payload</span>
          <code>
            action={outcome.action} | severity={outcome.severity} | rules=
            {outcome.matchedRuleIds.join("|") || "none"}
          </code>
        </div>
      </div>
    </div>
  );
}

export function MarketingPage({ initialSectionId }: { initialSectionId?: string }) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (initialSectionId) {
        document.getElementById(initialSectionId)?.scrollIntoView({
          block: "start"
        });
      } else {
        window.scrollTo({
          top: 0
        });
      }
    }, 40);

    return () => window.clearTimeout(timer);
  }, [initialSectionId]);

  return (
    <div className="marketing-page">
      <MarketingHeader />

      <main className="marketing-main">
        <section className="hero-stage">
          <div className="hero-copy">
            <div className="hero-brand-lockup">
              <BrandGraphic className="hero-brand-graphic" />
            </div>
            <h1>Keep sensitive prompts inside the browser.</h1>
            <p className="hero-summary">
              PromptShield intervenes before secrets, customer data, or internal project language can leave a protected
              browser session for ChatGPT, Claude, Gemini, Copilot, and other AI surfaces.
            </p>

            <div className="hero-provider-strip">
              <ProviderPill provider="chatgpt" label="ChatGPT" />
              <ProviderPill provider="claude" label="Claude" />
              <ProviderPill provider="gemini" label="Gemini" />
              <ProviderPill provider="copilot" label="Copilot" />
            </div>

            <div className="hero-actions">
              <NavLink className="primary-button" to="/login">
                <IconText icon="spark" tone="ink" className="button-label">Start Free Trial</IconText>
              </NavLink>
              <NavLink className="secondary-button" to="/trust">
                <IconText icon="shield" tone="neutral" className="button-label">Visit Trust Center</IconText>
              </NavLink>
            </div>

            <div className="hero-proofline">
              <div>
                <IconText icon="response" tone="peach">4 intervention modes</IconText>
                <strong>4</strong>
                <span>block, redact, justify, and warn</span>
              </div>
              <div>
                <IconText icon="browser" tone="mint">Local enforcement</IconText>
                <strong>Local</strong>
                <span>browser-side enforcement</span>
              </div>
              <div>
                <IconText icon="privacy" tone="accent">Metadata-first signal</IconText>
                <strong>Metadata-only</strong>
                <span>telemetry by default</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-visual-copy">
              <p className="eyebrow">Intervention lanes</p>
              <h2>One policy engine. Different responses based on what is detected.</h2>
            </div>

            <div className="hero-lane hero-lane-block">
              <span>Block</span>
              <p>Stop live secrets and sensitive file types before they leave the page.</p>
            </div>
            <div className="hero-lane hero-lane-redact">
              <span>Redact</span>
              <p>Remove personal data while preserving the rest of the prompt for safe use.</p>
            </div>
            <div className="hero-lane hero-lane-justify">
              <span>Justify</span>
              <p>Capture business reasons before customer records or protected context can continue.</p>
            </div>
            <div className="hero-lane hero-lane-warn">
              <span>Warn</span>
              <p>Flag internal codenames and early leakage signals without forcing a hard stop.</p>
            </div>
          </div>
        </section>

        <RevealSection id="proof" className="content-stage">
          <div className="section-intro">
            <p className="eyebrow">
              <IconText icon="trend" tone="accent">Live proof</IconText>
            </p>
            <h2>Show the intervention your client will actually experience.</h2>
            <p>
              Change the prompt, switch the destination, and the shared PromptShield engine recalculates the response in
              real time.
            </p>
          </div>
          <DemoWorkbench />
        </RevealSection>

        <RevealSection className="content-stage">
          <div className="section-intro">
            <p className="eyebrow">
              <IconText icon="settings" tone="accent">Operating model</IconText>
            </p>
            <h2>A security control that feels deployable, not theoretical.</h2>
            <p>
              The control plane stays light, the extension stays fast, and operators get enough evidence to manage rollout
              and explain policy decisions.
            </p>
          </div>

          <div className="split-stage">
            <div className="split-column">
              <p className="eyebrow">
                <IconText icon="shield" tone="accent">Why buyers trust it</IconText>
              </p>
              {trustPillars.map((pillar) => (
                <article key={pillar.title} className="narrative-block">
                  <h3 className="card-title">
                    <IconText icon={marketingIconForPillar(pillar.title)} tone="accent">{pillar.title}</IconText>
                  </h3>
                  <p>{pillar.body}</p>
                </article>
              ))}
            </div>

            <div className="split-column">
              <p className="eyebrow">
                <IconText icon="policies" tone="accent">Policy templates</IconText>
              </p>
              {templateLibrary.map((template) => (
                <article key={template.name} className="narrative-block">
                  <h3 className="card-title">
                    <IconText icon={marketingIconForTemplate(template.name)} tone="peach">{template.name}</IconText>
                  </h3>
                  <p>{template.body}</p>
                </article>
              ))}
            </div>
          </div>
        </RevealSection>

        <RevealSection id="pricing" className="content-stage">
          <div className="section-intro">
            <p className="eyebrow">
              <IconText icon="billing" tone="accent">Pricing</IconText>
            </p>
            <h2>Start self-serve, then graduate into managed rollout.</h2>
            <p>Keep the entry point simple without giving up the governance story buyers expect later.</p>
          </div>

          <div className="pricing-stage">
            {pricingTiers.map((tier) => (
              <article key={tier.name} className="pricing-tier">
                <p className="eyebrow">
                  <IconText icon={marketingIconForTier(tier.name)} tone="accent">{tier.name}</IconText>
                </p>
                <strong>{tier.price}</strong>
                <p>{tier.detail}</p>
                <span>{tier.inclusions}</span>
              </article>
            ))}
          </div>
        </RevealSection>

        <RevealSection className="closing-stage">
          <div>
            <p className="eyebrow">
              <IconText icon="spark" tone="accent">Ready for pilot</IconText>
            </p>
            <h2>Give clients a control they can understand in one meeting.</h2>
          </div>
          <div className="closing-actions">
            <NavLink className="primary-button" to="/login">
              <IconText icon="launch" tone="ink" className="button-label">Enter the control plane</IconText>
            </NavLink>
            <NavLink className="secondary-button" to="/trust">
              <IconText icon="shield" tone="neutral" className="button-label">Review trust details</IconText>
            </NavLink>
          </div>
        </RevealSection>
      </main>

      <MarketingFooter />
    </div>
  );
}

export function TrustCenterPage() {
  return (
    <div className="marketing-page trust-center-page">
      <MarketingHeader />

      <main className="marketing-main">
        <section className="trust-hero">
          <div>
            <p className="eyebrow">
              <IconText icon="shield" tone="accent">Trust Center</IconText>
            </p>
            <h1>Designed to minimize data exposure while still producing usable security signal.</h1>
          </div>
          <p>
            PromptShield is built for browser-side intervention, metadata-first evidence, and operational control without
            defaulting to raw prompt storage.
          </p>
        </section>

        <RevealSection className="content-stage">
          <div className="section-intro">
            <p className="eyebrow">
              <IconText icon="privacy" tone="accent">Data handling</IconText>
            </p>
            <h2>What PromptShield records and what it avoids by default.</h2>
          </div>

          <div className="trust-compare-grid">
            <section className="trust-compare-panel">
              <p className="eyebrow">
                <IconText icon="check" tone="mint">Recorded</IconText>
              </p>
              <ul className="trust-list">
                {trustDataHandling.stores.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="trust-compare-panel">
              <p className="eyebrow">
                <IconText icon="shield" tone="accent">Avoided by default</IconText>
              </p>
              <ul className="trust-list">
                {trustDataHandling.avoids.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>
        </RevealSection>

        <RevealSection className="content-stage">
          <div className="section-intro">
            <p className="eyebrow">
              <IconText icon="trend" tone="accent">Control flow</IconText>
            </p>
            <h2>From policy publishing to intervention evidence in four steps.</h2>
          </div>

          <div className="timeline-grid">
            {trustFlow.map((item) => (
              <article key={item.step} className="timeline-step">
                <div className="timeline-step-header">
                  <span className="timeline-step-index">{item.step}</span>
                  <IconBadge name={trustFlowIcon(item.step)} tone="accent" />
                </div>
                <h3 className="card-title">{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </RevealSection>

        <RevealSection className="content-stage">
          <div className="section-intro">
            <p className="eyebrow">
              <IconText icon="settings" tone="accent">Platform posture</IconText>
            </p>
            <h2>Operational defaults that support a security-first deployment story.</h2>
          </div>

          <div className="split-stage">
            <div className="split-column">
              <article className="narrative-block">
                <h3 className="card-title">
                  <IconText icon="overview" tone="accent">Control plane</IconText>
                </h3>
                <p>Magic-link access, policy publishing, billing, device activation, and review live in one admin surface.</p>
              </article>
              <article className="narrative-block">
                <h3 className="card-title">
                  <IconText icon="browser" tone="mint">Extension enforcement</IconText>
                </h3>
                <p>Paste, submit, and file actions are classified locally against the same shared policy engine used in tests and demos.</p>
              </article>
            </div>

            <div className="split-column">
              <article className="narrative-block">
                <h3 className="card-title">
                  <IconText icon="destination" tone="peach">Deployment footprint</IconText>
                </h3>
                <p>PromptShield runs today on AWS-hosted web and API services with Stripe-backed subscription lifecycle management.</p>
              </article>
              <article className="narrative-block">
                <h3 className="card-title">
                  <IconText icon="privacy" tone="accent">Operational defaults</IconText>
                </h3>
                <p>Raw content capture is disabled by default, support diagnostics are opt-in, and retention stays focused on intervention metadata.</p>
              </article>
            </div>
          </div>
        </RevealSection>

        <RevealSection className="closing-stage">
          <div>
            <p className="eyebrow">
              <IconText icon="launch" tone="accent">Next step</IconText>
            </p>
            <h2>Walk clients from trust posture to live intervention in the same session.</h2>
          </div>
          <div className="closing-actions">
            <NavLink className="primary-button" to="/login">
              <IconText icon="launch" tone="ink" className="button-label">Open PromptShield</IconText>
            </NavLink>
            <NavLink className="secondary-button" to="/">
              <IconText icon="overview" tone="neutral" className="button-label">Return to platform overview</IconText>
            </NavLink>
          </div>
        </RevealSection>
      </main>

      <MarketingFooter />
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="marketing-page trust-center-page">
      <MarketingHeader />

      <main className="marketing-main">
        <section className="trust-hero">
          <div>
            <p className="eyebrow">
              <IconText icon="privacy" tone="accent">Privacy Policy</IconText>
            </p>
            <h1>PromptShield is designed to minimize collected content and keep enforcement in the browser where possible.</h1>
          </div>
          <p>
            This page describes the product behavior relevant to the PromptShield Chrome extension and the PromptShield
            web control plane.
          </p>
        </section>

        <RevealSection className="content-stage">
          <div className="section-intro">
            <p className="eyebrow">
              <IconText icon="shield" tone="accent">What PromptShield does</IconText>
            </p>
            <h2>PromptShield helps organizations prevent sensitive data from being pasted or uploaded to protected AI destinations.</h2>
          </div>

          <div className="split-stage">
            <div className="split-column">
              <article className="narrative-block">
                <h3 className="card-title">
                  <IconText icon={privacyCardIcon("Browser-side review")} tone="mint">Browser-side review</IconText>
                </h3>
                <p>
                  PromptShield classifies prompt text and file metadata locally inside the extension before a protected
                  submission is allowed to continue.
                </p>
              </article>
              <article className="narrative-block">
                <h3 className="card-title">
                  <IconText icon={privacyCardIcon("Policy-driven intervention")} tone="accent">Policy-driven intervention</IconText>
                </h3>
                <p>
                  Organizations can configure PromptShield to warn, redact, require justification, or block depending on
                  the matched policy rule.
                </p>
              </article>
            </div>

            <div className="split-column">
              <article className="narrative-block">
                <h3 className="card-title">
                  <IconText icon={privacyCardIcon("Admin review")} tone="peach">Admin review</IconText>
                </h3>
                <p>
                  Authorized administrators can review intervention events, publish policy updates, manage devices, and
                  oversee billing in the PromptShield control plane.
                </p>
              </article>
              <article className="narrative-block">
                <h3 className="card-title">
                  <IconText icon={privacyCardIcon("Deployment model")} tone="accent">Deployment model</IconText>
                </h3>
                <p>PromptShield currently operates on AWS-hosted services under the `promptshieldapp.co.uk` domain.</p>
              </article>
            </div>
          </div>
        </RevealSection>

        <RevealSection className="content-stage">
          <div className="section-intro">
            <p className="eyebrow">
              <IconText icon="privacy" tone="accent">Data handling</IconText>
            </p>
            <h2>PromptShield stores operational security signal, not raw prompts, by default.</h2>
          </div>

          <div className="trust-compare-grid">
            <section className="trust-compare-panel">
              <p className="eyebrow">
                <IconText icon="check" tone="mint">PromptShield may store</IconText>
              </p>
              <ul className="trust-list">
                <li>Extension device identifiers and tenant activation state</li>
                <li>Policy versions and protected destination configuration</li>
                <li>Event metadata such as action, severity, destination domain, detector IDs, rule IDs, and timestamps</li>
                <li>Optional business justification text when a policy requires it</li>
                <li>File metadata such as file name, size, and MIME type when file checks trigger</li>
              </ul>
            </section>

            <section className="trust-compare-panel">
              <p className="eyebrow">
                <IconText icon="shield" tone="accent">PromptShield avoids by default</IconText>
              </p>
              <ul className="trust-list">
                <li>Raw prompt bodies in stored event records</li>
                <li>Full uploaded file contents</li>
                <li>Background scraping of all browsing activity</li>
                <li>Support diagnostics without explicit operator intent</li>
              </ul>
            </section>
          </div>
        </RevealSection>

        <RevealSection className="content-stage">
          <div className="section-intro">
            <p className="eyebrow">
              <IconText icon="settings" tone="accent">Extension permissions</IconText>
            </p>
            <h2>Why the Chrome extension asks for the permissions it uses.</h2>
          </div>

          <div className="split-stage">
            <div className="split-column">
              <article className="narrative-block">
                <h3 className="card-title">
                  <IconText icon={privacyCardIcon("`storage`")} tone="accent">`storage`</IconText>
                </h3>
                <p>Used to store local preferences, device activation state, cached policy data, and queued events.</p>
              </article>
              <article className="narrative-block">
                <h3 className="card-title">
                  <IconText icon={privacyCardIcon("`alarms`")} tone="peach">`alarms`</IconText>
                </h3>
                <p>Used to trigger background policy synchronization and queued-event flush operations.</p>
              </article>
            </div>

            <div className="split-column">
              <article className="narrative-block">
                <h3 className="card-title">
                  <IconText icon={privacyCardIcon("`activeTab`")} tone="mint">`activeTab`</IconText>
                </h3>
                <p>Used to show the current host and whether the active tab is protected in the extension popup.</p>
              </article>
              <article className="narrative-block">
                <h3 className="card-title">
                  <IconText icon={privacyCardIcon("Host permissions")} tone="accent">Host permissions</IconText>
                </h3>
                <p>
                  Used so PromptShield can evaluate content on protected web destinations that the user actively visits,
                  including supported GenAI sites.
                </p>
              </article>
            </div>
          </div>
        </RevealSection>

        <RevealSection className="content-stage">
          <div className="section-intro">
            <p className="eyebrow">
              <IconText icon="mail" tone="accent">Contact</IconText>
            </p>
            <h2>Questions about PromptShield privacy or extension behavior.</h2>
          </div>

          <div className="split-stage">
            <div className="split-column">
              <article className="narrative-block">
                <h3 className="card-title">
                  <IconText icon={privacyCardIcon("Website")} tone="peach">Website</IconText>
                </h3>
                <p>
                  <a href="https://promptshieldapp.co.uk" target="_blank" rel="noreferrer">
                    https://promptshieldapp.co.uk
                  </a>
                </p>
              </article>
            </div>
            <div className="split-column">
              <article className="narrative-block">
                <h3 className="card-title">
                  <IconText icon={privacyCardIcon("Support contact")} tone="accent">Support contact</IconText>
                </h3>
                <p>Use a monitored support mailbox before store publication. The current recommended address is `security@promptshieldapp.co.uk`.</p>
              </article>
            </div>
          </div>
        </RevealSection>
      </main>

      <MarketingFooter />
    </div>
  );
}

export function LoginPage() {
  const [email, setEmail] = useState("owner@example.com");
  const [orgName, setOrgName] = useState("Example Org");
  const [status, setStatus] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Requesting secure sign-in link...");
    setPreviewUrl(null);

    try {
      const response = await apiRequest<{ previewUrl?: string }>("/v1/auth/magic-links", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          email,
          orgName
        })
      });
      setStatus("Secure sign-in link generated.");
      if (response.previewUrl) {
        setPreviewUrl(response.previewUrl);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Sign-in request failed");
    }
  }

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        <BrandLockup caption="Secure admin sign-in" className="auth-brand-lockup" />
        <h1>Open the PromptShield control plane.</h1>
        <p className="auth-copy">Use your work email to request a secure magic link and activate the tenant.</p>
        <label>
          Work email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </label>
        <label>
          Organization
          <input value={orgName} onChange={(event) => setOrgName(event.target.value)} type="text" />
        </label>
        <button className="primary-button" type="submit">
          <IconText icon="mail" tone="ink" className="button-label">Email sign-in link</IconText>
        </button>
        {status ? <p className="status-line">{status}</p> : null}
        {previewUrl ? (
          <a className="preview-link" href={previewUrl}>
            <IconText icon="launch" tone="accent">Open secure sign-in link</IconText>
          </a>
        ) : null}
      </form>
    </section>
  );
}

export function AuthVerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useSessionContext();
  const [message, setMessage] = useState("Verifying magic link...");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setMessage("Missing magic token.");
      return;
    }

    if (completedMagicTokens.has(token)) {
      navigate("/app/overview", { replace: true });
      return;
    }

    if (pendingMagicTokens.has(token)) {
      return;
    }

    pendingMagicTokens.add(token);

    void apiRequest<AuthSession>("/v1/auth/session", {
      method: "POST",
      auth: false,
      body: JSON.stringify({
        magicToken: token
      })
    })
      .then((session) => {
        pendingMagicTokens.delete(token);
        completedMagicTokens.add(token);
        storeSession(session);
        setSession(session);
        navigate("/app/overview", { replace: true });
      })
      .catch((error) => {
        pendingMagicTokens.delete(token);
        setMessage(error instanceof Error ? error.message : "Verification failed");
      });
  }, [navigate, searchParams, setSession]);

  return (
    <section className="auth-page">
      <div className="auth-card">
        <BrandLockup caption="Verifying secure link" className="auth-brand-lockup" />
        <h1>{message}</h1>
      </div>
    </section>
  );
}
