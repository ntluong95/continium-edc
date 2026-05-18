import "server-only";
import { AuditEvent, InstrumentFieldType, type Prisma, RecordStatus } from "@prisma/client";
import { ValidationError } from "@continium/types/errors";
import type { TResponseData } from "@continium/types/responses";
import { assertCanWriteRecord } from "@/modules/clinical/access/lib/assert-helpers";
import type { ClinicalTx } from "@/modules/clinical/lib/clinical-tx";
import { logClinicalAuditEvent } from "@/modules/clinical/subjects/lib/audit-events";
import {
  clinicalResponseRecordInclude,
  isClinicalResponseFinished,
  upsertClinicalResponseForRecord,
} from "./clinical-response-sync";
import { assertInstrumentCanEnterData } from "./data-entry-eligibility";
import { assertRecordForStudy, jsonInput, valuesEqual } from "./record-action-helpers";
import { canTransitionRecordStatus } from "./record-status-machine";
import { syncSurveyResponseToRecordValues } from "./survey-response-sync";
import { coerceValue } from "./value-coercion";

/**
 * Pure (transaction-bound) clinical record service. Functions here take an
 * already-opened `ClinicalTx` and resolved `{ project, study }` context plus
 * the parsed user inputs, and return plain values to the caller. They do NOT
 * call `revalidatePath`, do NOT decorate with `"use server"`, and do NOT
 * resolve auth/context themselves — those concerns live in the action layer
 * (`record-actions.ts`).
 *
 * Splitting the previously ~500-line `record-actions.ts` along this seam makes
 * the business logic testable in isolation with a mocked tx and keeps the
 * action layer to thin shells.
 */

// ── Cell-value response merge helpers ────────────────────────────────────────

/**
 * Coerces a raw cell string into the typed value the JSON Response payload
 * expects (numbers as numbers, MULTI_SELECT as arrays, etc.). Returns
 * `undefined` to signal "delete this key from the response".
 */
export const normalizeCellValueForResponse = (
  value: string | null,
  fieldType: InstrumentFieldType
) => {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return undefined;

  switch (fieldType) {
    case InstrumentFieldType.NUMBER: {
      const numeric = Number(trimmed);
      return Number.isFinite(numeric) ? numeric : trimmed;
    }
    case InstrumentFieldType.MULTI_SELECT:
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    case InstrumentFieldType.BOOLEAN:
      return trimmed === "true" ? "true" : trimmed === "false" ? "false" : trimmed;
    default:
      return trimmed;
  }
};

/**
 * Merges a single (fieldKey, value) pair into the record's responsesJson
 * payload, normalising the value first and respecting "delete on empty".
 */
export const mergeCellValueIntoResponseData = (
  current: Prisma.JsonValue | null,
  fieldKey: string,
  value: string | null,
  fieldType: InstrumentFieldType
): TResponseData => {
  const next =
    current && typeof current === "object" && !Array.isArray(current)
      ? { ...(current as Record<string, unknown>) }
      : {};
  const normalized = normalizeCellValueForResponse(value, fieldType);

  if (normalized === undefined) {
    delete next[fieldKey];
  } else {
    next[fieldKey] = normalized;
  }

  return next as TResponseData;
};

interface SyncCellInputToClinicalResponseInput {
  tx: ClinicalTx;
  record: Awaited<ReturnType<typeof assertRecordForStudy>>;
  field: { key: string; type: InstrumentFieldType };
  value: string | null;
  userId: string;
  environmentId: string;
  projectId: string;
}

/**
 * After a single cell write, refreshes record.responsesJson and propagates the
 * change through `upsertClinicalResponseForRecord` so analytics stays in sync.
 */
export const syncCellInputToClinicalResponse = async ({
  tx,
  record,
  field,
  value,
  userId,
  environmentId,
  projectId,
}: SyncCellInputToClinicalResponseInput) => {
  const responseData = mergeCellValueIntoResponseData(
    record.responsesJson as Prisma.JsonValue | null,
    field.key,
    value,
    field.type
  );
  const updatedRecord = await tx.record.update({
    where: { id: record.id },
    data: { responsesJson: responseData as Prisma.InputJsonValue },
    include: clinicalResponseRecordInclude,
  });

  await upsertClinicalResponseForRecord({
    tx,
    record: updatedRecord,
    responseData,
    finished: isClinicalResponseFinished(updatedRecord.status),
    userId,
    environmentId,
    projectId,
  });

  return updatedRecord;
};

// ── Action-shaped service entry points ──────────────────────────────────────

interface RecordContext {
  project: { id: string };
  study: { id: string };
}

export interface UpsertRecordValueArgs extends RecordContext {
  recordId: string;
  instrumentFieldId: string;
  value: string | null;
  reason?: string | null;
  userId: string;
  environmentId: string;
}

export interface UpsertRecordValueResult {
  value: Prisma.RecordValueGetPayload<true>;
  subjectId: string;
  surveyId: string | null;
}

export const upsertRecordValue = async (
  tx: ClinicalTx,
  args: UpsertRecordValueArgs
): Promise<UpsertRecordValueResult> => {
  const record = await assertRecordForStudy(tx, args.recordId, args.study.id);

  await assertCanWriteRecord(args.userId, record.id);

  assertInstrumentCanEnterData(record.instrument);

  if (record.status === RecordStatus.LOCKED) {
    throw new ValidationError("Locked records cannot be edited.");
  }

  const field = await tx.instrumentField.findFirst({
    where: { id: args.instrumentFieldId, instrumentId: record.instrumentId },
  });
  if (!field) throw new ValidationError("Field not found for this record instrument.");

  const nextValue = coerceValue(args.value, field.type);
  const existing = await tx.recordValue.findUnique({
    where: {
      recordId_instrumentFieldId_projectId: {
        recordId: record.id,
        instrumentFieldId: field.id,
        projectId: args.project.id,
      },
    },
  });

  // No-op short-circuit: same coerced value as the existing row. We still
  // propagate to the clinical response so meta stays consistent.
  if (existing && valuesEqual(existing, nextValue)) {
    const updatedRecord = await syncCellInputToClinicalResponse({
      tx,
      record,
      field,
      value: args.value,
      userId: args.userId,
      environmentId: args.environmentId,
      projectId: args.project.id,
    });

    return {
      value: existing,
      subjectId: record.subjectId,
      surveyId: updatedRecord.instrument.surveyId,
    };
  }

  // Append the previous value to history before overwrite. Skip on first write.
  if (existing) {
    await tx.valueRevision.create({
      data: {
        recordId: record.id,
        instrumentFieldId: field.id,
        previousText: existing.valueText,
        previousNumber: existing.valueNumber,
        previousDate: existing.valueDate,
        previousJson: jsonInput(existing.valueJson as Prisma.JsonValue | null),
        changedById: args.userId,
        reason: args.reason?.trim() || undefined,
      },
    });
  }

  const value = existing
    ? await tx.recordValue.update({
        where: { id_projectId: { id: existing.id, projectId: args.project.id } },
        data: { ...nextValue, valueJson: jsonInput(nextValue.valueJson), updatedById: args.userId },
      })
    : await tx.recordValue.create({
        data: {
          projectId: args.project.id,
          recordId: record.id,
          instrumentFieldId: field.id,
          ...nextValue,
          valueJson: jsonInput(nextValue.valueJson),
          updatedById: args.userId,
        },
      });

  await logClinicalAuditEvent({
    db: tx,
    event: AuditEvent.RECORD_VALUE_SET,
    actorId: args.userId,
    projectId: args.project.id,
    resourceId: record.id,
    resourceType: "RecordValue",
    metadata: {
      recordId: record.id,
      instrumentFieldId: field.id,
      subjectId: record.subjectId,
      isUpdate: Boolean(existing),
      isCleared: args.value === null || args.value.trim() === "",
    },
  });

  const updatedRecord = await syncCellInputToClinicalResponse({
    tx,
    record,
    field,
    value: args.value,
    userId: args.userId,
    environmentId: args.environmentId,
    projectId: args.project.id,
  });

  return {
    value,
    subjectId: record.subjectId,
    surveyId: updatedRecord.instrument.surveyId,
  };
};

export interface SetRecordStatusArgs extends RecordContext {
  recordId: string;
  status: RecordStatus;
  userId: string;
  environmentId: string;
}

export const setRecordStatus = async (tx: ClinicalTx, args: SetRecordStatusArgs) => {
  const existing = await assertRecordForStudy(tx, args.recordId, args.study.id);

  await assertCanWriteRecord(args.userId, existing.id);

  assertInstrumentCanEnterData(existing.instrument);

  if (!canTransitionRecordStatus(existing.status, args.status)) {
    throw new ValidationError(
      `Cannot transition record from ${existing.status} to ${args.status}.`
    );
  }

  const updated = await tx.record.update({
    where: { id: existing.id },
    data: {
      status: args.status,
      lockedAt: args.status === RecordStatus.LOCKED ? new Date() : existing.lockedAt,
      lockedById: args.status === RecordStatus.LOCKED ? args.userId : existing.lockedById,
    },
    include: clinicalResponseRecordInclude,
  });

  const responseData = ((updated.responsesJson ?? {}) as TResponseData) ?? {};
  if (
    updated.responseId ||
    Object.keys(responseData).length > 0 ||
    updated.status === RecordStatus.COMPLETE
  ) {
    await upsertClinicalResponseForRecord({
      tx,
      record: updated,
      responseData,
      finished: isClinicalResponseFinished(updated.status),
      userId: args.userId,
      environmentId: args.environmentId,
      projectId: args.project.id,
    });
  }

  await logClinicalAuditEvent({
    db: tx,
    event: args.status === RecordStatus.LOCKED ? AuditEvent.RECORD_LOCKED : AuditEvent.RECORD_UPDATED,
    actorId: args.userId,
    projectId: args.project.id,
    resourceId: existing.id,
    resourceType: "Record",
    metadata: {
      subjectId: existing.subjectId,
      fromStatus: existing.status,
      toStatus: args.status,
    },
  });

  return updated;
};

export interface SaveClinicalSurveyResponseArgs extends RecordContext {
  recordId: string;
  responsesJson: TResponseData;
  finished: boolean;
  userId: string;
  environmentId: string;
}

export const saveClinicalSurveyResponse = async (
  tx: ClinicalTx,
  args: SaveClinicalSurveyResponseArgs
) => {
  const existing = await assertRecordForStudy(tx, args.recordId, args.study.id);

  await assertCanWriteRecord(args.userId, existing.id);

  assertInstrumentCanEnterData(existing.instrument);

  if (existing.status === RecordStatus.LOCKED) {
    throw new ValidationError("Locked records cannot be edited.");
  }

  const nextStatus =
    args.finished && existing.status !== RecordStatus.COMPLETE
      ? RecordStatus.COMPLETE
      : existing.status;

  const updated = await tx.record.update({
    where: { id: existing.id },
    data: {
      responsesJson: args.responsesJson as Prisma.InputJsonValue,
      status: nextStatus,
    },
    include: clinicalResponseRecordInclude,
  });

  // Mirror individual values to RecordValue rows for backward compat.
  await syncSurveyResponseToRecordValues({
    tx,
    recordId: existing.id,
    instrumentId: existing.instrumentId,
    projectId: args.project.id,
    responsesJson: args.responsesJson as Record<string, unknown>,
    actorId: args.userId,
  });

  await upsertClinicalResponseForRecord({
    tx,
    record: updated,
    responseData: args.responsesJson,
    finished: isClinicalResponseFinished(nextStatus),
    userId: args.userId,
    environmentId: args.environmentId,
    projectId: args.project.id,
  });

  // Skip the audit emit for no-op completion saves (status unchanged AND
  // already finished). Every other case writes a transition entry.
  if (existing.status !== nextStatus || !args.finished) {
    await logClinicalAuditEvent({
      db: tx,
      event: AuditEvent.RECORD_UPDATED,
      actorId: args.userId,
      projectId: args.project.id,
      resourceId: existing.id,
      resourceType: "Record",
      metadata: {
        subjectId: existing.subjectId,
        fromStatus: existing.status,
        toStatus: nextStatus,
        finished: args.finished,
      },
    });
  }

  return updated;
};

export interface InitializeRecordArgs extends RecordContext {
  subjectId: string;
  eventId: string;
  instrumentId: string;
  userId: string;
}

export const initializeRecord = async (tx: ClinicalTx, args: InitializeRecordArgs) => {
  const subject = await tx.subject.findFirst({
    where: { id: args.subjectId, studyId: args.study.id },
    include: { enrollments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!subject) throw new ValidationError("Subject not found for this study.");

  const binding = await tx.eventInstrument.findFirst({
    where: {
      eventId: args.eventId,
      instrumentId: args.instrumentId,
      event: { armId: subject.enrollments[0]?.armId, arm: { studyId: args.study.id } },
    },
    include: {
      instrument: {
        select: {
          id: true,
          status: true,
          surveyId: true,
          survey: { select: { status: true } },
        },
      },
    },
  });
  if (!binding) throw new ValidationError("This form is not bound to the subject event.");
  assertInstrumentCanEnterData(binding.instrument);

  const dagId = subject.enrollments[0]?.dagId ?? null;

  const existing = await tx.record.findUnique({
    where: {
      subjectId_eventId_instrumentId_instance: {
        subjectId: subject.id,
        eventId: args.eventId,
        instrumentId: args.instrumentId,
        instance: 1,
      },
    },
  });
  if (existing) return existing;

  const created = await tx.record.create({
    data: {
      projectId: args.project.id,
      subjectId: subject.id,
      eventId: args.eventId,
      instrumentId: args.instrumentId,
      instance: 1,
      dagId,
    },
  });

  await logClinicalAuditEvent({
    db: tx,
    event: AuditEvent.RECORD_UPDATED,
    actorId: args.userId,
    projectId: args.project.id,
    resourceId: created.id,
    resourceType: "Record",
    metadata: {
      subjectId: subject.id,
      eventId: args.eventId,
      instrumentId: args.instrumentId,
      fromStatus: null,
      toStatus: RecordStatus.INCOMPLETE,
    },
  });

  return created;
};
