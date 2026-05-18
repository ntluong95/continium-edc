/*
 * Continium-owned mirror of the SaaS-tier feature shape consumed by
 * apps/web/modules/entitlements/. Defined in Continium code so the
 * entitlement layer does not import from Formbricks Enterprise modules.
 *
 * Field names mirror the upstream wire payload because deployed self-hosted
 * instances may continue to receive that payload via the legacy
 * ENTERPRISE_LICENSE_KEY path read by EE-internal code. This is the protocol
 * (interop), not the implementation — original code.
 */
import { z } from "zod";

export const ZContiniumLicenseFeatures = z.object({
  isMultiOrgEnabled: z.boolean(),
  contacts: z.boolean(),
  projects: z.number().nullable(),
  whitelabel: z.boolean(),
  removeBranding: z.boolean(),
  twoFactorAuth: z.boolean(),
  sso: z.boolean(),
  saml: z.boolean(),
  spamProtection: z.boolean(),
  aiSmartTools: z.boolean(),
  aiDataAnalysis: z.boolean(),
  auditLogs: z.boolean(),
  accessControl: z.boolean(),
  quotas: z.boolean(),
});

export type TContiniumLicenseFeatures = z.infer<typeof ZContiniumLicenseFeatures>;

export type TContiniumLicenseStatus =
  | "active"
  | "expired"
  | "instance_mismatch"
  | "unreachable"
  | "invalid_license"
  | "no-license";
