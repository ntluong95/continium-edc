import { defineJob, surveyFollowUpResponseJobContract } from "@continium/jobs";
import { logger } from "@continium/logger";
import { workerEnv } from "../lib/env";

export const followUpResponseJob = defineJob({
  contract: surveyFollowUpResponseJobContract,
  options: {
    concurrency: 5,
    defaultEnqueueOptions: {
      retryLimit: 3,
      retryDelaySeconds: 5,
      retryBackoff: true,
    },
  },
  handler: async ({ responseId }) => {
    const response = await fetch(workerEnv.followUpEndpointUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": workerEnv.cronSecret,
      },
      body: JSON.stringify({ responseId }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Follow-up endpoint failed (${response.status}): ${errorBody}`);
    }

    logger.debug({ responseId }, "Follow-up response job completed");
  },
});
