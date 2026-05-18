import { InstrumentStatus, SurveyStatus } from "@prisma/client";
import { describe, expect, test } from "vitest";
import {
  DATA_ENTRY_PUBLISH_ERROR,
  assertInstrumentCanEnterData,
  getInstrumentDataEntryState,
} from "./data-entry-eligibility";

describe("getInstrumentDataEntryState", () => {
  test("blocks a draft survey even when the clinical instrument is published", () => {
    const state = getInstrumentDataEntryState({
      status: InstrumentStatus.PUBLISHED,
      surveyId: "survey_1",
      survey: { status: SurveyStatus.draft },
    });

    expect(state.canEnterData).toBe(false);
    expect(state.reason).toBe("survey_not_published");
  });

  test("blocks a draft clinical instrument even when the linked survey is published", () => {
    const state = getInstrumentDataEntryState({
      status: InstrumentStatus.DRAFT,
      surveyId: "survey_1",
      survey: { status: SurveyStatus.inProgress },
    });

    expect(state.canEnterData).toBe(false);
    expect(state.reason).toBe("instrument_not_published");
  });

  test("blocks an archived clinical instrument", () => {
    const state = getInstrumentDataEntryState({
      status: InstrumentStatus.ARCHIVED,
      surveyId: "survey_1",
      survey: { status: SurveyStatus.inProgress },
    });

    expect(state.canEnterData).toBe(false);
    expect(state.reason).toBe("instrument_archived");
  });

  test("allows subject data entry only when both clinical instrument and linked survey are published", () => {
    const state = getInstrumentDataEntryState({
      status: InstrumentStatus.PUBLISHED,
      surveyId: "survey_1",
      survey: { status: SurveyStatus.inProgress },
    });

    expect(state.canEnterData).toBe(true);
    expect(state.reason).toBeNull();
  });

  test("blocks linked clinical instruments when the survey cannot be resolved", () => {
    const state = getInstrumentDataEntryState({
      status: InstrumentStatus.PUBLISHED,
      surveyId: "survey_1",
      survey: null,
    });

    expect(state.canEnterData).toBe(false);
    expect(state.reason).toBe("survey_unavailable");
  });

  test("throws the expected validation error for server-side data entry enforcement", () => {
    expect(() =>
      assertInstrumentCanEnterData({
        status: InstrumentStatus.PUBLISHED,
        surveyId: "survey_1",
        survey: { status: SurveyStatus.paused },
      })
    ).toThrow(DATA_ENTRY_PUBLISH_ERROR);
  });
});
