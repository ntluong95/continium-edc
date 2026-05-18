/**
 * Continium clinical feature registry.
 *
 * v1 feature set. Keys reflect actual modules in the codebase.
 * Speculative features (randomization, monitoring, advanced validation,
 * workspace integrations) are intentionally omitted — add them in the PR
 * that ships the underlying feature.
 */
export const CONTINIUM_FEATURES = {
  clinicalEdc: "clinicalEdc",
  clinicalTemplates: "clinicalTemplates",
  clinicalDataAccessGroups: "clinicalDataAccessGroups",
  clinicalAccessRules: "clinicalAccessRules",
  clinicalAuditLog: "clinicalAuditLog",
  clinicalResponseSync: "clinicalResponseSync",
  clinicalExports: "clinicalExports",
  clinicalApiAccess: "clinicalApiAccess",
} as const;

export type ContiniumFeature = (typeof CONTINIUM_FEATURES)[keyof typeof CONTINIUM_FEATURES];

export const ALL_CONTINIUM_FEATURES: readonly ContiniumFeature[] = Object.values(CONTINIUM_FEATURES);

/**
 * Features that cannot be disabled via environment variable.
 * Disable attempts are rejected at boot to prevent regulatory-compliance gaps:
 * - clinicalEdc: gates the CLINICAL project mode itself
 * - clinicalAuditLog: read-access to 21 CFR Part 11-aligned audit records
 */
export const COMPLIANCE_LOCKED_FEATURES: ReadonlySet<ContiniumFeature> = new Set([
  CONTINIUM_FEATURES.clinicalEdc,
  CONTINIUM_FEATURES.clinicalAuditLog,
]);

export const isComplianceLockedFeature = (feature: ContiniumFeature): boolean =>
  COMPLIANCE_LOCKED_FEATURES.has(feature);
