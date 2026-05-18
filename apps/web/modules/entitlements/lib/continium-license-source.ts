import "server-only";
import { getContiniumEntitlements } from "@/modules/continium/licensing/lib/get-continium-entitlements";
import type { TContiniumLicenseFeatures, TContiniumLicenseStatus } from "./license-features";

export type TLicenseSnapshot = {
  status: TContiniumLicenseStatus;
  features: TContiniumLicenseFeatures | null;
  active: boolean;
};

/**
 * Self-hosted Continium license snapshot.
 *
 * Design decision (red-team Finding #1 mitigation): returns
 * licenseStatus: "no-license" for both `selfHosted` and `free` editions.
 *
 * Rationale: the existing checks.ts `hasOrganizationEntitlementWithLicenseGuard`
 * short-circuits to `return true` when licenseStatus === "no-license". This is
 * the current production self-hosted behavior — operators without an
 * ENTERPRISE_LICENSE_KEY get all SaaS-tier features ON. Returning
 * `"no-license"` here preserves that invariant end-to-end after the EE call
 * is removed.
 *
 * `clinicalXxx` features are gated by @continium/licensing — that's a
 * separate gate chain from the SaaS-tier `licenseFeatures` chain in checks.ts.
 */
export const getContiniumSelfHostedLicenseSnapshot = async (): Promise<TLicenseSnapshot> => {
  // Touch the entitlements loader so config errors (invalid env, etc.)
  // surface at the entitlement boundary rather than deep in clinical code.
  await getContiniumEntitlements();
  return { status: "no-license", features: null, active: false };
};
