import { PrismaClient } from "@prisma/client";
import { createAuditPrismaExtension } from "@continium/audit";
import type { AuditEnvelope } from "@continium/audit";
import { createDagPrismaExtension } from "./dag-middleware";

const prismaClientSingleton = () => {
  const base = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
    ...(process.env.DEBUG === "1" && {
      log: ["query", "info"],
    }),
  });

  // Audit emit: one row to audit_log for every Prisma write operation.
  // Enabled via AUDIT_LOG_ENABLED=1; sync path (direct INSERT) by default.
  // Phase 1.6 will layer an async pg-boss path on top at the app level.
  const auditWrite = async (envelope: AuditEnvelope): Promise<void> => {
    await base.auditLog.create({
      data: {
        id: envelope.id,
        occurredAt: new Date(envelope.occurredAt),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- AuditEvent enum value from string
        event: envelope.event as any,
        actorId: envelope.actorId,
        actorIp: envelope.actorIp,
        userAgent: envelope.userAgent,
        projectId: envelope.projectId,
        resourceId: envelope.resourceId,
        resourceType: envelope.resourceType,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma Json type accepts object
        diff: (envelope.diff as any) ?? undefined,
        metadata: (envelope.metadata as any) ?? undefined,
      },
    });
  };

  // Extension chain. Order is not load-bearing: both extensions only
  // override `query.$allOperations` on disjoint sets of models, and the
  // audit hook does not observe the DAG hook's where-clause injection.
  //
  // The DAG hook is a no-op outside a `withDagContext` block so adding it
  // is non-breaking for every existing call site. The audit extension is
  // gated by AUDIT_LOG_ENABLED so disabling it in tests is a single env
  // flag rather than a different client.
  return base
    .$extends(createAuditPrismaExtension({ write: auditWrite, enabled: process.env.AUDIT_LOG_ENABLED === "1" }))
    .$extends(createDagPrismaExtension());
};

type PrismaClientSingleton = PrismaClient;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma: PrismaClientSingleton =
  globalForPrisma.prisma ?? (prismaClientSingleton() as unknown as PrismaClientSingleton);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
