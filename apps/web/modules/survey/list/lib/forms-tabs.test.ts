import { describe, expect, test } from "vitest";
import { getFormsTabHref, parseFormsTabParam } from "./forms-tabs";

describe("forms tab routing helpers", () => {
  test("defaults to the Forms tab", () => {
    expect(parseFormsTabParam(undefined)).toBe("forms");
    expect(parseFormsTabParam("unknown")).toBe("forms");
  });

  test("accepts current and legacy version tab aliases", () => {
    expect(parseFormsTabParam("form-version")).toBe("form-version");
    expect(parseFormsTabParam("versions")).toBe("form-version");
    expect(parseFormsTabParam("instrument-registry")).toBe("form-version");
    expect(parseFormsTabParam(["form-version"])).toBe("form-version");
  });

  test("builds deep links for each tab", () => {
    expect(getFormsTabHref("env_123", "forms")).toBe("/environments/env_123/forms?tab=forms");
    expect(getFormsTabHref("env_123", "form-version")).toBe("/environments/env_123/forms?tab=form-version");
  });
});
