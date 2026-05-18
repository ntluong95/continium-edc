import "server-only";

import { AuditEvent } from "@prisma/client";
import { getServerSession } from "next-auth";
import { prisma } from "@continium/database";
import { authOptions } from "@/modules/auth/lib/authOptions";
import { logClinicalAuditEvent } from "@/modules/clinical/subjects/lib/audit-events";
import { assertContiniumFeature } from "@/modules/continium/licensing/lib/assert-continium-feature";
import { getClinicalAuditAccess } from "./audit-access";
import type { AuditFilters } from "./audit-filter-schema";
import { buildAuditWhereForScope } from "./audit-visibility";
import { buildDateBounds } from "./audit-query-helpers";
import { shouldEmitReadEvent } from "./dedupe-read-event";

export const AUDIT_PAGE_SIZE = 50;

export type { AuditFilters } from "./audit-filter-schema";

export const getAuditLogPage = async (environmentId: string, filters: AuditFilters = {}) => {
  // Compliance-locked: env loader rejects any attempt to disable.
  // The assert here is symmetric with other clinical gates and ensures the
  // feature key remains in CONTINIUM_FEATURES; the call always passes for
  // self-hosted operators.
  await assertContiniumFeature("clinicalAuditLog");
  const access = await getClinicalAuditAccess(environmentId);
  const page = Math.max(1, filters.page ?? 1);
  const skip = (page - 1) * AUDIT_PAGE_SIZE;
  const where = await buildAuditWhereForScope(
    {
      projectId: access.project.id,
      organizationId: access.organization.id,
      studyId: access.study.id,
      dagScope: access.dagScope,
    },
    filters
  );
  const { lower, upper } = buildDateBounds(filters.from, filters.to);

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      skip,
      take: AUDIT_PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const session = await getServerSession(authOptions);
  const actorId = session?.user?.id ?? null;
  if (shouldEmitReadEvent(AuditEvent.AUDIT_LOG_VIEWED, actorId, access.project.id, "AuditLog")) {
    void logClinicalAuditEvent({
      db: prisma,
      event: AuditEvent.AUDIT_LOG_VIEWED,
      actorId,
      projectId: access.project.id,
      resourceType: "AuditLog",
      metadata: { filters, page },
    });
  }

  return {
    rows,
    total,
    page,
    pageSize: AUDIT_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE)),
    dateRange: { from: lower.toISOString(), to: upper.toISOString() },
  };
};

export type TAuditLogPage = Awaited<ReturnType<typeof getAuditLogPage>>;
export type TAuditLogRow = TAuditLogPage["rows"][number];

export const getAuditActors = async (environmentId: string, filters: AuditFilters = {}) => {
  await assertContiniumFeature("clinicalAuditLog");
  const access = await getClinicalAuditAccess(environmentId);
  const where = await buildAuditWhereForScope(
    {
      projectId: access.project.id,
      organizationId: access.organization.id,
      studyId: access.study.id,
      dagScope: access.dagScope,
    },
    filters
  );

  const actorRows = await prisma.auditLog.findMany({
    where: {
      AND: [where, { actorId: { not: null } }],
    },
    select: { actorId: true },
    distinct: ["actorId"],
  });

  const actorIds = actorRows.map((row) => row.actorId).filter((actorId): actorId is string => Boolean(actorId));
  if (actorIds.length === 0) {
    return [];
  }

  return prisma.user.findMany({
    where: { id: { in: actorIds } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
};
