import { describe, expect, it } from "vitest";
import {
  assertContiniumFeatureEnabled,
  isContiniumFeatureEnabled,
} from "../assert-feature-enabled";
import { resolveContiniumEntitlements } from "../resolve-entitlements";
import {
  CONTINIUM_FEATURE_DISABLED_CODE,
  ContiniumFeatureDisabledError,
} from "../errors";
import { CONTINIUM_FEATURES } from "../features";

describe("isContiniumFeatureEnabled", () => {
  it("returns true for enabled features", () => {
    const entitlements = resolveContiniumEntitlements();
    expect(isContiniumFeatureEnabled(entitlements, CONTINIUM_FEATURES.clinicalExports)).toBe(true);
  });

  it("returns false for disabled features", () => {
    const entitlements = resolveContiniumEntitlements({
      disabledFeatures: [CONTINIUM_FEATURES.clinicalExports],
    });
    expect(isContiniumFeatureEnabled(entitlements, CONTINIUM_FEATURES.clinicalExports)).toBe(false);
  });

  it("returns false for unknown feature keys (fail-closed)", () => {
    const entitlements = resolveContiniumEntitlements();
    expect(isContiniumFeatureEnabled(entitlements, "clinicalNonexistent")).toBe(false);
  });
});

describe("assertContiniumFeatureEnabled", () => {
  it("does not throw when feature is enabled", () => {
    const entitlements = resolveContiniumEntitlements();
    expect(() =>
      assertContiniumFeatureEnabled(entitlements, CONTINIUM_FEATURES.clinicalExports),
    ).not.toThrow();
  });

  it("throws ContiniumFeatureDisabledError with stable code when feature is disabled", () => {
    const entitlements = resolveContiniumEntitlements({
      disabledFeatures: [CONTINIUM_FEATURES.clinicalExports],
    });
    try {
      assertContiniumFeatureEnabled(entitlements, CONTINIUM_FEATURES.clinicalExports);
      throw new Error("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ContiniumFeatureDisabledError);
      const err = e as ContiniumFeatureDisabledError;
      expect(err.code).toBe(CONTINIUM_FEATURE_DISABLED_CODE);
      expect(err.feature).toBe(CONTINIUM_FEATURES.clinicalExports);
      expect(err.name).toBe("ContiniumFeatureDisabledError");
    }
  });

  it("throws for unknown feature keys", () => {
    const entitlements = resolveContiniumEntitlements();
    expect(() => assertContiniumFeatureEnabled(entitlements, "clinicalNonexistent")).toThrow(
      ContiniumFeatureDisabledError,
    );
  });
});
