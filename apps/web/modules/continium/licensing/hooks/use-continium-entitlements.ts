"use client";

import { useContext } from "react";
import type { ContiniumEntitlements } from "@continium/licensing";
import { ContiniumEntitlementsContext } from "../components/continium-entitlements-provider";

/**
 * Returns the current Continium entitlements snapshot from the React context.
 *
 * Throws if used outside `<ContiniumEntitlementsProvider>`. The provider lives
 * in `app/(app)/layout.tsx`; routes outside `(app)/` (auth, public surveys,
 * fresh-instance setup) intentionally do not mount the provider — they must
 * not render `<FeatureGate>` or call this hook.
 */
export const useContiniumEntitlements = (): ContiniumEntitlements => {
  const ctx = useContext(ContiniumEntitlementsContext);
  if (ctx === null) {
    throw new Error(
      "ContiniumEntitlementsProvider missing — wrap your route segment in app/(app)/layout.tsx or render the provider explicitly.",
    );
  }
  return ctx;
};
