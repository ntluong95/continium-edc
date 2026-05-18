import { SurveyStatus } from "@prisma/client";
import { describe, expect, test } from "vitest";
import { getInstrumentDataEntryState } from "@/modules/clinical/records/lib/data-entry-eligibility";
import {
  type TInstrumentForEligibility,
  instrumentForEligibilityInclude,
} from "./instrument-includes";

describe("instrumentForEligibilityInclude", () => {
  test("selects survey id and status", () => {
    expect(instrumentForEligibilityInclude.survey.select).toEqual({
      id: true,
      status: true,
    });
  });

  test("TInstrumentForEligibility is structurally accepted by getInstrumentDataEntryState", () => {
    // This is a compile-time assertion as much as a runtime one: if the
    // eligibility predicate were tightened to require fields absent from the
    // canonical include, this test would fail to typecheck.
    const instrument = {
      id: "instrument_1",
      createdAt: new Date(),
      updatedAt: new Date(),
      studyId: "study_1",
      surveyId: "survey_1",
      version: 1,
      status: "PUBLISHED" as const,
      publishedAt: new Date(),
      publishedById: null,
      name: "Demographics",
      displayName: "Demographics",
      sourceSurveyHash: "sha256:source",
      fieldHash: "sha256:fields",
      survey: { id: "survey_1", status: SurveyStatus.inProgress },
    } satisfies TInstrumentForEligibility;

    const state = getInstrumentDataEntryState(instrument);
    expect(state.canEnterData).toBe(true);
  });
});
