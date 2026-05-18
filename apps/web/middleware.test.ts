import { describe, expect, test } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

const makeRequest = (url: string): NextRequest =>
  new NextRequest(new URL(url, "https://continium.example.com"));

describe("middleware: /surveys/* -> /forms/* legacy redirect", () => {
  test("redirects the bare survey index path", () => {
    const response = middleware(makeRequest("/environments/env_1/surveys"));
    expect(response).toBeDefined();
    expect(response?.status).toBe(308);
    expect(response?.headers.get("location")).toBe(
      "https://continium.example.com/environments/env_1/forms"
    );
  });

  test("redirects a deep survey path with trailing segments", () => {
    const response = middleware(
      makeRequest("/environments/env_1/surveys/survey_42/summary")
    );
    expect(response?.status).toBe(308);
    expect(response?.headers.get("location")).toBe(
      "https://continium.example.com/environments/env_1/forms/survey_42/summary"
    );
  });

  test("preserves query string and hash on redirect", () => {
    const response = middleware(
      makeRequest("/environments/env_1/surveys/survey_42?tab=responses#row-7")
    );
    const location = response?.headers.get("location") ?? "";
    expect(location).toContain("/environments/env_1/forms/survey_42");
    expect(location).toContain("tab=responses");
    expect(location).toContain("#row-7");
  });

  test("leaves non-survey UI paths alone", () => {
    expect(middleware(makeRequest("/environments/env_1/clinical/subjects"))).toBeUndefined();
    expect(middleware(makeRequest("/environments/env_1/forms/survey_1/summary"))).toBeUndefined();
    expect(middleware(makeRequest("/environments/env_1/settings"))).toBeUndefined();
  });

  test("leaves the public management API paths alone (defence in depth — matcher already excludes them)", () => {
    expect(middleware(makeRequest("/api/v1/management/surveys"))).toBeUndefined();
    expect(middleware(makeRequest("/api/v2/management/surveys/survey_1"))).toBeUndefined();
    expect(middleware(makeRequest("/api/v3/surveys/survey_1"))).toBeUndefined();
  });

  test("path normalisation: ../ segments collapse before the regex runs", () => {
    // NextRequest normalises `..` segments. A path like `/environments/env_1/surveys/../../etc/passwd`
    // ends up as `/etc/passwd` and therefore no longer matches the surveys
    // prefix. Documents the runtime behaviour we rely on rather than asserting
    // a specific redirect target.
    expect(
      middleware(makeRequest("/environments/env_1/surveys/../../etc/passwd"))
    ).toBeUndefined();
    expect(middleware(makeRequest("/environments"))).toBeUndefined();
  });
});
