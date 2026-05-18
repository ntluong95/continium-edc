/*
 * @continium/licensing
 *
 * This Continium licensing / entitlement module is original Continium code.
 * It does not import from or copy Formbricks Enterprise modules.
 * Current implementation is AGPL-compatible and self-hosting friendly.
 */

export {
  CONTINIUM_FEATURES,
  ALL_CONTINIUM_FEATURES,
  COMPLIANCE_LOCKED_FEATURES,
  isComplianceLockedFeature,
} from "./features";

export { CONTINIUM_PLANS, ALL_CONTINIUM_PLANS, CONTINIUM_EDITIONS, getFeaturesForPlan } from "./plans";

export { readContiniumLicensingEnv } from "./env";

export { resolveContiniumEntitlements } from "./resolve-entitlements";

export { isContiniumFeatureEnabled, assertContiniumFeatureEnabled } from "./assert-feature-enabled";

export {
  ContiniumFeatureDisabledError,
  ContiniumLicensingEnvError,
  CONTINIUM_FEATURE_DISABLED_CODE,
} from "./errors";

export type {
  ContiniumFeature,
  ContiniumEdition,
  ContiniumPlan,
  ContiniumEntitlements,
  ContiniumEntitlementsSource,
  ContiniumLicensingEnv,
  ContiniumLicensingEnvInput,
  ResolveContiniumEntitlementsInput,
} from "./types";
