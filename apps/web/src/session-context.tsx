import { createContext, useContext } from "react";

import type { AuthSession } from "@promptshield/core";

export type SessionContextValue = {
  session: AuthSession | null;
  setSession: (session: AuthSession | null) => void;
};

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSessionContext(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("Session context missing");
  }
  return value;
}
