import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.url(),
  WEBAPP_URL: z.url(),
  CRON_SECRET: z.string().trim().min(1),
  JOBS_DATABASE_URL: z.url().optional(),
  JOBS_FOLLOW_UP_ENDPOINT_URL: z.url().optional(),
  JOBS_PG_BOSS_SCHEMA: z.string().trim().min(1).optional().default("pgboss"),
  JOBS_WORKER_SHUTDOWN_TIMEOUT_MS: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) {
        return 30000;
      }

      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) ? 30000 : parsed;
    }),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid worker environment variables: ${parsed.error.message}`);
}

export const workerEnv = {
  jobsDatabaseUrl: parsed.data.JOBS_DATABASE_URL ?? parsed.data.DATABASE_URL,
  cronSecret: parsed.data.CRON_SECRET,
  followUpEndpointUrl:
    parsed.data.JOBS_FOLLOW_UP_ENDPOINT_URL ??
    new URL("/api/jobs/follow-up-response", parsed.data.WEBAPP_URL).toString(),
  pgBossSchema: parsed.data.JOBS_PG_BOSS_SCHEMA,
  shutdownTimeoutMs: parsed.data.JOBS_WORKER_SHUTDOWN_TIMEOUT_MS,
};
