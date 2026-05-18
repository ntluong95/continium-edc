import { prisma } from "@continium/database";
import { defineJob, defineJobContract } from "@continium/jobs";
import { auditWriteJobSchema } from "@continium/audit";
import { logger } from "@continium/logger";

/**
 * Job contract for persisting a single audit envelope to audit_log.
 * This is the async path — the Prisma middleware enqueues here instead of
 * writing synchronously, keeping audit overhead off the request hot path.
 */
export const auditWriteJobContract = defineJobContract(
  "audit.write",
  auditWriteJobSchema
);

export const auditWriteJob = defineJob({
  contract: auditWriteJobContract,
  handler: async (payload) => {
    // Idempotent: ON CONFLICT DO NOTHING prevents duplicate rows if the job
    // is retried after a partial failure (e.g. worker crash after INSERT but
    // before pg-boss marks the job complete).
    await prisma.$executeRaw`
      INSERT INTO audit_log
        (id, occurred_at, event, actor_id, actor_ip, user_agent,
         project_id, resource_id, resource_type, diff, metadata)
      VALUES (
        ${payload.id},
        ${new Date(payload.occurredAt)},
        ${payload.event}::"AuditEvent",
        ${payload.actorId},
        ${payload.actorIp},
        ${payload.userAgent},
        ${payload.projectId},
        ${payload.resourceId},
        ${payload.resourceType},
        ${payload.diff ? JSON.stringify(payload.diff) : null}::jsonb,
        ${payload.metadata ? JSON.stringify(payload.metadata) : null}::jsonb
      )
      ON CONFLICT (id, occurred_at) DO NOTHING
    `;

    logger.debug({ auditId: payload.id, event: payload.event }, "audit event persisted");
  },
  options: {
    concurrency: 10,
    defaultEnqueueOptions: {
      retryLimit: 5,
      retryDelaySeconds: 10,
      retryBackoff: true,
    },
  },
});
