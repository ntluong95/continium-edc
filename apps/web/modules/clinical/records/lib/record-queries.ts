import "server-only";
import { AuditEvent, InstrumentStatus, RecordStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { prisma, withDagContextAsync } from "@continium/database";
import { authOptions } from "@/modules/auth/lib/authOptions";
import { assertCanReadInstrument } from "@/modules/clinical/access/lib/assert-helpers";
import { shouldEmitReadEvent } from "@/modules/clinical/audit/lib/dedupe-read-event";
import { resolveDagContextForRequest } from "@/modules/clinical/subjects/lib/resolve-dag-context";
import { ensurePublishedInstrumentFields } from "@/modules/clinical/instruments/lib/instrument-queries";
import { logClinicalAuditEvent } from "@/modules/clinical/subjects/lib/audit-events";
import { getClinicalStudyContext } from "@/modules/clinical/subjects/lib/subject-access";
import { getInstrumentDataEntryState } from "./data-entry-eligibility";
import { displayValue } from "./value-coercion";

// Explicit types to prevent TypeScript depth-limit inference failures on
// deeply nested Prisma return types.
export type TDataEntryRecordValue = {
  id: string;
  recordId: string;
  instrumentFieldId: string;
  valueText: string | null;
  valueNumber: string | null;
  valueDate: Date | null;
  valueJson: Prisma.JsonValue;
  updatedAt: Date;
  displayValue: string | null;
};

export type TDataEntryRecord = {
  id: string;
  instance: number;
  status: RecordStatus;
  lockedAt: Date | null;
  responsesJson: Record<string, unknown>;
  values: TDataEntryRecordValue[];
};

const selectRecordValue = {
  id: true,
  recordId: true,
  instrumentFieldId: true,
  valueText: true,
  valueNumber: true,
  valueDate: true,
  valueJson: true,
  updatedAt: true,
} as const;

export const getSubjectDataEntry = async (environmentId: string, subjectId: string, eventId?: string) => {
  const [{ project, study }, session] = await Promise.all([
    getClinicalStudyContext(environmentId),
    getServerSession(authOptions),
  ]);
  const actorId = session?.user?.id ?? null;

  // DAG access enforcement happens at two layers:
  //
  // 1. The manual subject filter below restricts Subject lookups to subjects
  //    the actor can see (Subject is not in the extension's allowlist, so
  //    keep manual scoping for it).
  // 2. The `withDagContextAsync` wrapper installs a per-request DAG scope
  //    that the Prisma client extension reads at query time. Reads of
  //    Record and Enrollment inside the wrapper are auto-filtered to
  //    `dagId IN (userDagIds)` even when this function does not pass a
  //    dagId filter explicitly. Defence in depth: any future read site
  //    in the same call stack that forgets to scope still gets the
  //    filter.
  const dagContext = await resolveDagContextForRequest(actorId, environmentId, study.id);
  let subjectWhere: { id: string; studyId: string; enrollments?: object } = {
    id: subjectId,
    studyId: study.id,
  };
  if (!dagContext.bypass && dagContext.userDagIds !== null) {
    subjectWhere = {
      ...subjectWhere,
      enrollments: { some: { dagId: { in: dagContext.userDagIds } } },
    };
  }

  const loadDataEntry = async () => {
  const subject = await prisma.subject.findFirst({
    where: subjectWhere,
    include: {
      contact: { select: { id: true } },
      enrollments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          armId: true,
          dagId: true,
          arm: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!subject) return null;

  const enrollment = subject.enrollments[0] ?? null;

  // Shared query for arm events — extracted so the re-fetch after
  // ensurePublishedInstrumentFields can reuse the same shape without
  // duplicating the include/select tree.
  const fetchArmEvents = () =>
    prisma.event.findMany({
      where: enrollment ? { armId: enrollment.armId } : { id: { in: [] } },
      orderBy: { position: "asc" },
      include: {
        instruments: {
          include: {
            instrument: {
              include: {
                fields: { orderBy: { position: "asc" } },
                survey: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                    status: true,
                    welcomeCard: true,
                    blocks: true,
                    endings: true,
                    hiddenFields: true,
                    variables: true,
                    styling: true,
                    singleUse: true,
                  },
                },
              },
            },
          },
          orderBy: { instrument: { displayName: "asc" } },
        },
      },
    });

  let events = await fetchArmEvents();
  let visibleEvents = events;

  const missingFieldInstrumentIds = visibleEvents.flatMap((event) =>
    event.instruments
      .filter(
        (binding) =>
          binding.instrument.status === InstrumentStatus.PUBLISHED &&
          binding.instrument.fields.length === 0 &&
          binding.instrument.surveyId
      )
      .map((binding) => binding.instrumentId)
  );

  if ((await ensurePublishedInstrumentFields(missingFieldInstrumentIds)) > 0) {
    events = await fetchArmEvents();
    visibleEvents = events;
  }

  const initialEventId =
    eventId && visibleEvents.some((event) => event.id === eventId) ? eventId : (visibleEvents[0]?.id ?? null);

  const records = await prisma.record.findMany({
    where: {
      subjectId: subject.id,
      eventId: { in: visibleEvents.map((event) => event.id) },
    },
    orderBy: [{ eventId: "asc" }, { instrumentId: "asc" }, { instance: "asc" }],
  });

  const values = await prisma.recordValue.findMany({
    where: { projectId: project.id, recordId: { in: records.map((record) => record.id) } },
    select: selectRecordValue,
  });

  const valuesByRecord = new Map<string, typeof values>();
  for (const value of values) {
    const existing = valuesByRecord.get(value.recordId) ?? ([] as typeof values);
    existing.push(value);
    valuesByRecord.set(value.recordId, existing);
  }

  const recordsByBinding = new Map<string, typeof records>();
  for (const record of records) {
    const key = `${record.eventId}:${record.instrumentId}`;
    const existing = recordsByBinding.get(key) ?? ([] as typeof records);
    existing.push(record);
    recordsByBinding.set(key, existing);
  }

  if (shouldEmitReadEvent(AuditEvent.RECORDS_VIEWED, actorId, project.id, "Record")) {
    // Write subjectId into resource_id so the visibility predicate in
    // audit-visibility.ts can filter with a scalar `resource_id IN (...)`
    // instead of a JSON-path lookup that breaks silently if the metadata
    // key is ever renamed.
    void logClinicalAuditEvent({
      db: prisma,
      event: AuditEvent.RECORDS_VIEWED,
      actorId,
      projectId: project.id,
      resourceType: "Record",
      resourceId: subjectId,
      metadata: { subjectId, eventId: initialEventId },
    });
  }

  if (actorId) {
    try {
      for (const event of visibleEvents) {
        for (const binding of event.instruments) {
          await assertCanReadInstrument(actorId, binding.instrumentId, study.id, event.id);
        }
      }
    } catch (error) {
      console.error("ACL check failed:", error);
    }
  }

  return {
    project,
    study,
    subject: {
      id: subject.id,
      externalId: subject.externalId,
      createdAt: subject.createdAt,
      enrollment: enrollment
        ? {
            id: enrollment.id,
            status: enrollment.status,
            armId: enrollment.armId,
            armName: enrollment.arm.name,
          }
        : null,
    },
    selectedEventId: initialEventId,
    events: visibleEvents.map((event) => ({
      id: event.id,
      name: event.name,
      dayOffset: event.dayOffset,
      windowDays: event.windowDays,
      instruments: event.instruments.map((binding) => ({
        eventId: event.id,
        required: binding.required,
        repeating: binding.repeating,
        instrument: binding.instrument,
        dataEntry: getInstrumentDataEntryState(binding.instrument),
        records: (recordsByBinding.get(`${event.id}:${binding.instrumentId}`) ?? ([] as typeof records)).map((record): TDataEntryRecord => ({
          id: record.id,
          instance: record.instance,
          status: record.status,
          lockedAt: record.lockedAt,
          responsesJson: (record.responsesJson ?? {}) as Record<string, unknown>,
          values: (valuesByRecord.get(record.id) ?? ([] as typeof values)).map((value): TDataEntryRecordValue => ({
            ...value,
            valueNumber: value.valueNumber?.toString() ?? null,
            displayValue: displayValue(value.valueText, value.valueNumber, value.valueDate, value.valueJson),
          })),
        })),
      })),
    })),
  };
  };

  return withDagContextAsync(dagContext, loadDataEntry);
};

export type TSubjectDataEntry = NonNullable<Awaited<ReturnType<typeof getSubjectDataEntry>>>;
export type TDataEntryEvent = TSubjectDataEntry["events"][number];
export type TDataEntryInstrument = TDataEntryEvent["instruments"][number];
// TDataEntryRecord and TDataEntryRecordValue are explicitly defined at top of file
