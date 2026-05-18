import "server-only";
import {
  ContiniumFeatureDisabledError,
  assertContiniumFeatureEnabled,
  type ContiniumFeature,
} from "@continium/licensing";
import { getContiniumEntitlements } from "./get-continium-entitlements";

/**
 * Server-side feature gate.
 *
 * Throws `ContiniumFeatureDisabledError` when the feature is disabled or unknown.
 * `next-safe-action`'s `actionClient` is configured to treat this error as
 * expected (see `packages/types/errors.ts` EXPECTED_ERROR_NAMES) and returns
 * a structured action result instead of a 500.
 *
 * Route handlers (which don't use actionClient) should catch this error
 * explicitly and return a generic 403 — never include the feature key in
 * the response body, that's reconnaissance.
 */
export const assertContiniumFeature = async (feature: ContiniumFeature): Promise<void> => {
  const entitlements = await getContiniumEntitlements();
  assertContiniumFeatureEnabled(entitlements, feature);
};

export { ContiniumFeatureDisabledError };
