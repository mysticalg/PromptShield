import type { AuthSession, ExtensionEvent, PolicyPack } from "@promptshield/core";

export type ExtensionPrefs = {
  apiBaseUrl: string;
  supportMode: boolean;
  reduceMotion: boolean;
  autoSync: boolean;
};

export type ExtensionState = {
  deviceId: string;
  prefs: ExtensionPrefs;
  session: AuthSession | null;
  policy: PolicyPack | null;
  queue: ExtensionEvent[];
  lastSync: string | null;
};

const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_PROMPTSHIELD_API_BASE_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  "https://api.promptshieldapp.co.uk";

export const DEFAULT_PREFS: ExtensionPrefs = {
  apiBaseUrl: DEFAULT_API_BASE_URL,
  supportMode: false,
  reduceMotion: false,
  autoSync: true
};

export type RuntimeMessage =
  | { type: "GET_STATUS"; host?: string }
  | { type: "ACTIVATE_DEVICE"; code: string; extensionVersion: string }
  | { type: "SYNC_POLICY" }
  | { type: "SIGN_OUT" }
  | { type: "OPEN_OPTIONS" }
  | { type: "GET_POLICY_FOR_DOMAIN"; host: string }
  | { type: "QUEUE_EVENT"; event: ExtensionEvent }
  | { type: "SUBMIT_JUSTIFICATION"; payload: { eventId: string; text: string; ticket?: string } }
  | { type: "GET_PREFS" }
  | { type: "UPDATE_PREFS"; prefs: Partial<ExtensionPrefs> };
