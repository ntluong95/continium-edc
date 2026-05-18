"use server";

import { AuditEvent, InstrumentStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@continium/database";
import { ValidationError } from "@continium/types/errors";
import { authenticatedActionClient } from "@/lib/utils/action-client";
import { checkAuthorizationUpdated } from "@/lib/utils/action-client/action-client-middleware";
import { getOrganizationIdFromEnvironmentId } from "@/lib/utils/helper";
import { logClinicalAuditEvent } from "@/modules/clinical/subjects/lib/audit-events";
import { assertInstrumentBelongsToStudy, getClinicalInstrumentContext } from "./instrument-access";
import {
  type TInstrumentSnapshotField,
  buildInstrumentFieldHash,
  buildSurveySourceHash,
  snapshotFromSurvey,
} from "./snapshot-from-survey";
import { ZCreateDraftFromSurveyInput, ZInstrumentActionInput } from "./zod-schemas";

const ZWithEnvironment = z.object({ environmentId: z.string().cuid() });

const revalidateClinicalInstrumentPaths = (environmentId: string) => {
  revalidatePath(`/environments/${environmentId}/forms`);
  revalidatePath(`/environments/${environmentId}/clinical/instruments`);
  revalidatePath(`/environments/${environmentId}/clinical/protocol`);
};

const normalizeJson = (value: unknown) =>
  value === undefined ? Prisma.JsonNull : (value as Prisma.InputJsonValue);

const createInstrumentDraft = async ({
  db,
  fields,
  studyId,
  survey,
  version,
}: {
  db: Prisma.TransactionClient;
  fields: TInstrumentSnapshotField[];
  studyId: string;
  survey: { id: string; name: string; blocks: unknown } | null;
  version: number;
}) => {
  const sourceSurveyHash = survey ? buildSurveySourceHash(survey) : null;
  const fieldHash = buildInstrumentFieldHash(fields);

  const instrument = await db.instrument.create({
    data: {
      studyId,
      surveyId: survey?.id ?? null,
      version,
      status: InstrumentStatus.DRAFT,
      name: survey?.name ?? `Instrument v${version}`,
      displayName: survey?.name ?? `Instrument v${version}`,
      sourceSurveyHash,
      fieldHash,
    },
  });

  if (fields.length > 0) {
    await db.instrumentField.createMany({
      data: fields.map((field) => ({
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

  return { instrument, fieldHash, sourceSurveyHash };
};

const getRecordReferenceCount = async (db: Prisma.TransactionClient, instrumentId: string) => {
  const [table] = await db.$queryRaw<Array<{ regclass: string | null }>>`
    SELECT to_regclass('public.record') AS regclass
  `;

  if (!table?.regclass) return 0;

  const [count] = await db.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count FROM "record" WHERE "instrument_id" = ${instrumentId}
  `;

  return Number(count?.count ?? 0);
};

export const createDraftFromSurveyAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZCreateDraftFromSurveyInput })))
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });

    const { project, study } = await getClinicalInstrumentContext(parsedInput.environmentId);
    const survey = await prisma.survey.findFirst({
      where: { id: parsedInput.data.surveyId, environmentId: parsedInput.environmentId },
      select: { id: true, name: true, blocks: true },
    });
    if (!survey) throw new ValidationError("Survey not found for this environment.");

    const snapshot = snapshotFromSurvey(survey);
    const version =
      ((
        await prisma.instrument.aggregate({
          where: { studyId: study.id, surveyId: survey.id },
          _max: { version: true },
        })
      )._max.version ?? 0) + 1;

    const draft = await prisma.$transaction(async (tx) => {
      const created = await createInstrumentDraft({
        db: tx,
        fields: snapshot.fields,
        studyId: study.id,
        survey,
        version,
      });
      await logClinicalAuditEvent({
        db: tx,
        event: AuditEvent.INSTRUMENT_DRAFTED,
        actorId: ctx.user.id,
        projectId: project.id,
        resourceId: created.instrument.id,
        resourceType: "Instrument",
        metadata: {
          surveyId: survey.id,
          version,
          fieldCount: snapshot.fields.length,
          fieldHash: created.fieldHash,
          warnings: snapshot.warnings,
        },
      });
      return created.instrument;
    });

    revalidateClinicalInstrumentPaths(parsedInput.environmentId);
    return draft;
  });

export const publishInstrumentAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZInstrumentActionInput })))
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });

    const { project, study } = await getClinicalInstrumentContext(parsedInput.environmentId);
    const instrument = await assertInstrumentBelongsToStudy(parsedInput.data.instrumentId, study.id);
    if (instrument.status !== InstrumentStatus.DRAFT)
      throw new ValidationError("Only draft instruments can be published.");

    if (instrument.surveyId && instrument.sourceSurveyHash) {
      const survey = await prisma.survey.findUnique({
        where: { id: instrument.surveyId },
        select: { id: true, name: true, blocks: true },
      });
      if (survey && buildSurveySourceHash(survey) !== instrument.sourceSurveyHash) {
        throw new ValidationError(
          "Source survey changed since this draft was created. Create a new draft from the current survey before publishing."
        );
      }
    }

    const published = await prisma.$transaction(async (tx) => {
      const updated = await tx.instrument.update({
        where: { id: instrument.id },
        data: { status: InstrumentStatus.PUBLISHED, publishedAt: new Date(), publishedById: ctx.user.id },
      });
      await logClinicalAuditEvent({
        db: tx,
        event: AuditEvent.INSTRUMENT_PUBLISHED,
        actorId: ctx.user.id,
        projectId: project.id,
        resourceId: instrument.id,
        resourceType: "Instrument",
        metadata: {
          version: instrument.version,
          fieldCount: instrument.fields.length,
          fieldHash: instrument.fieldHash,
        },
      });
      return updated;
    });

    revalidateClinicalInstrumentPaths(parsedInput.environmentId);
    return published;
  });

export const archiveInstrumentAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZInstrumentActionInput })))
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });

    const { project, study } = await getClinicalInstrumentContext(parsedInput.environmentId);
    const instrument = await assertInstrumentBelongsToStudy(parsedInput.data.instrumentId, study.id);
    if (instrument.status === InstrumentStatus.ARCHIVED) return instrument;
    if (instrument._count.eventBindings > 0)
      throw new ValidationError("Cannot archive an instrument that is still bound to one or more events.");

    const archived = await prisma.$transaction(async (tx) => {
      if (await getRecordReferenceCount(tx, instrument.id)) {
        throw new ValidationError("Cannot archive an instrument that is referenced by clinical records.");
      }
      const updated = await tx.instrument.update({
        where: { id: instrument.id },
        data: { status: InstrumentStatus.ARCHIVED },
      });
      await logClinicalAuditEvent({
        db: tx,
        event: AuditEvent.INSTRUMENT_ARCHIVED,
        actorId: ctx.user.id,
        projectId: project.id,
        resourceId: instrument.id,
        resourceType: "Instrument",
        metadata: { version: instrument.version, surveyId: instrument.surveyId },
      });
      return updated;
    });

    revalidateClinicalInstrumentPaths(parsedInput.environmentId);
    return archived;
  });

export const cloneAsNewDraftAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZInstrumentActionInput })))
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });

    const { project, study } = await getClinicalInstrumentContext(parsedInput.environmentId);
    const instrument = await assertInstrumentBelongsToStudy(parsedInput.data.instrumentId, study.id);
    if (instrument.status !== InstrumentStatus.PUBLISHED)
      throw new ValidationError("Only published instruments can be cloned into a new draft.");

    const version =
      ((
        await prisma.instrument.aggregate({
          where: { studyId: study.id, surveyId: instrument.surveyId },
          _max: { version: true },
        })
      )._max.version ?? instrument.version) + 1;

    const snapshot = instrument.survey ? snapshotFromSurvey(instrument.survey) : null;

    const draft = await prisma.$transaction(async (tx) => {
      const created = snapshot
        ? await createInstrumentDraft({
            db: tx,
            fields: snapshot.fields,
            studyId: study.id,
            survey: instrument.survey,
            version,
          })
        : await createInstrumentDraft({
            db: tx,
            fields: instrument.fields.map((field) => ({
              key: field.key,
              label: field.label,
              type: field.type,
              validationCode: field.validationCode,
              required: field.required,
              position: field.position,
              choicesJson: field.choicesJson,
              branchingJson: field.branchingJson,
            })),
            studyId: study.id,
            survey: null,
            version,
          });

      await logClinicalAuditEvent({
        db: tx,
        event: AuditEvent.INSTRUMENT_CLONED,
        actorId: ctx.user.id,
        projectId: project.id,
        resourceId: created.instrument.id,
        resourceType: "Instrument",
        metadata: {
          fromInstrumentId: instrument.id,
          surveyId: instrument.surveyId,
          version,
          fieldHash: created.fieldHash,
        },
      });
      return created.instrument;
    });

    revalidateClinicalInstrumentPaths(parsedInput.environmentId);
    return draft;
  });
