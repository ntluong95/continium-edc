import "server-only";
import { AuditEvent, InstrumentStatus, Prisma } from "@prisma/client";
import { prisma } from "@continium/database";
import { logClinicalAuditEvent } from "@/modules/clinical/subjects/lib/audit-events";
import {
  type TInstrumentSnapshotField,
  buildSurveySourceHash,
  snapshotFromSurvey,
} from "./snapshot-from-survey";

type TSurveySnapshotSource = {
  id: string;
  name: string;
  blocks: unknown;
};

interface PublishSurveyAsClinicalInstrumentParams {
  survey: TSurveySnapshotSource;
  projectId: string;
  actorId: string;
}

const normalizeJson = (value: unknown) =>
  value === undefined ? Prisma.JsonNull : (value as Prisma.InputJsonValue);

const createInstrumentFields = async (
  tx: unknown,
  instrumentId: string,
  fields: TInstrumentSnapshotField[]
) => {
  if (fields.length === 0) return;

  const instrumentFieldDb = tx as Pick<typeof prisma, "instrumentField">;
  await instrumentFieldDb.instrumentField.createMany({
    data: fields.map((field) => ({
      instrumentId,
      key: field.key,
      label: field.label,
      type: field.type,
      validationCode: field.validationCode,
      required: field.required,
      position: field.position,
      choicesJson: normalizeJson(field.choicesJson),
      branchingJson: normalizeJson(field.branchingJson),
    })),
    skipDuplicates: true,
  });
};

/**
 * Per-(study, survey) advisory-lock key used to serialize concurrent publish
 * attempts inside the publish transaction. Without this lock, two near-
 * simultaneous publishes for the same survey hash could each pass the
 * "is there already a PUBLISHED instrument with this hash?" check and then
 * both proceed to create a new Instrument row at version+1.
 *
 * Exported for the integration test that asserts concurrent publishes
 * collapse to a single Instrument row.
 */
export const buildClinicalPublishLockKey = (studyId: string, surveyId: string) =>
  `clinical-publish:${studyId}:${surveyId}`;

export const publishSurveyAsClinicalInstrument = async ({
  survey,
  projectId,
  actorId,
}: PublishSurveyAsClinicalInstrumentParams) => {
  return prisma.$transaction(async (tx) => {
    const study = await tx.study.findUnique({
      where: { projectId },
      select: { id: true },
    });
    if (!study) return null;

    // Serialise concurrent publish attempts for the same (study, survey) so
    // they cannot both pass the idempotency check and create duplicate
    // Instrument rows at adjacent version numbers. Released automatically when
    // the surrounding transaction commits or rolls back.
    const lockKey = buildClinicalPublishLockKey(study.id, survey.id);
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

    const sourceSurveyHash = buildSurveySourceHash(survey);
    const snapshot = snapshotFromSurvey(survey);

    const existingPublished = await tx.instrument.findFirst({
      where: {
        studyId: study.id,
        surveyId: survey.id,
        status: InstrumentStatus.PUBLISHED,
        sourceSurveyHash,
      },
      orderBy: { version: "desc" },
      include: { _count: { select: { fields: true } } },
    });

    if (existingPublished) {
      if (existingPublished._count.fields === 0) {
        await createInstrumentFields(tx, existingPublished.id, snapshot.fields);
        await tx.instrument.update({
          where: { id: existingPublished.id },
          data: {
            fieldHash: snapshot.fieldHash,
            sourceSurveyHash,
          },
        });
      }
      return existingPublished;
    }

    const matchingDraft = await tx.instrument.findFirst({
      where: {
        studyId: study.id,
        surveyId: survey.id,
        status: InstrumentStatus.DRAFT,
        sourceSurveyHash,
      },
      orderBy: { version: "desc" },
      include: { _count: { select: { fields: true } } },
    });

    if (matchingDraft) {
      const published = await tx.instrument.update({
        where: { id: matchingDraft.id },
        data: {
          status: InstrumentStatus.PUBLISHED,
          publishedAt: new Date(),
          publishedById: actorId,
          name: survey.name,
          displayName: survey.name,
          sourceSurveyHash,
          fieldHash: snapshot.fieldHash,
        },
      });

      if (matchingDraft._count.fields === 0) {
        await createInstrumentFields(tx, matchingDraft.id, snapshot.fields);
      }

      await logClinicalAuditEvent({
        db: tx,
        event: AuditEvent.INSTRUMENT_PUBLISHED,
        actorId,
        projectId,
        resourceId: published.id,
        resourceType: "Instrument",
        metadata: {
          surveyId: survey.id,
          version: published.version,
          fieldCount: snapshot.fields.length,
          fieldHash: snapshot.fieldHash,
          warnings: snapshot.warnings,
          source: "forms_publish",
        },
      });

      return published;
    }

    const version =
      ((
        await tx.instrument.aggregate({
          where: { studyId: study.id, surveyId: survey.id },
          _max: { version: true },
        })
      )._max.version ?? 0) + 1;

    const published = await tx.instrument.create({
      data: {
        studyId: study.id,
        surveyId: survey.id,
        version,
        status: InstrumentStatus.PUBLISHED,
        publishedAt: new Date(),
        publishedById: actorId,
        name: survey.name,
        displayName: survey.name,
        sourceSurveyHash,
        fieldHash: snapshot.fieldHash,
      },
    });

    await createInstrumentFields(tx, published.id, snapshot.fields);

    await logClinicalAuditEvent({
      db: tx,
      event: AuditEvent.INSTRUMENT_PUBLISHED,
      actorId,
      projectId,
      resourceId: published.id,
      resourceType: "Instrument",
      metadata: {
        surveyId: survey.id,
        version,
        fieldCount: snapshot.fields.length,
        fieldHash: snapshot.fieldHash,
        warnings: snapshot.warnings,
        source: "forms_publish",
      },
    });

    return published;
  });
};
