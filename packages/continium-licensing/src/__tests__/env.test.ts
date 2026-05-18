import { describe, expect, it } from "vitest";
import { readContiniumLicensingEnv } from "../env";
import { ContiniumLicensingEnvError } from "../errors";

describe("readContiniumLicensingEnv", () => {
  it("returns selfHosted defaults when env is empty", () => {
    const result = readContiniumLicensingEnv({});
    expect(result).toEqual({ edition: "selfHosted", disabledFeatures: [] });
  });

  it("accepts free edition", () => {
    const result = readContiniumLicensingEnv({ CONTINIUM_EDITION: "free" });
    expect(result.edition).toBe("free");
  });

  it("accepts cloud edition", () => {
    const result = readContiniumLicensingEnv({ CONTINIUM_EDITION: "cloud" });
    expect(result.edition).toBe("cloud");
  });

  it("rejects unknown edition", () => {
    expect(() => readContiniumLicensingEnv({ CONTINIUM_EDITION: "enterprise" })).toThrow(
      ContiniumLicensingEnvError
    );
  });

  it("parses a single disabled feature", () => {
    const result = readContiniumLicensingEnv({ CONTINIUM_DISABLED_FEATURES: "clinicalExports" });
    expect(result.disabledFeatures).toEqual(["clinicalExports"]);
  });

  it("parses multiple disabled features and trims whitespace", () => {
    const result = readContiniumLicensingEnv({
      CONTINIUM_DISABLED_FEATURES: "clinicalExports,clinicalTemplates",
    });
    expect(result.disabledFeatures).toEqual(["clinicalExports", "clinicalTemplates"]);
  });

  it("rejects unknown feature keys (fail-closed)", () => {
    expect(() => readContiniumLicensingEnv({ CONTINIUM_DISABLED_FEATURES: "clinicalNonexistent" })).toThrow(
      ContiniumLicensingEnvError
    );
  });

  it("rejects compliance-locked feature: clinicalEdc", () => {
    expect(() => readContiniumLicensingEnv({ CONTINIUM_DISABLED_FEATURES: "clinicalEdc" })).toThrow(
      /compliance-locked/i
    );
  });

  it("rejects compliance-locked feature: clinicalAuditLog", () => {
    expect(() => readContiniumLicensingEnv({ CONTINIUM_DISABLED_FEATURES: "clinicalAuditLog" })).toThrow(
      /compliance-locked/i
    );
  });

  it("rejects oversized input", () => {
    const oversized = "a".repeat(2048);
    expect(() => readContiniumLicensingEnv({ CONTINIUM_DISABLED_FEATURES: oversized })).toThrow(
      ContiniumLicensingEnvError
    );
  });

  it("rejects shell-meta characters", () => {
    expect(() => readContiniumLicensingEnv({ CONTINIUM_DISABLED_FEATURES: "clinical*" })).toThrow(
      /disallowed characters/i
    );
    expect(() => readContiniumLicensingEnv({ CONTINIUM_DISABLED_FEATURES: "clinicalExports;rm" })).toThrow(
      /disallowed characters/i
    );
  });

  it("treats empty disabled-features string as no overrides", () => {
    const result = readContiniumLicensingEnv({ CONTINIUM_DISABLED_FEATURES: "" });
    expect(result.disabledFeatures).toEqual([]);
  });

  it("treats whitespace-only edition as default selfHosted", () => {
    const result = readContiniumLicensingEnv({ CONTINIUM_EDITION: "   " });
    expect(result.edition).toBe("selfHosted");
  });
});
