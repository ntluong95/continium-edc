import "server-only";

import { AuditEvent, RecordStatus } from "@prisma/client";
import { prisma } from "@continium/database";
import { AuthorizationError, ValidationError } from "@continium/types/errors";
import type { TClinicalPermission } from "./zod-schemas";
import { resolveClinicalPermission, type SimpleAccessRule } from "./rule-resolver";
import { getCachedPermission, setCachedPermission } from "./per-request-cache";

export class PermissionDeniedError extends AuthorizationError {
  constructor(
    message: string,
    public readonly userId: string,
    public readonly instrumentId?: string,
    public readonly eventId?: string,
    public readonly requiredPermission?: TClinicalPermission
  ) {
    super(message);
    this.name = "PermissionDeniedError";
  }
}

async function getDefaultPermission(
  userId: string,
  studyId: string
): Promise<TClinicalPermission> {
  const study = await prisma.study.findUnique({
    where: { id: studyId },
    select: { projectId: true },
  });

  if (!study) {
    return "NO_ACCESS";
  }

  const projectTeam = await prisma.projectTeam.findFirst({
    where: {
      projectId: study.projectId,
      team: {
        teamUsers: { some: { userId } },
      },
    },
    select: { permission: true },
  });

  if (!projectTeam) {
    const membership = await prisma.membership.findFirst({
      where: {
        userId,
        organization: {
          projects: { some: { id: study.projectId } },
        },
      },
    });
    if (!membership) {
      return "NO_ACCESS";
    }
    return membership.role === "owner" || membership.role === "manager" ? "READ_WRITE" : "READ";
  }

  const perm = projectTeam.permission.toLowerCase();
  if (perm === "readwrite" || perm === "manage") {
    return "READ_WRITE";
  }

  return "READ";
}

async function fetchAccessRules(
  userId: string,
  studyId: string
): Promise<SimpleAccessRule[]> {
  const rules = await prisma.clinicalAccessRule.findMany({
    where: {
      userId,
      studyId,
    },
    select: {
      instrumentId: true,
      eventId: true,
      permission: true,
    },
  });

  return rules.map((r) => ({
    instrumentId: r.instrumentId,
    eventId: r.eventId,
    permission: r.permission as TClinicalPermission,
  }));
}

export async function assertCanReadInstrument(
  userId: string,
  instrumentId: string,
  studyId: string,
  eventId?: string
): Promise<void> {
  const cached = getCachedPermission(userId, instrumentId, eventId ?? null);

  let permission: TClinicalPermission;

  if (cached !== undefined) {
    permission = cached;
  } else {
    const rules = await fetchAccessRules(userId, studyId);
    const roleDefault = await getDefaultPermission(userId, studyId);
    permission = resolveClinicalPermission(
      rules,
      { instrumentId, eventId: eventId ?? null },
      roleDefault
    );
    setCachedPermission(userId, instrumentId, eventId ?? null, permission);
  }

  if (permission === "NO_ACCESS") {
    await logPermissionDenied(userId, instrumentId, eventId, "READ");
    throw new PermissionDeniedError(
      `You do not have read access to this instrument`,
      userId,
      instrumentId,
      eventId,
      "READ"
    );
  }
}

export async function assertCanWriteRecord(
  userId: string,
  recordId: string
): Promise<{ instrumentId: string; eventId: string | null; studyId: string }> {
  const record = await prisma.record.findUnique({
    where: { id: recordId },
    select: {
      id: true,
      instrumentId: true,
      eventId: true,
      status: true,
      subject: { select: { studyId: true } },
    },
  });

  if (!record) {
    throw new ValidationError("Record not found");
  }

  if (record.status === RecordStatus.LOCKED) {
    throw new ValidationError("Cannot write to a locked record");
  }

  const studyId = record.subject.studyId;
  const cached = getCachedPermission(userId, record.instrumentId, record.eventId);

  let permission: TClinicalPermission;

  if (cached !== undefined) {
    permission = cached;
  } else {
    const rules = await fetchAccessRules(userId, studyId);
    const roleDefault = await getDefaultPermission(userId, studyId);
    permission = resolveClinicalPermission(
      rules,
      { instrumentId: record.instrumentId, eventId: record.eventId },
      roleDefault
    );
    setCachedPermission(userId, record.instrumentId, record.eventId, permission);
  }

  if (permission !== "READ_WRITE") {
    await logPermissionDenied(
      userId,
      record.instrumentId,
      record.eventId ?? undefined,
      "READ_WRITE"
    );
    throw new PermissionDeniedError(
      `You do not have write access to this record`,
      userId,
      record.instrumentId,
      record.eventId ?? undefined,
      "READ_WRITE"
    );
  }

  return {
    instrumentId: record.instrumentId,
    eventId: record.eventId,
    studyId,
  };
}

async function logPermissionDenied(
  userId: string,
  instrumentId: string,
  eventId: string | undefined,
  requiredPermission: TClinicalPermission
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        event: AuditEvent.PERMISSION_DENIED,
        resourceType: "ClinicalAccess",
        resourceId: `${instrumentId}${eventId ? `:${eventId}` : ""}`,
        metadata: {
          instrumentId,
          eventId: eventId ?? null,
          requiredPermission,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch {
    // Don't throw - audit logging failure shouldn't block the main error
  }
}