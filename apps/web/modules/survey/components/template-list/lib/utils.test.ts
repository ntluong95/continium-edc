import "@testing-library/jest-dom/vitest";
import type { TFunction } from "i18next";
import { describe, expect, test, vi } from "vitest";
import type { TSurveyElement } from "@continium/types/surveys/elements";
import { TTemplate } from "@continium/types/templates";
import { structuredClone } from "@/lib/pollyfills/structuredClone";
import { replacePresetPlaceholders } from "@/lib/utils/templates";
import { getChannelMapping, getIndustryMapping, getRoleMapping } from "./utils";

vi.mock("@/lib/pollyfills/structuredClone", () => ({
  structuredClone: vi.fn((val) => JSON.parse(JSON.stringify(val))),
}));

describe("Template utils", () => {
  test("replacePresetPlaceholders replaces project name in template with blocks", () => {
    const mockTemplate: TTemplate = {
      name: "Test Template",
      description: "Template description",
      preset: {
        name: "$[projectName] Feedback",
        welcomeCard: { enabled: false, timeToFinish: false, showResponseCount: false },
        blocks: [
          {
            id: "block1",
            name: "Block 1",
            elements: [
              {
                id: "elem1",
                type: "openText",
                headline: {
                  default: "How would you rate $[projectName]?",
                },
                required: false,
                inputType: "text",
              } as unknown as TSurveyElement,
            ],
          },
        ],
        endings: [],
        hiddenFields: { enabled: true, fieldIds: [] },
      } as any,
    };

    const mockProject = {
      name: "TestProject",
    };

    const result = replacePresetPlaceholders(mockTemplate, mockProject);

    expect(structuredClone).toHaveBeenCalledWith(mockTemplate.preset);
    expect(result.preset.name).toBe("TestProject Feedback");
    expect(result.preset.blocks[0].elements[0].headline?.default).toBe("How would you rate TestProject?");
  });

  test("getChannelMapping returns correct channel mappings", () => {
    const mockT = vi.fn((key: string) => key) as unknown as TFunction;

    const result = getChannelMapping(mockT);

    expect(result).toEqual([
      { value: "website", label: "common.website_survey" },
      { value: "app", label: "common.app_survey" },
      { value: "link", label: "common.link_survey" },
    ]);
    expect(mockT).toHaveBeenCalledWith("common.website_survey");
    expect(mockT).toHaveBeenCalledWith("common.app_survey");
    expect(mockT).toHaveBeenCalledWith("common.link_survey");
  });

  test("getIndustryMapping returns correct industry mappings", () => {
    const mockT = vi.fn((key: string) => key) as unknown as TFunction;

    const result = getIndustryMapping(mockT);

    expect(result).toEqual([
      { value: "clinicalTrial", label: "common.clinicalTrial" },
      { value: "registryCohort", label: "common.registryCohort" },
      { value: "other", label: "common.other" },
    ]);
    expect(mockT).toHaveBeenCalledWith("common.clinicalTrial");
    expect(mockT).toHaveBeenCalledWith("common.registryCohort");
    expect(mockT).toHaveBeenCalledWith("common.other");
  });

  test("getRoleMapping returns correct role mappings", () => {
    const mockT = vi.fn((key: string) => key) as unknown as TFunction;

    const result = getRoleMapping(mockT);

    expect(result).toEqual([
      { value: "studyCoordinator", label: "common.product_manager" },
      { value: "clinician", label: "common.customer_success" },
      { value: "labStaff", label: "common.labStaff" },
      { value: "dataManager", label: "common.dataManager" },
      { value: "monitorAuditor", label: "common.people_manager" },
    ]);
    expect(mockT).toHaveBeenCalledWith("common.product_manager");
    expect(mockT).toHaveBeenCalledWith("common.customer_success");
    expect(mockT).toHaveBeenCalledWith("common.labStaff");
    expect(mockT).toHaveBeenCalledWith("common.dataManager");
    expect(mockT).toHaveBeenCalledWith("common.people_manager");
  });
});
