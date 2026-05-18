import { z } from "zod";

/** Job payload for persisting a single AuditEnvelope to audit_log. */
export const auditWriteJobSchema = z.object({
  id: z.string().uuid(),
  occurredAt: z.string().datetime(),
  event: z.string().min(1),
  actorId: z.string().nullable(),
  actorIp: z.string().nullable(),
  userAgent: z.string().nullable(),
  projectId: z.string().nullable(),
  resourceId: z.string().nullable(),
  resourceType: z.string().nullable(),
  diff: z.record(z.string(), z.unknown()).nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});

export type TAuditWriteJobPayload = z.infer<typeof auditWriteJobSchema>;
