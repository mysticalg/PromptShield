import { authSessionSchema, extensionEventSchema, policyPackSchema } from "@promptshield/core";

import type { ExtensionEvent, PolicyPack } from "@promptshield/core";
import { DEFAULT_PREFS, type ExtensionPrefs, type ExtensionState, type RuntimeMessage } from "../shared";

const STORAGE_KEYS = ["deviceId", "prefs", "session", "policy", "queue", "lastSync"] as const;

async function getState(): Promise<ExtensionState> {
  const raw = await chrome.storage.local.get([...STORAGE_KEYS]);
  const deviceId = typeof raw.deviceId === "string" ? raw.deviceId : crypto.randomUUID();
  const prefs = { ...DEFAULT_PREFS, ...(raw.prefs as Partial<ExtensionPrefs> | undefined) };
  const session = raw.session ? authSessionSchema.parse(raw.session) : null;
  const policy = raw.policy ? policyPackSchema.parse(raw.policy) : null;
  const queue = Array.isArray(raw.queue) ? raw.queue.map((event) => extensionEventSchema.parse(event)) : [];
  const lastSync = typeof raw.lastSync === "string" ? raw.lastSync : null;

  if (raw.deviceId !== deviceId) {
    await chrome.storage.local.set({ deviceId });
  }

  return {
    deviceId,
    prefs,
    session,
    policy,
    queue,
    lastSync
  };
}

async function patchState(partial: Partial<ExtensionState>): Promise<void> {
  await chrome.storage.local.set(partial);
}

function isProtectedHost(host: string | undefined, policy: PolicyPack | null): boolean {
  if (!host || !policy) {
    return false;
  }
  return policy.protectedDomains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

async function authorizedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const state = await getState();
  if (!state.session) {
    throw new Error("Not signed in");
  }

  const response = await fetch(`${state.prefs.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
      authorization: `Bearer ${state.session.accessToken}`
    }
  });

  if (response.status !== 401) {
    return response;
  }

  const refreshResponse = await fetch(`${state.prefs.apiBaseUrl}/v1/auth/session`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      refreshToken: state.session.refreshToken
    })
  });

  if (!refreshResponse.ok) {
    await patchState({ session: null });
    return response;
  }

  const nextSession = authSessionSchema.parse(await refreshResponse.json());
  await patchState({ session: nextSession });

  return fetch(`${state.prefs.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
      authorization: `Bearer ${nextSession.accessToken}`
    }
  });
}

async function syncPolicy(): Promise<{
  lastSync: string | null;
  policyVersion?: number;
}> {
  const state = await getState();
  if (!state.session) {
    return { lastSync: state.lastSync };
  }

  const [bootstrapResponse, policyResponse] = await Promise.all([
    authorizedFetch("/v1/extension/bootstrap"),
    authorizedFetch("/v1/policies/current")
  ]);

  if (!bootstrapResponse.ok || !policyResponse.ok) {
    throw new Error("Policy sync failed");
  }

  const bootstrap = (await bootstrapResponse.json()) as { lastSync: string };
  const policy = policyPackSchema.parse(await policyResponse.json());

  await patchState({
    policy,
    lastSync: bootstrap.lastSync
  });

  return {
    lastSync: bootstrap.lastSync,
    policyVersion: policy.version
  };
}

async function flushQueue(): Promise<{ flushed: number }> {
  const state = await getState();
  if (!state.session || !state.queue.length) {
    return { flushed: 0 };
  }

  const response = await authorizedFetch("/v1/events/batch", {
    method: "POST",
    headers: {
      "x-device-id": state.deviceId
    },
    body: JSON.stringify({
      events: state.queue
    })
  });

  if (!response.ok) {
    throw new Error("Failed to flush event queue");
  }

  await patchState({
    queue: []
  });

  return { flushed: state.queue.length };
}

async function queueEvent(event: ExtensionEvent): Promise<void> {
  const state = await getState();
  const queue = [...state.queue, extensionEventSchema.parse(event)].slice(-500);
  await patchState({ queue });
}

async function activateDevice(code: string, extensionVersion: string) {
  const state = await getState();
  const response = await fetch(`${state.prefs.apiBaseUrl}/v1/auth/session`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      deviceCode: code.toUpperCase(),
      deviceId: state.deviceId,
      extensionVersion
    })
  });

  if (!response.ok) {
    throw new Error("Activation failed");
  }

  const session = authSessionSchema.parse(await response.json());
  await patchState({ session });
  return syncPolicy();
}

chrome.runtime.onInstalled.addListener(async () => {
  await getState();
  chrome.alarms.create("promptshield-sync", { periodInMinutes: 5 });
  chrome.alarms.create("promptshield-flush", { periodInMinutes: 2 });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  try {
    if (alarm.name === "promptshield-sync") {
      await syncPolicy();
    }
    if (alarm.name === "promptshield-flush") {
      await flushQueue();
    }
  } catch (error) {
    console.error(error);
  }
});

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  void (async () => {
    try {
      switch (message.type) {
        case "GET_STATUS": {
          const state = await getState();
          sendResponse({
            signedIn: Boolean(state.session),
            organization: state.session?.organization.name,
            plan: state.session?.entitlement.plan,
            entitlement: state.session?.entitlement.status,
            policyVersion: state.policy?.version,
            protected: isProtectedHost(message.host, state.policy),
            currentHost: message.host,
            queueLength: state.queue.length,
            deviceId: state.deviceId,
            supportMode: state.prefs.supportMode,
            reduceMotion: state.prefs.reduceMotion,
            autoSync: state.prefs.autoSync,
            apiBaseUrl: state.prefs.apiBaseUrl,
            lastSync: state.lastSync
          });
          return;
        }
        case "ACTIVATE_DEVICE": {
          const sync = await activateDevice(message.code, message.extensionVersion);
          sendResponse({
            ok: true,
            ...sync
          });
          return;
        }
        case "SYNC_POLICY": {
          const sync = await syncPolicy();
          const flushed = await flushQueue();
          sendResponse({
            ok: true,
            ...sync,
            ...flushed
          });
          return;
        }
        case "SIGN_OUT": {
          await patchState({ session: null, policy: null, queue: [], lastSync: null });
          sendResponse({ ok: true });
          return;
        }
        case "OPEN_OPTIONS": {
          await chrome.runtime.openOptionsPage();
          sendResponse({ ok: true });
          return;
        }
        case "GET_POLICY_FOR_DOMAIN": {
          const state = await getState();
          sendResponse({
            policy: isProtectedHost(message.host, state.policy) ? state.policy : null,
            prefs: state.prefs
          });
          return;
        }
        case "QUEUE_EVENT": {
          await queueEvent(message.event);
          sendResponse({ ok: true });
          return;
        }
        case "SUBMIT_JUSTIFICATION": {
          const response = await authorizedFetch("/v1/justifications", {
            method: "POST",
            body: JSON.stringify(message.payload)
          });
          sendResponse({
            ok: response.ok
          });
          return;
        }
        case "GET_PREFS": {
          const state = await getState();
          sendResponse(state.prefs);
          return;
        }
        case "UPDATE_PREFS": {
          const state = await getState();
          await patchState({
            prefs: {
              ...state.prefs,
              ...message.prefs
            }
          });
          sendResponse({ ok: true });
          return;
        }
      }
    } catch (error) {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown extension error"
      });
    }
  })();

  return true;
});
