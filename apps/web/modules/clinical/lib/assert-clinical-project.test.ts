import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock server-only (throws during test evaluation otherwise)
vi.mock("server-only", () => ({}));

// Mock next/navigation before importing the module under test
vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

import { assertClinicalProject } from "./assert-clinical-project";
import type { TProject } from "@continium/types/project";
import * as navigationModule from "next/navigation";

// Minimal mock project factory — only fields required by TProject
const makeProject = (overrides: Partial<TProject> = {}): TProject =>
  ({
    id: "proj_test",
    createdAt: new Date(),
    updatedAt: new Date(),
    name: "Test Project",
    organizationId: "org_test",
    styling: { allowStyleOverwrite: true },
    config: {},
    recontactDays: 7,
    inAppSurveyBranding: true,
    linkSurveyBranding: true,
    placement: "bottomRight",
    clickOutsideClose: true,
    overlay: "none",
    environments: [],
    languages: [],
    kind: "PRODUCT",
    ...overrides,
  }) as TProject;

describe("assertClinicalProject", () => {
  beforeEach(() => {
    vi.mocked(navigationModule.notFound).mockReset();
  });

  it("calls notFound() when project is null", () => {
    assertClinicalProject(null);
    expect(vi.mocked(navigationModule.notFound)).toHaveBeenCalledOnce();
  });

  it("calls notFound() when project.kind is PRODUCT", () => {
    assertClinicalProject(makeProject({ kind: "PRODUCT" }));
    expect(vi.mocked(navigationModule.notFound)).toHaveBeenCalledOnce();
  });

  it("does NOT call notFound() when project.kind is CLINICAL", () => {
    assertClinicalProject(makeProject({ kind: "CLINICAL" }));
    expect(vi.mocked(navigationModule.notFound)).not.toHaveBeenCalled();
  });
});
