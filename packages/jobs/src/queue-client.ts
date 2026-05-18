import PgBoss from "pg-boss";
import { type ExtendedLogger, logger as defaultLogger } from "@continium/logger";
import type { JobContract, JobEnqueueOptions } from "./define-job";
import { parseJobPayload } from "./define-job";
import { toPgBossSendOptions } from "./internal/pg-boss-options";

type QueueLogger = Pick<ExtendedLogger, "debug" | "info" | "error">;

export type QueueClientOptions = {
  connectionString: string;
  schema?: string;
  logger?: QueueLogger;
};

export class QueueClient {
  private readonly logger: QueueLogger;
  private readonly options: QueueClientOptions;
  private boss: PgBoss | null = null;
  // pg-boss v11 start() returns Promise<PgBoss>, not Promise<void>
  private startPromise: Promise<PgBoss> | null = null;

  constructor(options: QueueClientOptions) {
    this.options = options;
    this.logger = options.logger ?? defaultLogger;
  }

  async enqueue<TContract extends JobContract<string, any>>(
    contract: TContract,
    payload: unknown,
    options?: JobEnqueueOptions
  ): Promise<string | null> {
    const parsedPayload = parseJobPayload(contract, payload);
    const boss = await this.ensureStarted();
    const jobId = await boss.send(contract.name, parsedPayload as object, toPgBossSendOptions(options));

    this.logger.debug({ jobName: contract.name, jobId }, "Job enqueued via queue client");
    return jobId;
  }

  async schedule<TContract extends JobContract<string, any>>(
    contract: TContract,
    cronExpression: string,
    payload?: unknown,
    options?: JobEnqueueOptions
  ): Promise<void> {
    const parsedPayload = payload == null ? undefined : (parseJobPayload(contract, payload) as object);
    const boss = await this.ensureStarted();

    await boss.schedule(contract.name, cronExpression, parsedPayload, toPgBossSendOptions(options));

    this.logger.info({ jobName: contract.name, cronExpression }, "Job scheduled via queue client");
  }

  async cancel<TContract extends JobContract<string, any>>(
    contract: TContract,
    jobId: string
  ): Promise<void> {
    const boss = await this.ensureStarted();
    await boss.cancel(contract.name, jobId);
  }

  async stop(): Promise<void> {
    if (!this.boss) {
      return;
    }

    await this.boss.stop();
    this.boss = null;
    this.startPromise = null;
  }

  private async ensureStarted(): Promise<PgBoss> {
    if (!this.boss) {
      this.boss = new PgBoss({
        connectionString: this.options.connectionString,
        schema: this.options.schema,
      });

      this.boss.on("error", (error) => {
        this.logger.error({ error }, "pg-boss queue client emitted an error");
      });
    }

    if (!this.startPromise) {
      this.startPromise = this.boss.start();
    }

    await this.startPromise;
    // M1: guard against stop() nulling this.boss while ensureStarted() was awaiting
    if (!this.boss) {
      throw new Error("QueueClient was stopped during startup");
    }
    return this.boss;
  }
}

const queueClientSingletons = new Map<string, QueueClient>();

export const createQueueClient = (options: QueueClientOptions): QueueClient => {
  const key = `${options.connectionString}::${options.schema ?? "pgboss"}`;

  const existing = queueClientSingletons.get(key);
  if (existing) {
    return existing;
  }

  const created = new QueueClient(options);
  queueClientSingletons.set(key, created);
  return created;
};
