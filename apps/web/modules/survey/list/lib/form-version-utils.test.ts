import { describe, expect, test } from "vitest";
import {
  filterAndSortFormVersionRows,
  flattenFormVersionRows,
  getActiveFormVersionCount,
} from "./form-version-utils";

const dashboard = {
  study: { id: "study_1" },
  standaloneVersions: [
    {
      id: "inst_standalone",
      version: 1,
      status: "ARCHIVED",
      name: "Legacy Intake",
      displayName: "Legacy Intake",
      publishedAt: new Date("2026-05-10T00:00:00.000Z"),
      fieldCount: 4,
      boundEventCount: 0,
      sourceSurveyChanged: false,
      diff: null,
    },
  ],
  surveyGroups: [
    {
      survey: { id: "survey_1", name: "Baseline Data", status: "draft" },
      versions: [
        {
          id: "inst_2",
          version: 2,
          status: "PUBLISHED",
          name: "Baseline Data",
          displayName: "Baseline Data",
          publishedAt: new Date("2026-05-12T00:00:00.000Z"),
          fieldCount: 12,
          boundEventCount: 4,
          sourceSurveyChanged: true,
          diff: null,
        },
        {
          id: "inst_1",
          version: 1,
          status: "DRAFT",
          name: "Baseline Data",
          displayName: "Baseline Data",
          publishedAt: null,
          fieldCount: 10,
          boundEventCount: 0,
          sourceSurveyChanged: false,
          diff: null,
        },
      ],
    },
  ],
} as any;

describe("form version utilities", () => {
  test("flattens survey-backed and standalone versions", () => {
    const rows = flattenFormVersionRows(dashboard);

    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ formName: "Baseline Data", surveyId: "survey_1", source: "survey" });
    expect(rows[2]).toMatchObject({ formName: "Legacy Intake", source: "standalone" });
  });

  test("counts active versions excluding archived rows", () => {
    expect(getActiveFormVersionCount(flattenFormVersionRows(dashboard))).toBe(2);
  });

  test("filters survey changed versions and sorts by event usage", () => {
    const rows = flattenFormVersionRows(dashboard);
    const filteredRows = filterAndSortFormVersionRows(rows, {
      query: "baseline",
      status: "SURVEY_CHANGED",
      sortBy: "eventBindings",
    });

    expect(filteredRows.map((row) => row.id)).toEqual(["inst_2"]);
  });
});
