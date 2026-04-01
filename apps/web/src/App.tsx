import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import type { AuthSession } from "@promptshield/core";

import { AuthVerifyPage, LoginPage, MarketingPage, PrivacyPage, TrustCenterPage } from "./public-pages";
import { getStoredSession } from "./lib/session";
import { SessionContext } from "./session-context";
import {
  BillingPage,
  EventsPage,
  OverviewPage,
  PoliciesPage,
  ProtectedLayout,
  SettingsPage,
  UsersPage
} from "./workspace-pages";

export function App() {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());

  return (
    <SessionContext.Provider value={{ session, setSession }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MarketingPage />} />
          <Route path="/pricing" element={<MarketingPage initialSectionId="pricing" />} />
          <Route path="/trust" element={<TrustCenterPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/verify" element={<AuthVerifyPage />} />
          <Route path="/app" element={<ProtectedLayout />}>
            <Route index element={<Navigate to="/app/overview" replace />} />
            <Route path="overview" element={<OverviewPage />} />
            <Route path="policies" element={<PoliciesPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SessionContext.Provider>
  );
}
