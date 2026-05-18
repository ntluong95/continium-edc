import { z } from "zod";
import { defineJob, defineJobContract } from "@continium/jobs";
import { logger } from "@continium/logger";

const exampleJobContract = defineJobContract(
  "worker.example.log",
  z.object({
    message: z.string().trim().min(1),
  })
);

export const exampleJob = defineJob({
  contract: exampleJobContract,
  options: {
    concurrency: 1,
  },
  handler: async (payload) => {
    logger.info({ payload }, "Processed example worker job");
  },
});
