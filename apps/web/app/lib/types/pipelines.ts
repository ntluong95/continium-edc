import { TResponse } from "@continium/types/responses";
import { TPipelineEvent } from "@/app/api/(internal)/pipeline/types/pipelines";

export interface TPipelineInput {
  event: TPipelineEvent;
  response: TResponse;
  environmentId: string;
  surveyId: string;
}
