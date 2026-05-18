import PgBoss from "pg-boss";
import { type ExtendedLogger, logger as defaultLogger } from "@continium/logger";
import type { JobContract, JobDefinition, JobEnqueueOptions } from "./define-job";
import { parseJobPayload } from "./define-job";
import { toPgBossSendOptions } from "./internal/pg-boss-options";

type PgBossWorkOptions = {
  batchSize?: number;
  pollingIntervalSeconds?: number;
};

type RunnerLogger = Pick<ExtendedLogger, "debug" | "info" | "warn" | "error">;

export type JobRunnerOptions = {
  connectionString: string;
  schema?: string;
  logger?: RunnerLogger;
};

export class JobRunner {
  private readonly options: JobRunnerOptions;
  private readonly jobs = new Map<string, JobDefinition<JobContract<string, any>>>();
  private readonly logger: RunnerLogger;
  private boss: PgBoss | null = null;
  private started = false;

  constructor(options: JobRunnerOptions) {
    this.options = options;
    this.logger = options.logger ?? defaultLogger;
  }

  register<TContract extends JobContract<string, any>>(jobDefinition: JobDefinition<TContract>): void {
    const { name } = jobDefinition.contract;

    if (this.jobs.has(name)) {
      throw new Error(`Job ${name} is already registered`);
    }

    this.jobs.set(name, jobDefinition as JobDefinition<JobContract<string, any>>);

    if (this.started) {
      void this.registerWorker(jobDefinition as JobDefinition<JobContract<string, any>>);
    }
  }

  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    this.boss = new PgBoss({
      connectionString: this.options.connectionString,
      schema: this.options.schema,
    });

    this.boss.on("error", (error) => {
      this.logger.error({ error }, "pg-boss emitted an error event");
    });

    await this.boss.start();
    // Mark started before registering workers so concurrent register() calls
    // during the loop correctly schedule their own registerWorker() call.
    this.started = true;

    for (const jobDefinition of this.jobs.values()) {
      await this.registerWorker(jobDefinition);
    }

    this.logger.info({ jobs: Array.from(this.jobs.keys()) }, "pg-boss runner started");
  }

  async stop(gracefulTimeoutMs = 30000): Promise<void> {
    if (!this.boss) {
      return;
    }

    const stopPromise = this.boss.stop({
      graceful: true,
      timeout: gracefulTimeoutMs,
      wait: true,
    });
    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        this.logger.warn(
          { gracefulTimeoutMs },
          "pg-boss stop timeout reached; process may still have in-flight jobs"
        );
        resolve();
      }, gracefulTimeoutMs).unref();
    });

    await Promise.race([stopPromise, timeoutPromise]);

    this.started = false;
    this.boss = null;
    this.logger.info("pg-boss runner stopped");
  }

  async enqueue<TContract extends JobContract<string, any>>(
    contract: TContract,
    payload: unknown,
    options?: JobEnqueueOptions
  ): Promise<string | null> {
    const boss = await this.getBoss();
    const parsedPayload = parseJobPayload(contract, payload);

    const jobId = await boss.send(contract.name, parsedPayload as object, toPgBossSendOptions(options));

    this.logger.debug({ jobName: contract.name, jobId }, "Job enqueued");
    return jobId;
  }

  async schedule<TContract extends JobContract<string, any>>(
    contract: TContract,
    cronExpression: string,
    payload?: unknown,
    options?: JobEnqueueOptions
  ): Promise<void> {
    const boss = await this.getBoss();
    const parsedPayload = payload == null ? undefined : (parseJobPayload(contract, payload) as object);

    await boss.schedule(contract.name, cronExpression, parsedPayload, toPgBossSendOptions(options));

    this.logger.info({ jobName: contract.name, cronExpression }, "Job schedule registered");
  }

  async cancel<TContract extends JobContract<string, any>>(
    contract: TContract,
    jobId: string
  ): Promise<void> {
    const boss = await this.getBoss();
    await boss.cancel(contract.name, jobId);
    this.logger.info({ jobName: contract.name, jobId }, "Job cancelled");
  }

  private async registerWorker(jobDefinition: JobDefinition<JobContract<string, any>>): Promise<void> {
    const boss = await this.getBoss();
    const workOptions: PgBossWorkOptions = {};

    if (jobDefinition.options?.concurrency) {
      workOptions.batchSize = jobDefinition.options.concurrency;
    }

    // pg-boss v11: queues are explicit entities — work() requires the queue to exist.
    // createQueue() is idempotent; safe to call on every worker registration.
    await boss.createQueue(jobDefinition.contract.name);

    await boss.work(jobDefinition.contract.name, workOptions, async (jobs: Array<PgBoss.Job<object> & { retryCount?: number }>) => {
      for (const job of jobs) {
        const payload = parseJobPayload(jobDefinition.contract, job.data);

        await jobDefinition.handler(payload, {
          id: job.id,
          name: job.name,
          retryCount: job.retryCount ?? 0,
        });
      }
    });

    this.logger.info({ jobName: jobDefinition.contract.name }, "Job worker registered");
  }

  private async getBoss(): Promise<PgBoss> {
    if (!this.boss) {
      throw new Error("JobRunner has not been started");
    }

    return this.boss;
  }
}
