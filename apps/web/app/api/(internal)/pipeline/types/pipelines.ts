import { z } from "zod";
import { ZResponse } from "@continium/types/responses";

export const ZPipelineEvent = z.enum(["responseFinished", "responseCreated", "responseUpdated"]);
export type TPipelineEvent = z.infer<typeof ZPipelineEvent>;

export const ZPipelineInput = z.object({
  event: ZPipelineEvent,
  response: ZResponse,
  environmentId: z.string(),
  surveyId: z.string(),
});

export type TPipelineInput = z.infer<typeof ZPipelineInput>;
