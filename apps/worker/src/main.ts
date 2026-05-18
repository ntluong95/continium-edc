import { JobRunner } from "@continium/jobs";
import { logger } from "@continium/logger";
import { jobs } from "./jobs";
import { partitionCreateJobContract } from "./jobs/partition-create.job";
import { workerEnv } from "./lib/env";

const runner = new JobRunner({
  connectionString: workerEnv.jobsDatabaseUrl,
  schema: workerEnv.pgBossSchema,
  logger,
});

for (const job of jobs) {
  runner.register(job);
}

const shutdown = async (signal: string) => {
  logger.info({ signal }, "Shutting down worker process");

  try {
    await runner.stop(workerEnv.shutdownTimeoutMs);
    process.exit(0);
  } catch (error) {
    logger.error({ error, signal }, "Failed to stop worker cleanly");
    process.exit(1);
  }
};

const bootstrap = async () => {
  await runner.start();

  // Schedule monthly partition pre-creation: runs at midnight on the 1st of each month.
  // Creates the audit_log partition 3 months ahead (yearMonth omitted → handler auto-computes).
  await runner.schedule(partitionCreateJobContract, "0 0 1 * *", {});

  logger.info({ jobs: jobs.map((job) => job.contract.name) }, "Worker started");

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
};

bootstrap().catch((error) => {
  logger.error({ error }, "Worker failed to start");
  process.exit(1);
});
