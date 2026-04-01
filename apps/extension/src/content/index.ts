import { classifyContent, type ExtensionEvent, type PolicyOutcome } from "@promptshield/core";

import type { PolicyPack } from "@promptshield/core";
import type { RuntimeMessage } from "../shared";

type PolicyPayload = {
  policy: PolicyPack | null;
  prefs: {
    reduceMotion: boolean;
  };
};

let cachedPolicy: PolicyPack | null = null;
let reduceMotion = false;
let justificationWindowEndsAt = 0;
let toastRoot: HTMLDivElement | null = null;

async function sendMessage<T>(message: RuntimeMessage): Promise<T> {
  return chrome.runtime.sendMessage(message) as Promise<T>;
}

function isEditable(target: EventTarget | null): target is HTMLElement {
  return target instanceof HTMLElement && (target.isContentEditable || /^(TEXTAREA|INPUT)$/i.test(target.tagName));
}

function readElementText(element: HTMLElement): string {
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    return element.value;
  }
  return element.innerText;
}

function writeElementText(element: HTMLElement, value: string): void {
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }
  element.innerText = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

function ensureToastRoot(): HTMLDivElement {
  if (toastRoot) {
    return toastRoot;
  }
  toastRoot = document.createElement("div");
  toastRoot.id = "promptshield-toast-root";
  toastRoot.style.position = "fixed";
  toastRoot.style.top = "16px";
  toastRoot.style.right = "16px";
  toastRoot.style.zIndex = "2147483647";
  toastRoot.style.display = "grid";
  toastRoot.style.gap = "8px";
  document.documentElement.appendChild(toastRoot);
  return toastRoot;
}

function showToast(message: string, tone: "warn" | "block" | "info" = "info"): void {
  const root = ensureToastRoot();
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.padding = "12px 14px";
  toast.style.borderRadius = "14px";
  toast.style.border = "1px solid rgba(36,26,18,0.12)";
  toast.style.boxShadow = "0 12px 30px rgba(36,26,18,0.16)";
  toast.style.background =
    tone === "block" ? "#47271a" : tone === "warn" ? "#fff4e2" : "rgba(255,251,246,0.97)";
  toast.style.color = tone === "block" ? "#fff" : "#241a12";
  toast.style.maxWidth = "320px";
  toast.style.transform = reduceMotion ? "none" : "translateY(8px)";
  toast.style.opacity = "0";
  toast.style.transition = reduceMotion ? "opacity 160ms ease" : "opacity 160ms ease, transform 200ms ease";
  root.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 220);
  }, 3400);
}

function promptForJustification(message: string): { text: string; ticket?: string } | null {
  const response = window.prompt(`${message}\n\nEnter a short justification to continue:`);
  if (!response) {
    return null;
  }
  return {
    text: response
  };
}

async function queueOutcomeEvent(outcome: PolicyOutcome, fileMetadata?: ExtensionEvent["fileMetadata"]): Promise<string> {
  const event: ExtensionEvent = {
    id: crypto.randomUUID(),
    eventType: outcome.action,
    severity: outcome.severity,
    detectorIds: outcome.detections.map((detection) => detection.detectorId),
    ruleIds: outcome.matchedRuleIds,
    destinationDomain: window.location.hostname,
    action: outcome.action,
    fileMetadata,
    createdAt: new Date().toISOString()
  };

  await sendMessage({
    type: "QUEUE_EVENT",
    event
  });

  return event.id;
}

function candidateTextFromSubmit(target: EventTarget | null): string {
  if (target instanceof HTMLFormElement) {
    const values = Array.from(target.querySelectorAll("textarea, input[type='text'], input[type='search'], input[type='email']"))
      .map((node) => (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement ? node.value : ""))
      .filter(Boolean);
    return values.join("\n");
  }

  if (isEditable(document.activeElement)) {
    return readElementText(document.activeElement);
  }

  return "";
}

async function handleTextOutcome(
  target: HTMLElement,
  outcome: PolicyOutcome,
  source: "paste" | "submit"
): Promise<"continue" | "stopped"> {
  if (outcome.action === "allow") {
    return "continue";
  }

  const eventId = await queueOutcomeEvent(outcome);

  if (outcome.action === "warn") {
    showToast("PromptShield warning: review this sensitive content before sending.", "warn");
    return "continue";
  }

  if (outcome.action === "redact" && outcome.redactedText) {
    writeElementText(target, outcome.redactedText);
    showToast("PromptShield redacted sensitive values before continuing.", "info");
    return "continue";
  }

  if (outcome.action === "justify") {
    const justification = promptForJustification("PromptShield requires a business justification before continuing.");
    if (!justification) {
      showToast("Submission cancelled. A justification is required to continue.", "warn");
      return "stopped";
    }
    await sendMessage({
      type: "SUBMIT_JUSTIFICATION",
      payload: {
        eventId,
        ...justification
      }
    });
    if (source === "submit") {
      justificationWindowEndsAt = Date.now() + 60_000;
      showToast("Justification submitted. Retry the send action within one minute.", "info");
      return "stopped";
    }
    showToast("Justification captured. PromptShield allowed this submission.", "info");
    return "continue";
  }

  if (outcome.action === "block") {
    showToast("PromptShield blocked this submission on a protected domain.", "block");
    return "stopped";
  }

  return "stopped";
}

async function evaluateText(text: string, target: HTMLElement, source: "paste" | "submit"): Promise<"continue" | "stopped"> {
  if (!cachedPolicy || !text.trim()) {
    return "continue";
  }
  const outcome = classifyContent(
    {
      destinationDomain: window.location.hostname,
      text
    },
    cachedPolicy
  );

  return handleTextOutcome(target, outcome, source);
}

async function onPaste(event: ClipboardEvent) {
  if (!cachedPolicy || !isEditable(event.target)) {
    return;
  }
  const text = event.clipboardData?.getData("text/plain") ?? "";
  if (!text) {
    return;
  }

  const outcome = classifyContent(
    {
      destinationDomain: window.location.hostname,
      text
    },
    cachedPolicy
  );

  if (outcome.action === "allow") {
    return;
  }

  event.preventDefault();
  const result = await handleTextOutcome(event.target, outcome, "paste");
  if (result === "continue" && (outcome.action === "justify" || outcome.action === "warn")) {
    document.execCommand("insertText", false, text);
  }
}

async function onSubmit(event: Event) {
  if (!cachedPolicy) {
    return;
  }

  if (justificationWindowEndsAt > Date.now()) {
    justificationWindowEndsAt = 0;
    return;
  }

  const text = candidateTextFromSubmit(event.target);
  if (!text) {
    return;
  }

  const editable = isEditable(document.activeElement) ? document.activeElement : document.body;
  const result = await evaluateText(text, editable, "submit");
  if (result === "stopped") {
    event.preventDefault();
    event.stopPropagation();
  }
}

async function onFileChange(event: Event) {
  if (!cachedPolicy || !(event.target instanceof HTMLInputElement) || event.target.type !== "file") {
    return;
  }

  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const outcome = classifyContent(
    {
      destinationDomain: window.location.hostname,
      fileMeta: {
        name: file.name,
        size: file.size,
        mime: file.type
      }
    },
    cachedPolicy
  );

  if (outcome.action === "allow") {
    return;
  }

  await queueOutcomeEvent(outcome, {
    name: file.name,
    size: file.size,
    mime: file.type
  });

  if (outcome.action === "block") {
    event.target.value = "";
    showToast("PromptShield blocked this file upload.", "block");
  }
}

async function bootstrap() {
  const payload = await sendMessage<PolicyPayload>({
    type: "GET_POLICY_FOR_DOMAIN",
    host: window.location.hostname
  });

  cachedPolicy = payload.policy;
  reduceMotion = payload.prefs.reduceMotion;
  if (!cachedPolicy) {
    return;
  }

  document.addEventListener("paste", (event) => {
    void onPaste(event);
  }, true);
  document.addEventListener("submit", (event) => {
    void onSubmit(event);
  }, true);
  document.addEventListener("change", (event) => {
    void onFileChange(event);
  }, true);
}

void bootstrap();
