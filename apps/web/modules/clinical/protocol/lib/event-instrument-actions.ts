"use server";

import { AuditEvent, InstrumentStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@continium/database";
import { ValidationError } from "@continium/types/errors";
import { authenticatedActionClient } from "@/lib/utils/action-client";
import { checkAuthorizationUpdated } from "@/lib/utils/action-client/action-client-middleware";
import { getOrganizationIdFromEnvironmentId } from "@/lib/utils/helper";
import {
  assertPublishedInstrumentBelongsToStudy,
  getClinicalInstrumentContext,
} from "@/modules/clinical/instruments/lib/instrument-access";
import {
  buildInstrumentFieldHash,
  buildSurveySourceHash,
  snapshotFromSurvey,
} from "@/modules/clinical/instruments/lib/snapshot-from-survey";
import { logClinicalAuditEvent } from "@/modules/clinical/subjects/lib/audit-events";
import { assertArmBelongsToStudy, assertEventBelongsToProject } from "./protocol-access";
import {
  ZEventInstrumentBindInput,
  ZEventInstrumentBulkSaveInput,
  ZEventInstrumentUnbindInput,
  ZEventInstrumentUpdateInput,
} from "./zod-schemas";

const ZWithEnvironment = z.object({ environmentId: z.string().cuid() });

const normalizeJson = (value: unknown) =>
  value === undefined ? Prisma.JsonNull : (value as Prisma.InputJsonValue);

const revalidateProtocolAndForms = (environmentId: string) => {
  revalidatePath(`/environments/${environmentId}/clinical/protocol`);
  revalidatePath(`/environments/${environmentId}/forms`);
};

/** Finds or auto-creates a PUBLISHED instrument for the given survey + study. */
async function ensurePublishedInstrument(
  tx: Prisma.TransactionClient,
  studyId: string,
  survey: { id: string; name: string; blocks: unknown }
): Promise<string> {
  const existing = await tx.instrument.findFirst({
    where: { studyId, surveyId: survey.id, status: InstrumentStatus.PUBLISHED },
    select: { id: true },
    orderBy: { version: "desc" },
  });
  if (existing) return existing.id;

  const snapshot = snapshotFromSurvey(survey);
  const sourceSurveyHash = buildSurveySourceHash(survey);
  const fieldHash = buildInstrumentFieldHash(snapshot.fields);
  const maxVersion = await tx.instrument.aggregate({
    where: { studyId, surveyId: survey.id },
    _max: { version: true },
  });
  const version = (maxVersion._max.version ?? 0) + 1;

  const instrument = await tx.instrument.create({
    data: {
      studyId,
      surveyId: survey.id,
      version,
      status: InstrumentStatus.PUBLISHED,
      publishedAt: new Date(),
      name: survey.name,
      displayName: survey.name,
      sourceSurveyHash,
      fieldHash,
    },
  });

  if (snapshot.fields.length > 0) {
    await tx.instrumentField.createMany({
      data: snapshot.fields.map((field) => ({
        instrumentId: instrument.id,
        key: field.key,
        label: field.label,
        type: field.type,
        validationCode: field.validationCode,
        required: field.required,
        position: field.position,
        choicesJson: normalizeJson(field.choicesJson),
        branchingJson: normalizeJson(field.branchingJson),
      })),
    });
  }

  return instrument.id;
}

export const bindInstrumentAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZEventInstrumentBindInput })))
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });

    const { project, study } = await getClinicalInstrumentContext(parsedInput.environmentId);
    await assertEventBelongsToProject(parsedInput.data.eventId, project.id);
    await assertPublishedInstrumentBelongsToStudy(parsedInput.data.instrumentId, study.id);

    const binding = await prisma.eventInstrument.upsert({
      where: {
        eventId_instrumentId: {
          eventId: parsedInput.data.eventId,
          instrumentId: parsedInput.data.instrumentId,
        },
      },
      create: parsedInput.data,
      update: { required: parsedInput.data.required, repeating: parsedInput.data.repeating },
    });
    revalidateProtocolAndForms(parsedInput.environmentId);
    return binding;
  });

export const unbindInstrumentAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZEventInstrumentUnbindInput })))
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });

    const { project, study } = await getClinicalInstrumentContext(parsedInput.environmentId);
    await assertEventBelongsToProject(parsedInput.data.eventId, project.id);
    await assertPublishedInstrumentBelongsToStudy(parsedInput.data.instrumentId, study.id);

    await prisma.eventInstrument.delete({
      where: {
        eventId_instrumentId: {
          eventId: parsedInput.data.eventId,
          instrumentId: parsedInput.data.instrumentId,
        },
      },
    });
    revalidateProtocolAndForms(parsedInput.environmentId);
  });

export const updateInstrumentBindingAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZEventInstrumentUpdateInput })))
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });

    const { project, study } = await getClinicalInstrumentContext(parsedInput.environmentId);
    await assertEventBelongsToProject(parsedInput.data.eventId, project.id);
    await assertPublishedInstrumentBelongsToStudy(parsedInput.data.instrumentId, study.id);

    const { eventId, instrumentId, ...rest } = parsedInput.data;
    const binding = await prisma.eventInstrument.update({
      where: { eventId_instrumentId: { eventId, instrumentId } },
      data: rest,
    });
    revalidateProtocolAndForms(parsedInput.environmentId);
    return binding;
  });

export const bulkSaveBindingsAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZEventInstrumentBulkSaveInput })))
  .action(async ({ ctx, parsedInput }) => {
    const { environmentId, data } = parsedInput;
    const { studyId, armId, bindings } = data;

    const organizationId = await getOrganizationIdFromEnvironmentId(environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });

    const { project, study } = await getClinicalInstrumentContext(environmentId);
    await assertArmBelongsToStudy(armId, study.id);

    // Validate all eventIds belong to this arm
    const armEvents = await prisma.event.findMany({ where: { armId }, select: { id: true } });
    const validEventIds = new Set(armEvents.map((e) => e.id));
    for (const b of bindings) {
      if (!validEventIds.has(b.eventId)) {
        throw new ValidationError(`Event ${b.eventId} does not belong to arm ${armId}.`);
      }
    }

    // Validate all surveyIds belong to this environment
    const distinctSurveyIds = [...new Set(bindings.map((b) => b.surveyId))];
    const validSurveys =
      distinctSurveyIds.length > 0
        ? await prisma.survey.findMany({
            where: { id: { in: distinctSurveyIds }, environmentId },
            select: { id: true, name: true, blocks: true },
          })
        : [];
    if (validSurveys.length !== distinctSurveyIds.length) {
      throw new ValidationError("One or more forms do not belong to this environment.");
    }
    const surveyById = new Map(validSurveys.map((s) => [s.id, s]));

    // For each surveyId that will be bound, ensure a PUBLISHED instrument exists (auto-create if needed)
    const surveyIdsToBind = [...new Set(bindings.filter((b) => b.bound).map((b) => b.surveyId))];
    const surveyToInstrumentId = new Map<string, string>();

    if (surveyIdsToBind.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const surveyId of surveyIdsToBind) {
          const survey = surveyById.get(surveyId);
          if (!survey) continue;
          surveyToInstrumentId.set(surveyId, await ensurePublishedInstrument(tx, study.id, survey));
        }
      });
    }

    // Build desired set using instrumentId
    const desired = new Set(
      bindings
        .filter((b) => b.bound)
        .flatMap((b) => {
          const instrumentId = surveyToInstrumentId.get(b.surveyId);
          return instrumentId ? [`${b.eventId}:${instrumentId}`] : [];
        })
    );

    // Fetch current bindings for this arm
    const currentRows = await prisma.eventInstrument.findMany({
      where: { event: { armId } },
      select: { eventId: true, instrumentId: true },
    });

    const current = new Set(currentRows.map((r) => `${r.eventId}:${r.instrumentId}`));
    const parseKey = (k: string) => {
      const [eId, iId] = k.split(":");
      return { eventId: eId, instrumentId: iId };
    };
    const toCreate = [...desired].filter((k) => !current.has(k)).map(parseKey);
    const toDelete = [...current].filter((k) => !desired.has(k)).map(parseKey);

    if (toCreate.length === 0 && toDelete.length === 0) return { created: 0, deleted: 0 };

    await prisma.$transaction(async (tx) => {
      if (toDelete.length > 0) {
        await tx.eventInstrument.deleteMany({
          where: { OR: toDelete.map(({ eventId, instrumentId }) => ({ eventId, instrumentId })) },
        });
      }
      if (toCreate.length > 0) {
        await tx.eventInstrument.createMany({
          data: toCreate.map(({ eventId, instrumentId }) => ({
            eventId,
            instrumentId,
            required: true,
            repeating: false,
          })),
          skipDuplicates: true,
        });
      }
      for (const { eventId, instrumentId } of toCreate) {
        await logClinicalAuditEvent({
          db: tx,
          event: AuditEvent.EVENT_INSTRUMENT_BOUND,
          actorId: ctx.user.id,
          projectId: project.id,
          resourceId: eventId,
          resourceType: "Event",
          metadata: { instrumentId, armId, studyId },
        });
      }
      for (const { eventId, instrumentId } of toDelete) {
        await logClinicalAuditEvent({
          db: tx,
          event: AuditEvent.EVENT_INSTRUMENT_UNBOUND,
          actorId: ctx.user.id,
          projectId: project.id,
          resourceId: eventId,
          resourceType: "Event",
          metadata: { instrumentId, armId, studyId },
        });
      }
    });

    revalidateProtocolAndForms(environmentId);
    return { created: toCreate.length, deleted: toDelete.length };
  });
