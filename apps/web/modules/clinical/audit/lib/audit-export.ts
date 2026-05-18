import "server-only";
import { createHash } from "node:crypto";
import { AuditEvent } from "@prisma/client";
import { prisma } from "@continium/database";
import { logClinicalAuditEvent } from "@/modules/clinical/subjects/lib/audit-events";
import { assertContiniumFeature } from "@/modules/continium/licensing/lib/assert-continium-feature";
import type { AuditFilters } from "./audit-filter-schema";
import { getClinicalAuditAccess } from "./audit-access";
import { buildAuditWhereForScope } from "./audit-visibility";

/** CSV column headers and row formatter for audit log exports. */
const CSV_HEADERS = [
  "id",
  "occurredAt",
  "event",
  "actorId",
  "actorIp",
  "userAgent",
  "projectId",
  "resourceId",
  "resourceType",
  "metadata",
] as const;

const escapeCsv = (value: unknown): string => {
  if (value == null) return "";
  const str = typeof value === "object" ? JSON.stringify(value) : String(value);
  // Wrap in quotes if the value contains comma, quote, or newline.
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

const rowToCsv = (row: Record<string, unknown>): string =>
  CSV_HEADERS.map((col) => escapeCsv(row[col])).join(",");

/**
 * Export filtered audit log rows to CSV string.
 * Emits a RECORDS_EXPORTED audit event with a sha256 fingerprint of the filters.
 *
 * @param environmentId - environment scoping the project
 * @param filters - same filter shape as the viewer
 * @param actorId - user performing the export
 * @returns CSV string (header + rows)
 */
export const exportAuditLogCsv = async (
  environmentId: string,
  filters: AuditFilters,
  actorId: string | null
): Promise<string> => {
  await assertContiniumFeature("clinicalExports");
  const access = await getClinicalAuditAccess(environmentId, { requireManageAccess: true });
  const where = await buildAuditWhereForScope(
    {
      projectId: access.project.id,
      organizationId: access.organization.id,
      studyId: access.study.id,
      dagScope: access.dagScope,
    },
    filters
  );

  const rows = await prisma.auditLog.findMany({
    where,
    orderBy: { occurredAt: "desc" },
    take: 10_000, // hard cap; Phase 2 will stream for larger exports
  });

  const filterHash = createHash("sha256")
    .update(JSON.stringify(filters))
    .digest("hex")
    .slice(0, 16);

  await logClinicalAuditEvent({
    db: prisma,
    event: AuditEvent.RECORDS_EXPORTED,
    actorId,
    projectId: access.project.id,
    resourceType: "AuditLog",
    metadata: { rowCount: rows.length, filterHash, filters },
  });

  const csvRows = rows.map((row) =>
    rowToCsv({
      ...row,
      occurredAt: row.occurredAt.toISOString(),
      metadata: row.metadata,
    })
  );

  return [CSV_HEADERS.join(","), ...csvRows].join("\n");
};
