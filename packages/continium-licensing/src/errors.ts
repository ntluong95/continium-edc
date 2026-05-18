import type { ContiniumFeature } from "./features";

export const CONTINIUM_FEATURE_DISABLED_CODE = "CONTINIUM_FEATURE_DISABLED" as const;

/**
 * Thrown when server code asserts a feature that is disabled or unknown.
 *
 * Registered in `packages/types/errors.ts` `EXPECTED_ERROR_NAMES` so that
 * `next-safe-action` converts it to a structured action result instead of
 * a Sentry 500. Route handlers should catch it explicitly and return a
 * generic 403 (never the feature key — that's reconnaissance for attackers).
 */
export class ContiniumFeatureDisabledError extends Error {
  readonly code = CONTINIUM_FEATURE_DISABLED_CODE;
  readonly feature: ContiniumFeature | string;

  constructor(feature: ContiniumFeature | string) {
    super(`Continium feature is disabled: ${feature}`);
    this.name = "ContiniumFeatureDisabledError";
    this.feature = feature;
  }
}

/** Thrown at boot when env config is invalid (unknown feature, compliance-locked disable, etc.) */
export class ContiniumLicensingEnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContiniumLicensingEnvError";
  }
}
