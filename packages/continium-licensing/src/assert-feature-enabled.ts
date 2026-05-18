import type { ContiniumEntitlements } from "./entitlements";
import { ALL_CONTINIUM_FEATURES, type ContiniumFeature } from "./features";
import { ContiniumFeatureDisabledError } from "./errors";

const isKnownFeature = (feature: string): feature is ContiniumFeature =>
  (ALL_CONTINIUM_FEATURES as readonly string[]).includes(feature);

export const isContiniumFeatureEnabled = (
  entitlements: ContiniumEntitlements,
  feature: ContiniumFeature | string,
): boolean => {
  if (!isKnownFeature(feature)) return false;
  return entitlements.features[feature] === true;
};

/**
 * Throws ContiniumFeatureDisabledError when the feature is disabled OR unknown.
 *
 * Unknown keys fail-closed: a caller passing an arbitrary string never receives
 * a "feature enabled" answer from this function.
 */
export const assertContiniumFeatureEnabled = (
  entitlements: ContiniumEntitlements,
  feature: ContiniumFeature | string,
): void => {
  if (!isContiniumFeatureEnabled(entitlements, feature)) {
    throw new ContiniumFeatureDisabledError(feature);
  }
};
