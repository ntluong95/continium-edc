import { randomUUID } from "node:crypto";
import { AuditEvent, type Prisma } from "@prisma/client";
import { prisma } from "@continium/database";

interface LogClinicalAuditEventInput {
  db: unknown;
  event: AuditEvent;
  actorId?: string | null;
  projectId: string;
  resourceId?: string | null;
  resourceType?: string | null;
  metadata?: Record<string, unknown>;
}

export const logClinicalAuditEvent = async ({
  db,
  event,
  actorId = null,
  projectId,
  resourceId = null,
  resourceType = null,
  metadata,
}: LogClinicalAuditEventInput) => {
  if (process.env.AUDIT_LOG_ENABLED !== "1") {
    return;
  }

  const auditDb = db as Pick<typeof prisma, "auditLog">;
  await auditDb.auditLog.create({
    data: {
      id: randomUUID(),
      occurredAt: new Date(),
      event,
      actorId,
      projectId,
      resourceId,
      resourceType,
      metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
};
