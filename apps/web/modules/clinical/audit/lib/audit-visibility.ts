import { AuditEvent, type Prisma } from "@prisma/client";
import { prisma } from "@continium/database";
import type { AuditFilters } from "./audit-filter-schema";
import { AUTH_AUDIT_EVENTS, getAuditFilterPredicates } from "./audit-query-helpers";

interface AuditScopeContext {
  projectId: string;
  organizationId: string;
  studyId: string;
  dagScope: { userDagIds: string[]; bypass: boolean };
}

const SCOPED_RESOURCE_TYPES = ["Subject", "Enrollment", "Record", "RecordValue"] as const;

const getDagScopedResourceIds = async ({ dagScope, studyId }: AuditScopeContext) => {
  if (dagScope.bypass) {
    return null;
  }

  // D1: no DAG memberships → DENY (see nothing scoped).
  // Also guards against the Prisma DAG middleware being deferred to Phase 4:
  // without $extends() registration, inner queries are unfiltered, so we must
  // apply the DAG filter explicitly here until middleware is migrated.
  if (dagScope.userDagIds.length === 0) {
    return { subjectIds: [] as string[], enrollmentIds: [] as string[], recordIds: [] as string[] };
  }

  const [enrollments, records] = await prisma.$transaction([
    prisma.enrollment.findMany({
      where: { subject: { studyId }, dagId: { in: dagScope.userDagIds } },
      select: { id: true, subjectId: true },
    }),
    prisma.record.findMany({
      where: { subject: { studyId }, dagId: { in: dagScope.userDagIds } },
      select: { id: true },
    }),
  ]);

  return {
    subjectIds: [...new Set(enrollments.map((enrollment) => enrollment.subjectId))],
    enrollmentIds: enrollments.map((enrollment) => enrollment.id),
    recordIds: records.map((record) => record.id),
  };
};

const getVisibleProjectAuditWhere = async (
  context: AuditScopeContext
): Promise<Prisma.AuditLogWhereInput> => {
  const scopedIds = await getDagScopedResourceIds(context);
  if (!scopedIds) {
    return { projectId: context.projectId };
  }

  // RECORDS_VIEWED rows carry `resourceId = subjectId` since migration
  // `20260523000000_audit_records_viewed_resource_id`. Filter with a
  // scalar `resourceId IN (...)` instead of the legacy JSON-path lookup
  // that breaks silently if the metadata schema drifts.
  const recordViewedFallback =
    scopedIds.subjectIds.length > 0
      ? [
          {
            projectId: context.projectId,
            event: AuditEvent.RECORDS_VIEWED,
            resourceId: { in: scopedIds.subjectIds },
          },
        ]
      : [{ projectId: context.projectId, event: AuditEvent.RECORDS_VIEWED, resourceId: "__no_visible_subjects__" }];

  return {
    OR: [
      { projectId: context.projectId, resourceType: null },
      { projectId: context.projectId, resourceType: { notIn: [...SCOPED_RESOURCE_TYPES] } },
      ...(scopedIds.subjectIds.length > 0
        ? [{ projectId: context.projectId, resourceType: "Subject", resourceId: { in: scopedIds.subjectIds } }]
        : []),
      ...(scopedIds.enrollmentIds.length > 0
        ? [
            {
              projectId: context.projectId,
              resourceType: "Enrollment",
              resourceId: { in: scopedIds.enrollmentIds },
            },
          ]
        : []),
      ...(scopedIds.recordIds.length > 0
        ? [
            {
              projectId: context.projectId,
              resourceType: { in: ["Record", "RecordValue"] },
              resourceId: { in: scopedIds.recordIds },
            },
          ]
        : []),
      ...recordViewedFallback,
    ],
  };
};

const getVisibleAuthAuditWhere = async ({
  organizationId,
}: Pick<AuditScopeContext, "organizationId">): Promise<Prisma.AuditLogWhereInput | null> => {
  const memberships = await prisma.membership.findMany({
    where: { organizationId, accepted: true },
    select: { userId: true },
    distinct: ["userId"],
  });

  const actorIds = memberships.map((membership) => membership.userId);
  if (actorIds.length === 0) {
    return null;
  }

  return {
    projectId: null,
    event: { in: [...AUTH_AUDIT_EVENTS] },
    actorId: { in: actorIds },
  };
};

export const buildAuditWhereForScope = async (
  context: AuditScopeContext,
  filters: AuditFilters
): Promise<Prisma.AuditLogWhereInput> => {
  const [projectVisibility, authVisibility] = await Promise.all([
    getVisibleProjectAuditWhere(context),
    getVisibleAuthAuditWhere(context),
  ]);

  return {
    AND: [
      ...getAuditFilterPredicates(filters),
      { OR: authVisibility ? [projectVisibility, authVisibility] : [projectVisibility] },
    ],
  };
};
