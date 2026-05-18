/*
 * Wrapper for cloud-Stripe Continium license + organization billing reads.
 *
 * This file is the single allow-listed crossing into @/modules/ee/billing/
 * inside non-EE territory. The intent is for the underlying helpers to
 * relocate to a non-EE path in a follow-up PR (see
 * plans/260517-1605-continium-licensing-refactor/plan.md Open Question #1).
 *
 * Until then, modules/entitlements/cloud-provider.ts imports from THIS file
 * and never from @/modules/ee/. The ESLint override in
 * apps/web/.eslintrc.js (Phase 07) protects clinical/entitlements/continium
 * dirs; this file lives under modules/billing/ which is intentionally outside
 * that protected glob to document the residual EE coupling here.
 */
import "server-only";
import type { TOrganizationBilling } from "@continium/types/organizations";
import {
  getDefaultOrganizationBilling,
  getOrganizationBillingWithReadThroughSync,
} from "@/modules/ee/billing/lib/organization-billing";
import type {
  TContiniumLicenseFeatures,
  TContiniumLicenseStatus,
} from "@/modules/entitlements/lib/license-features";

export type TBillingLicenseSnapshot = {
  status: TContiniumLicenseStatus;
  features: TContiniumLicenseFeatures | null;
  active: boolean;
};

export type TBillingReadResult = {
  billing: TOrganizationBilling | null;
  defaultBilling: TOrganizationBilling;
  license: TBillingLicenseSnapshot;
};

/**
 * Cloud-Stripe Continium license snapshot.
 *
 * Cloud Continium does not honor the legacy ENTERPRISE_LICENSE_KEY — Stripe is
 * the source of truth for SaaS-tier features. Returning `"no-license"` here
 * causes checks.ts:60-61 to short-circuit such that the Stripe-derived
 * `features` list in `TOrganizationEntitlementsContext` is the only gate;
 * `licenseFeatures` is intentionally null.
 */
export const getCloudLicenseSnapshot = (): TBillingLicenseSnapshot => ({
  status: "no-license",
  features: null,
  active: false,
});

export const getCloudBillingAndLicense = async (
  organizationId: string,
): Promise<TBillingReadResult> => {
  const billing = await getOrganizationBillingWithReadThroughSync(organizationId);
  return {
    billing,
    defaultBilling: getDefaultOrganizationBilling(),
    license: getCloudLicenseSnapshot(),
  };
};

export type { TOrganizationBilling };
