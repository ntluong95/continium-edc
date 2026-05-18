import { z } from "zod";
import { defineJobContract } from "../define-job";

export const surveyFollowUpResponseJobContract = defineJobContract(
  "survey.follow-up-response.send",
  z.object({
    responseId: z.string().trim().min(1),
  })
);

export type TSurveyFollowUpResponseJobPayload = z.infer<typeof surveyFollowUpResponseJobContract.schema>;
