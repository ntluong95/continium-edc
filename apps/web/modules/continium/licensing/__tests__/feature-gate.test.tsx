/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import {
  CONTINIUM_FEATURES,
  type ContiniumEntitlements,
  type ContiniumFeature,
  resolveContiniumEntitlements,
} from "@continium/licensing";
import { ContiniumEntitlementsProvider } from "../components/continium-entitlements-provider";
import { FeatureGate } from "../components/feature-gate";

const buildEntitlements = (disabledFeatures: ContiniumFeature[] = []): ContiniumEntitlements =>
  resolveContiniumEntitlements({ edition: "selfHosted", disabledFeatures });

describe("<FeatureGate>", () => {
  afterEach(() => {
    cleanup();
  });

  it("resolver disables clinicalExports correctly", () => {
    const e = buildEntitlements([CONTINIUM_FEATURES.clinicalExports]);
    expect(e.features.clinicalExports).toBe(false);
    expect(e.features.clinicalTemplates).toBe(true);
  });

  it("renders children when feature is enabled", () => {
    render(
      createElement(
        ContiniumEntitlementsProvider,
        { value: buildEntitlements() },
        createElement(
          FeatureGate,
          { feature: CONTINIUM_FEATURES.clinicalExports },
          createElement("span", null, "visible")
        )
      )
    );
    expect(screen.getByText("visible")).toBeTruthy();
  });

  it("renders fallback when feature is disabled", () => {
    render(
      createElement(
        ContiniumEntitlementsProvider,
        { value: buildEntitlements([CONTINIUM_FEATURES.clinicalExports]) },
        createElement(
          FeatureGate,
          {
            feature: CONTINIUM_FEATURES.clinicalExports,
            fallback: createElement("span", null, "locked"),
          },
          createElement("span", null, "visible")
        )
      )
    );
    expect(screen.queryByText("visible")).toBeNull();
    expect(screen.getByText("locked")).toBeTruthy();
  });

  it("fails closed for an unknown feature key (runtime cast bypass)", () => {
    render(
      createElement(
        ContiniumEntitlementsProvider,
        { value: buildEntitlements() },
        createElement(
          FeatureGate,
          {
            feature: "clinicalNonexistent" as unknown as ContiniumFeature,
            fallback: createElement("span", null, "locked"),
          },
          createElement("span", null, "visible")
        )
      )
    );
    expect(screen.queryByText("visible")).toBeNull();
    expect(screen.getByText("locked")).toBeTruthy();
  });
});
