import { InstrumentStatus, SurveyStatus } from "@prisma/client";
import { ValidationError } from "@continium/types/errors";

export const DATA_ENTRY_PUBLISH_ERROR = "This form must be published before clinical data entry.";

/**
 * The minimum shape `getInstrumentDataEntryState` must see to decide whether
 * subject data entry is allowed. `survey` is REQUIRED (not optional) so that a
 * Prisma query that forgets `include: instrumentForEligibilityInclude` becomes
 * a compile-time error instead of a silent runtime fail-safe.
 *
 * Pair this with `instrumentForEligibilityInclude` /
 * `TInstrumentForEligibility` from
 * `@/modules/clinical/instruments/lib/instrument-includes`.
 */
type InstrumentLike = {
  status: InstrumentStatus;
  surveyId: string | null;
  survey: { status: SurveyStatus } | null;
};

export type DataEntryBlockReason =
  | "instrument_not_published"
  | "instrument_archived"
  | "survey_not_published"
  | "survey_unavailable";

export const isSurveyPublishedForDataEntry = (status?: SurveyStatus | null) =>
  status === SurveyStatus.inProgress;

export const getInstrumentDataEntryState = (instrument: InstrumentLike) => {
  if (instrument.status === InstrumentStatus.ARCHIVED) {
    return {
      canEnterData: false,
      reason: "instrument_archived" as const,
      title: "Form archived",
      message: "This clinical instrument version is archived and cannot be used for subject data entry.",
    };
  }

  if (instrument.status !== InstrumentStatus.PUBLISHED) {
    return {
      canEnterData: false,
      reason: "instrument_not_published" as const,
      title: "Form not published",
      message:
        "This clinical instrument version is not published. Publish the form version before collecting clinical data.",
    };
  }

  if (instrument.surveyId && !instrument.survey) {
    return {
      canEnterData: false,
      reason: "survey_unavailable" as const,
      title: "Form unavailable",
      message: "The linked form is unavailable. Restore or relink the form before collecting clinical data.",
    };
  }

  if (instrument.surveyId && !isSurveyPublishedForDataEntry(instrument.survey?.status)) {
    return {
      canEnterData: false,
      reason: "survey_not_published" as const,
      title: "Form not published",
      message:
        "This form is not available for subject data entry yet. Publish the form before collecting clinical data.",
    };
  }

  return {
    canEnterData: true,
    reason: null,
    title: null,
    message: null,
  };
};

export const assertInstrumentCanEnterData = (instrument: InstrumentLike) => {
  const state = getInstrumentDataEntryState(instrument);
  if (!state.canEnterData) {
    throw new ValidationError(DATA_ENTRY_PUBLISH_ERROR);
  }
};
