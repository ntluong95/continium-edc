import { createQueueClient, surveyFollowUpResponseJobContract } from "@continium/jobs";
import { logger } from "@continium/logger";
import { env } from "@/lib/env";

const queueClient = createQueueClient({
  connectionString: env.JOBS_DATABASE_URL ?? env.DATABASE_URL,
  schema: "pgboss",
  logger,
});

export const enqueueFollowUpResponseJob = async (responseId: string): Promise<string | null> => {
  return queueClient.enqueue(
    surveyFollowUpResponseJobContract,
    { responseId },
    {
      retryLimit: 3,
      retryDelaySeconds: 5,
      retryBackoff: true,
    }
  );
};
