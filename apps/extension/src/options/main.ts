import type { ExtensionPrefs, RuntimeMessage } from "../shared";

const PRODUCTION_API_BASE_URL = "https://api.promptshieldapp.co.uk";

async function sendMessage<T>(message: RuntimeMessage): Promise<T> {
  return chrome.runtime.sendMessage(message) as Promise<T>;
}

function setStatus(message: string): void {
  const node = document.getElementById("save-status");
  if (node) {
    node.textContent = message;
  }
}

function readPrefsFromForm(): Partial<ExtensionPrefs> {
  return {
    apiBaseUrl: (document.getElementById("api-base-url") as HTMLInputElement).value.trim(),
    supportMode: (document.getElementById("support-mode") as HTMLInputElement).checked,
    reduceMotion: (document.getElementById("reduce-motion") as HTMLInputElement).checked,
    autoSync: (document.getElementById("auto-sync") as HTMLInputElement).checked
  };
}

function writePrefsToForm(prefs: ExtensionPrefs): void {
  (document.getElementById("api-base-url") as HTMLInputElement).value = prefs.apiBaseUrl;
  (document.getElementById("support-mode") as HTMLInputElement).checked = prefs.supportMode;
  (document.getElementById("reduce-motion") as HTMLInputElement).checked = prefs.reduceMotion;
  (document.getElementById("auto-sync") as HTMLInputElement).checked = prefs.autoSync;
}

async function loadPrefs(): Promise<void> {
  const prefs = await sendMessage<ExtensionPrefs>({
    type: "GET_PREFS"
  });

  writePrefsToForm(prefs);
}

document.getElementById("save-button")?.addEventListener("click", async () => {
  await sendMessage({
    type: "UPDATE_PREFS",
    prefs: readPrefsFromForm()
  });
  setStatus("Settings saved.");
});

document.getElementById("reset-button")?.addEventListener("click", async () => {
  const defaults: ExtensionPrefs = {
    apiBaseUrl: PRODUCTION_API_BASE_URL,
    supportMode: false,
    reduceMotion: false,
    autoSync: true
  };
  writePrefsToForm(defaults);
  await sendMessage({
    type: "UPDATE_PREFS",
    prefs: defaults
  });
  setStatus("Production defaults restored.");
});

void loadPrefs();
