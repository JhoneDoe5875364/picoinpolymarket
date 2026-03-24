import * as React from "react";

// Minimal shape used elsewhere; adjust later if you add real auth wiring.
export type CurrentUser = { id: string; handle?: string | null } | null;

export function useCurrentUser(): CurrentUser {
  // Stub: return null (not logged in). Replace with real logic later.
  return null;
}

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  // Stub provider: just renders children. Replace with context if needed.
  return <>{children}</>;
}

// ALSO export default so both import styles compile
export default CurrentUserProvider;
