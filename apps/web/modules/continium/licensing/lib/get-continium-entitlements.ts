import "server-only";
import { cache } from "react";
import {
  ALL_CONTINIUM_FEATURES,
  type ContiniumEntitlements,
  type ContiniumFeature,
  readContiniumLicensingEnv,
  resolveContiniumEntitlements,
} from "@continium/licensing";
import { logger } from "@continium/logger";
import { env } from "@/lib/env";
import { getEnterpriseLicense } from "@/modules/license-check/lib/license";

/**
 * Returns the current Continium entitlements snapshot.
 *
 * For `selfHosted` and `free` editions: reads env vars and resolves statically.
 * For `cloud` edition: calls the license server (via the existing
 * getEnterpriseLicense() cache-and-fallback layer). An active license maps to
 * all Continium features ON; expired/invalid/unreachable maps to `free`
 * (no features) after the grace period expires.
 *
 * Cache semantics: `react.cache()` memoizes per React render pass. The cloud
 * path also benefits from the in-process memory cache inside getEnterpriseLicense().
 */
export const getContiniumEntitlements = cache(async (): Promise<ContiniumEntitlements> => {
  const licensingEnv = readContiniumLicensingEnv(process.env);

  if (licensingEnv.edition !== "cloud") {
    return resolveContiniumEntitlements(licensingEnv);
  }

  // Cloud mode: derive Continium feature set from the license server response.
  if (!env.CONTINIUM_LICENSE_SERVER_URL) {
    logger.warn(
      "CONTINIUM_EDITION=cloud but CONTINIUM_LICENSE_SERVER_URL is not set; falling back to free entitlements"
    );
    return resolveContiniumEntitlements({ edition: "free" });
  }

  try {
    const licenseState = await getEnterpriseLicense();
    const isActive = licenseState.active;

    // Active license → grant all Continium features (compliance-locked ones always on).
    // Inactive / expired / unreachable past grace → free (no features).
    const enabledFeatures = isActive ? buildAllFeaturesEnabled() : buildNoFeatures();

    return {
      edition: "cloud",
      plan: "cloud",
      features: enabledFeatures,
      source: "cloud",
      resolvedAt: new Date(),
    };
  } catch (error) {
    logger.error(error, "Cloud license check failed; falling back to free entitlements");
    return resolveContiniumEntitlements({ edition: "free" });
  }
});

function buildAllFeaturesEnabled(): Record<ContiniumFeature, boolean> {
  return ALL_CONTINIUM_FEATURES.reduce<Record<ContiniumFeature, boolean>>(
    (acc, f) => {
      acc[f] = true;
      return acc;
    },
    {} as Record<ContiniumFeature, boolean>
  );
}

function buildNoFeatures(): Record<ContiniumFeature, boolean> {
  return ALL_CONTINIUM_FEATURES.reduce<Record<ContiniumFeature, boolean>>(
    (acc, f) => {
      acc[f] = false;
      return acc;
    },
    {} as Record<ContiniumFeature, boolean>
  );
}
