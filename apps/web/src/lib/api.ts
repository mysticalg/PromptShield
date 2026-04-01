import type { AuthSession } from "@promptshield/core";

import { getStoredSession, storeSession } from "./session";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

type RequestOptions = RequestInit & {
  auth?: boolean;
};

async function refreshSession(refreshToken: string): Promise<AuthSession | null> {
  const response = await fetch(`${API_BASE_URL}/v1/auth/session`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      refreshToken
    })
  });

  if (!response.ok) {
    storeSession(null);
    return null;
  }

  const session = (await response.json()) as AuthSession;
  storeSession(session);
  return session;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const currentSession = getStoredSession();
  const headers = new Headers(options.headers);
  if (!headers.has("content-type") && options.body) {
    headers.set("content-type", "application/json");
  }

  if (options.auth !== false && currentSession?.accessToken) {
    headers.set("authorization", `Bearer ${currentSession.accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (response.status === 401 && currentSession?.refreshToken && options.auth !== false) {
    const nextSession = await refreshSession(currentSession.refreshToken);
    if (nextSession?.accessToken) {
      headers.set("authorization", `Bearer ${nextSession.accessToken}`);
      const retry = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers
      });
      if (!retry.ok) {
        throw new Error(await retry.text());
      }
      return (await retry.json()) as T;
    }
  }

  if (!response.ok) {
    throw new Error(await response.text());
  }

  if (response.headers.get("content-type")?.includes("text/csv")) {
    return (await response.text()) as T;
  }

  return (await response.json()) as T;
}

export { API_BASE_URL };
