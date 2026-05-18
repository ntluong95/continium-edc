/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = process.env;

describe("assertContiniumFeature", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.resetModules();
  });
  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("does not throw when feature is enabled", async () => {
    delete process.env.CONTINIUM_DISABLED_FEATURES;
    const { assertContiniumFeature } = await import("../lib/assert-continium-feature");
    await expect(assertContiniumFeature("clinicalExports")).resolves.toBeUndefined();
  });

  it("throws ContiniumFeatureDisabledError when feature is disabled", async () => {
    process.env.CONTINIUM_DISABLED_FEATURES = "clinicalExports";
    const { assertContiniumFeature } = await import("../lib/assert-continium-feature");
    // Use name match (not instanceof) because vi.resetModules() invalidates class identity
    // across the dynamic import boundary.
    await expect(assertContiniumFeature("clinicalExports")).rejects.toMatchObject({
      name: "ContiniumFeatureDisabledError",
      code: "CONTINIUM_FEATURE_DISABLED",
    });
  });
});
