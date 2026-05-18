import { logger } from "@continium/logger";
import { TPipelineInput } from "@/app/lib/types/pipelines";
import { CRON_SECRET, WEBAPP_URL } from "@/lib/constants";
import { redactClinicalResponseInResponse } from "@/modules/clinical/lib/redact-clinical-response-meta";

export const sendToPipeline = async ({ event, surveyId, environmentId, response }: TPipelineInput) => {
  if (!CRON_SECRET) {
    throw new Error("CRON_SECRET is not set");
  }

  // Webhook subscribers are third-party consumers with no clinical access
  // surface. Strip clinical PII from `Response.meta` before serialisation;
  // survey responses pass through untouched.
  const redactedResponse = redactClinicalResponseInResponse(response);

  return fetch(`${WEBAPP_URL}/api/pipeline`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CRON_SECRET,
    },
    body: JSON.stringify({
      environmentId: environmentId,
      surveyId: surveyId,
      event,
      response: redactedResponse,
    }),
  }).catch((error) => {
    logger.error(error, "Error sending event to pipeline");
  });
};
