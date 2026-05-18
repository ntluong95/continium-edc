import { describe, expect, it } from "vitest";
import { ALL_CONTINIUM_FEATURES, CONTINIUM_FEATURES } from "../features";
import { resolveContiniumEntitlements } from "../resolve-entitlements";

describe("resolveContiniumEntitlements", () => {
  it("returns selfHosted defaults with every v1 feature enabled when input is empty", () => {
    const result = resolveContiniumEntitlements();
    expect(result.edition).toBe("selfHosted");
    expect(result.plan).toBe("selfHosted");
    expect(result.source).toBe("default");
    for (const feature of ALL_CONTINIUM_FEATURES) {
      expect(result.features[feature]).toBe(true);
    }
  });

  it("disables explicit features but keeps others ON", () => {
    const result = resolveContiniumEntitlements({
      disabledFeatures: [CONTINIUM_FEATURES.clinicalExports],
    });
    expect(result.features.clinicalExports).toBe(false);
    expect(result.features.clinicalTemplates).toBe(true);
    expect(result.source).toBe("env");
  });

  it("free edition has every feature OFF", () => {
    const result = resolveContiniumEntitlements({ edition: "free" });
    for (const feature of ALL_CONTINIUM_FEATURES) {
      expect(result.features[feature]).toBe(false);
    }
    expect(result.edition).toBe("free");
    expect(result.plan).toBe("free");
  });

  it("cloud edition base resolver has every feature OFF until web app applies license-server result", () => {
    const result = resolveContiniumEntitlements({ edition: "cloud" });
    for (const feature of ALL_CONTINIUM_FEATURES) {
      expect(result.features[feature]).toBe(false);
    }
    expect(result.edition).toBe("cloud");
    expect(result.plan).toBe("cloud");
  });

  it("compliance-locked features stay ON even if listed in disabledFeatures (defense in depth)", () => {
    // Note: the env loader rejects this at boot; the resolver re-enforces.
    const result = resolveContiniumEntitlements({
      disabledFeatures: [
        CONTINIUM_FEATURES.clinicalEdc,
        CONTINIUM_FEATURES.clinicalAuditLog,
        CONTINIUM_FEATURES.clinicalExports,
      ],
    });
    expect(result.features.clinicalEdc).toBe(true);
    expect(result.features.clinicalAuditLog).toBe(true);
    expect(result.features.clinicalExports).toBe(false);
  });

  it("returns a Date for resolvedAt", () => {
    const result = resolveContiniumEntitlements();
    expect(result.resolvedAt).toBeInstanceOf(Date);
  });

  it("source is env when edition is explicitly passed", () => {
    const result = resolveContiniumEntitlements({ edition: "selfHosted" });
    expect(result.source).toBe("env");
  });
});
