/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = process.env;

describe("getContiniumEntitlements", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.resetModules();
  });
  afterEach(() => {
    vi.doUnmock("@/modules/license-check/lib/license");
    process.env = ORIGINAL_ENV;
  });

  it("returns defaults when no env vars are set", async () => {
    delete process.env.CONTINIUM_EDITION;
    delete process.env.CONTINIUM_DISABLED_FEATURES;
    const { getContiniumEntitlements } = await import("../lib/get-continium-entitlements");
    const entitlements = await getContiniumEntitlements();
    expect(entitlements.edition).toBe("selfHosted");
    expect(entitlements.features.clinicalExports).toBe(true);
    expect(entitlements.features.clinicalAuditLog).toBe(true);
    expect(entitlements.features.clinicalEdc).toBe(true);
  });

  it("honors CONTINIUM_DISABLED_FEATURES", async () => {
    process.env.CONTINIUM_DISABLED_FEATURES = "clinicalExports";
    const { getContiniumEntitlements } = await import("../lib/get-continium-entitlements");
    const entitlements = await getContiniumEntitlements();
    expect(entitlements.features.clinicalExports).toBe(false);
    expect(entitlements.features.clinicalTemplates).toBe(true);
  });

  it("rejects disabling compliance-locked features at boot", async () => {
    process.env.CONTINIUM_DISABLED_FEATURES = "clinicalAuditLog";
    const { getContiniumEntitlements } = await import("../lib/get-continium-entitlements");
    await expect(getContiniumEntitlements()).rejects.toThrow(/compliance-locked/i);
  });

  it("cloud edition enables all Continium features when the license is active", async () => {
    process.env.CONTINIUM_EDITION = "cloud";
    process.env.CONTINIUM_LICENSE_SERVER_URL = "https://licenses.example.com";

    vi.doMock("@/modules/license-check/lib/license", () => ({
      getEnterpriseLicense: vi.fn().mockResolvedValue({
        active: true,
        features: {},
        lastChecked: new Date(),
        isPendingDowngrade: false,
        fallbackLevel: "live",
        status: "active",
      }),
    }));

    const { ALL_CONTINIUM_FEATURES } = await import("@continium/licensing");
    const { getContiniumEntitlements } = await import("../lib/get-continium-entitlements");

    const entitlements = await getContiniumEntitlements();
    expect(entitlements.edition).toBe("cloud");
    expect(entitlements.plan).toBe("cloud");
    expect(entitlements.source).toBe("cloud");
    for (const feature of ALL_CONTINIUM_FEATURES) {
      expect(entitlements.features[feature]).toBe(true);
    }
  });

  it("cloud edition disables all Continium features when the license is inactive", async () => {
    process.env.CONTINIUM_EDITION = "cloud";
    process.env.CONTINIUM_LICENSE_SERVER_URL = "https://licenses.example.com";

    vi.doMock("@/modules/license-check/lib/license", () => ({
      getEnterpriseLicense: vi.fn().mockResolvedValue({
        active: false,
        features: null,
        lastChecked: new Date(),
        isPendingDowngrade: false,
        fallbackLevel: "default",
        status: "expired",
      }),
    }));

    const { ALL_CONTINIUM_FEATURES } = await import("@continium/licensing");
    const { getContiniumEntitlements } = await import("../lib/get-continium-entitlements");

    const entitlements = await getContiniumEntitlements();
    expect(entitlements.edition).toBe("cloud");
    expect(entitlements.plan).toBe("cloud");
    expect(entitlements.source).toBe("cloud");
    for (const feature of ALL_CONTINIUM_FEATURES) {
      expect(entitlements.features[feature]).toBe(false);
    }
  });
});
