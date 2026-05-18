import { z } from "zod";

export const ZCreateDraftFromSurveyInput = z.object({
  surveyId: z.string().cuid(),
});

export const ZInstrumentActionInput = z.object({
  instrumentId: z.string().cuid(),
});
