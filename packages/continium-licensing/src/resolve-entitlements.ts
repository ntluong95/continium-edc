import {
  ALL_CONTINIUM_FEATURES,
  COMPLIANCE_LOCKED_FEATURES,
  type ContiniumFeature,
} from "./features";
import { getFeaturesForPlan, type ContiniumEdition, type ContiniumPlan } from "./plans";
import type { ContiniumEntitlements, ContiniumEntitlementsSource } from "./entitlements";

const editionToPlan = (edition: ContiniumEdition): ContiniumPlan => edition;

export type ResolveContiniumEntitlementsInput = {
  edition?: ContiniumEdition;
  disabledFeatures?: readonly ContiniumFeature[];
};

/**
 * Resolves the runtime entitlements snapshot.
 *
 * Self-hosted v1: all clinical features ON unless listed in `disabledFeatures`.
 * Compliance-locked features (clinicalEdc, clinicalAuditLog) stay ON even if
 * accidentally passed in `disabledFeatures` — defense in depth; the env loader
 * should already have rejected them at boot.
 */
export const resolveContiniumEntitlements = (
  input: ResolveContiniumEntitlementsInput = {},
): ContiniumEntitlements => {
  const edition: ContiniumEdition = input.edition ?? "selfHosted";
  const plan = editionToPlan(edition);
  const enabled = getFeaturesForPlan(plan);
  const disabled = new Set<ContiniumFeature>(input.disabledFeatures ?? []);

  const features = ALL_CONTINIUM_FEATURES.reduce<Record<ContiniumFeature, boolean>>(
    (acc, feature) => {
      const isEnabled = enabled.has(feature);
      const isExplicitlyDisabled = disabled.has(feature);
      const isLocked = COMPLIANCE_LOCKED_FEATURES.has(feature);
      acc[feature] = isLocked ? isEnabled : isEnabled && !isExplicitlyDisabled;
      return acc;
    },
    {} as Record<ContiniumFeature, boolean>,
  );

  const source: ContiniumEntitlementsSource =
    input.edition !== undefined || (input.disabledFeatures && input.disabledFeatures.length > 0)
      ? "env"
      : "default";

  return {
    edition,
    plan,
    features,
    source,
    resolvedAt: new Date(),
  };
};
