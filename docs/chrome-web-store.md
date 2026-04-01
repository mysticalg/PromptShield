# Chrome Web Store Submission Pack

## Release artifact

- Extension zip:
  `apps/extension/releases/promptshield-extension-0.1.0.zip`

## Store assets

- 128x128 icon:
  `apps/extension/assets/icons/icon-128.png`
- 440x280 promo tile:
  `apps/extension/assets/store/promo-tile-small.png`
- 920x680 promo tile:
  `apps/extension/assets/store/promo-tile-large.png`
- Screenshot 1:
  `apps/extension/assets/store/screenshot-01-block.png`
- Screenshot 2:
  `apps/extension/assets/store/screenshot-02-dashboard.png`
- Screenshot 3:
  `apps/extension/assets/store/screenshot-03-rollout.png`

## Recommended listing fields

- Store name:
  `PromptShield`
- Category:
  `Workflow and planning` or `Productivity`
- Language:
  `English (United Kingdom)` or `English (United States)`
- Website:
  `https://promptshieldapp.co.uk`
- Support URL:
  `https://promptshieldapp.co.uk/trust`
- Privacy policy URL:
  `https://promptshieldapp.co.uk/privacy`

## Short description

`Protect sensitive prompts on ChatGPT, Claude, Gemini, and Copilot with browser-side warn, redact, justify, and block controls.`

## Detailed description

`PromptShield helps organizations prevent sensitive data from being pasted or uploaded into protected AI destinations.

PromptShield runs in the browser and evaluates prompt text and file metadata locally before submission. Depending on policy, it can warn the user, redact sensitive values, require a business justification, or block the submission entirely.

What PromptShield can do:
- block live secrets and high-risk file types
- redact personal data before a prompt is sent
- require justification for customer records or protected context
- warn on internal project names and early leakage patterns
- sync centrally managed policy packs
- give security teams a clean control plane for rollout and event review

PromptShield is designed for privacy-first operation:
- browser-side classification before send
- metadata-only event logging by default
- no raw prompt storage in normal event records
- explicit operational controls for device activation and review

PromptShield is intended for managed organizational use with a PromptShield tenant.`

## Single-purpose description

`PromptShield prevents sensitive prompt data from being submitted to protected AI destinations by applying browser-side policy checks and controlled interventions.`

## Permission justifications

- `storage`
  Used to store local extension preferences, tenant activation state, cached policy data, and queued event metadata.
- `alarms`
  Used to schedule background policy sync and queued-event flush tasks.
- `activeTab`
  Used to show the current active host and whether the active tab is covered by PromptShield protection in the popup.
- `https://*/*` and `http://*/*`
  Used so PromptShield can evaluate user actions on supported protected destinations that the user actively visits. PromptShield is not intended for background scraping of unrelated browsing activity.

## Privacy disclosure notes

- PromptShield may process prompt text in-browser to evaluate policy rules before submission.
- PromptShield stores metadata such as action, severity, detector IDs, rule IDs, destination domain, timestamps, and optional justification text.
- PromptShield does not store raw prompt bodies in normal event records by default.
- PromptShield may store file metadata such as file name, size, and MIME type when file checks trigger.

## Final pre-submit checklist

1. Upload `apps/extension/releases/promptshield-extension-0.1.0.zip`.
2. Use the icon and screenshots from `apps/extension/assets/store`.
3. Set website to `https://promptshieldapp.co.uk`.
4. Set privacy policy URL to `https://promptshieldapp.co.uk/privacy`.
5. Confirm a monitored support mailbox exists before using `security@promptshieldapp.co.uk` publicly.
6. Review the extension from a fresh Chrome profile to confirm first-run activation points to `https://api.promptshieldapp.co.uk`.
