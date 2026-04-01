import type { RuntimeMessage } from "../shared";

const WEB_CONSOLE_BASE_URL = import.meta.env.VITE_PROMPTSHIELD_WEB_BASE_URL ?? "https://promptshieldapp.co.uk";
const WEB_CONSOLE_URL = `${WEB_CONSOLE_BASE_URL.replace(/\/$/, "")}/login`;

type PopupStatus = {
  signedIn: boolean;
  organization?: string;
  plan?: string;
  entitlement?: string;
  policyVersion?: number;
  protected?: boolean;
  currentHost?: string;
  queueLength: number;
  deviceId: string;
  supportMode: boolean;
  reduceMotion: boolean;
  autoSync: boolean;
  apiBaseUrl: string;
  lastSync?: string | null;
};

async function sendMessage<T>(message: RuntimeMessage): Promise<T> {
  return chrome.runtime.sendMessage(message) as Promise<T>;
}

async function currentHost(): Promise<string | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    return undefined;
  }

  try {
    return new URL(tab.url).hostname;
  } catch {
    return undefined;
  }
}

function titleCase(value: string | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }

  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function setText(id: string, value: string): void {
  const node = document.getElementById(id);
  if (node) {
    node.textContent = value;
  }
}

function setChipState(connected: boolean, isProtected: boolean): void {
  const chip = document.getElementById("site-chip");
  if (!chip) {
    return;
  }

  chip.className = "status-chip";
  if (!connected) {
    chip.textContent = "Not connected";
    return;
  }

  if (isProtected) {
    chip.classList.add("protected");
    chip.textContent = "Protected";
    return;
  }

  chip.classList.add("unprotected");
  chip.textContent = "Monitoring";
}

async function refresh(): Promise<void> {
  const host = await currentHost();
  const status = await sendMessage<PopupStatus>({
    type: "GET_STATUS",
    host
  });
  const consoleLink = document.getElementById("console-link") as HTMLAnchorElement | null;
  if (consoleLink) {
    consoleLink.href = WEB_CONSOLE_URL;
  }

  setText("org-name", status.signedIn ? status.organization ?? "Connected" : "Not connected");
  setText(
    "status-line",
    status.signedIn
      ? `${titleCase(status.plan, "Plan")} | ${titleCase(status.entitlement, "Status")} | ${
          status.protected ? "current tab protected" : "current tab not protected"
        }`
      : "Open the PromptShield web console to sign in and generate a short-lived device code."
  );
  setText("plan-pill", titleCase(status.plan, "No plan"));
  setText("entitlement-pill", titleCase(status.entitlement, "Not signed in"));
  setText("host-pill", status.currentHost ? `Tab ${status.currentHost}` : "No active tab");
  setText("policy-value", `v ${status.policyVersion ?? "n/a"}`);
  setText("queue-value", String(status.queueLength));
  setText("sync-value", status.lastSync ? new Date(status.lastSync).toLocaleTimeString() : "Never");
  setText(
    "detail-line",
    `device=${status.deviceId} | api=${status.apiBaseUrl} | auto-sync=${status.autoSync ? "on" : "off"}`
  );
  setText(
    "support-line",
    status.supportMode
      ? "Support mode is on. Use diagnostics only with explicit customer consent."
      : "Support mode is off. Diagnostics require explicit operator intent."
  );
  setText("motion-pill", status.reduceMotion ? "Motion reduced" : "Motion on");
  setChipState(status.signedIn, Boolean(status.protected));
}

document.getElementById("activate-button")?.addEventListener("click", async () => {
  const input = document.getElementById("activation-code") as HTMLInputElement | null;
  if (!input?.value) {
    return;
  }

  await sendMessage({
    type: "ACTIVATE_DEVICE",
    code: input.value,
    extensionVersion: chrome.runtime.getManifest().version
  });
  input.value = "";
  await refresh();
});

document.getElementById("console-link")?.addEventListener("click", (event) => {
  event.preventDefault();
  void chrome.tabs.create({
    url: WEB_CONSOLE_URL
  });
});

document.getElementById("sync-button")?.addEventListener("click", async () => {
  await sendMessage({
    type: "SYNC_POLICY"
  });
  await refresh();
});

document.getElementById("options-button")?.addEventListener("click", async () => {
  await sendMessage({
    type: "OPEN_OPTIONS"
  });
});

document.getElementById("signout-button")?.addEventListener("click", async () => {
  await sendMessage({
    type: "SIGN_OUT"
  });
  await refresh();
});

void refresh();
