import "server-only";
import { InstrumentStatus, Prisma } from "@prisma/client";
import { cache } from "react";
import { prisma } from "@continium/database";
import { diffInstrumentVersions } from "./diff-instrument-versions";
import { getClinicalInstrumentContext } from "./instrument-access";
import {
  buildSurveySourceHash,
  collectUnsupportedFieldTypes,
  snapshotFromSurvey,
} from "./snapshot-from-survey";

const selectInstrumentFields = {
  key: true,
  label: true,
  type: true,
  required: true,
  position: true,
  validationCode: true,
  choicesJson: true,
  branchingJson: true,
} as const;

export const getInstrumentDashboard = cache(async (environmentId: string) => {
  const { study } = await getClinicalInstrumentContext(environmentId);
  const [surveys, instruments] = await Promise.all([
    prisma.survey.findMany({
      where: { environmentId },
      select: { id: true, name: true, status: true, blocks: true },
      orderBy: { name: "asc" },
    }),
    prisma.instrument.findMany({
      where: { studyId: study.id },
      orderBy: [{ surveyId: "asc" }, { version: "desc" }],
      include: {
        survey: { select: { id: true, name: true, status: true } },
        fields: { orderBy: { position: "asc" }, select: selectInstrumentFields },
        _count: { select: { fields: true, eventBindings: true } },
      },
    }),
  ]);

  const surveyHashById = new Map(surveys.map((survey) => [survey.id, buildSurveySourceHash(survey)]));

  const versionMap = new Map<string, typeof instruments>();
  for (const instrument of instruments) {
    const key = instrument.surveyId ?? instrument.id;
    versionMap.set(key, [...(versionMap.get(key) ?? []), instrument]);
  }

  const surveyGroups = surveys.map((survey) => {
    const versions = versionMap.get(survey.id) ?? [];

    return {
      survey: { id: survey.id, name: survey.name, status: survey.status },
      versions: versions.map((instrument) => {
        const previousPublished = versions.find(
          (candidate) => candidate.id !== instrument.id && candidate.status === InstrumentStatus.PUBLISHED
        );

        return {
          id: instrument.id,
          version: instrument.version,
          status: instrument.status,
          name: instrument.name,
          displayName: instrument.displayName,
          publishedAt: instrument.publishedAt,
          fieldCount: instrument._count.fields,
          boundEventCount: instrument._count.eventBindings,
          sourceSurveyChanged:
            Boolean(instrument.surveyId) &&
            Boolean(instrument.sourceSurveyHash) &&
            surveyHashById.get(instrument.surveyId ?? "") !== instrument.sourceSurveyHash,
          unsupportedFieldTypes: collectUnsupportedFieldTypes(instrument.fields),
          diff:
            instrument.status === InstrumentStatus.DRAFT
              ? diffInstrumentVersions(previousPublished?.fields ?? [], instrument.fields)
              : null,
        };
      }),
    };
  });

  const standaloneVersions = instruments
    .filter((instrument) => !instrument.surveyId)
    .map((instrument) => ({
      id: instrument.id,
      version: instrument.version,
      status: instrument.status,
      name: instrument.name,
      displayName: instrument.displayName,
      publishedAt: instrument.publishedAt,
      fieldCount: instrument._count.fields,
      boundEventCount: instrument._count.eventBindings,
      sourceSurveyChanged: false,
      unsupportedFieldTypes: collectUnsupportedFieldTypes(instrument.fields),
      diff: null,
    }));

  return { study, surveyGroups, standaloneVersions };
});

export type TInstrumentDashboard = Awaited<ReturnType<typeof getInstrumentDashboard>>;

export const getPublishedInstrumentOptions = cache(async (environmentId: string) => {
  const { study } = await getClinicalInstrumentContext(environmentId);

  return prisma.instrument.findMany({
    where: { studyId: study.id, status: InstrumentStatus.PUBLISHED },
    orderBy: [{ survey: { name: "asc" } }, { version: "desc" }],
    select: {
      id: true,
      displayName: true,
      version: true,
      publishedAt: true,
      survey: { select: { id: true, name: true } },
      _count: { select: { fields: true } },
    },
  });
});

export type TPublishedInstrumentOption = Awaited<ReturnType<typeof getPublishedInstrumentOptions>>[number];

export const getSurveyOptions = cache(async (environmentId: string) => {
  return prisma.survey.findMany({
    where: { environmentId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
});

export type TSurveyOption = Awaited<ReturnType<typeof getSurveyOptions>>[number];

const normalizeJson = (value: unknown) =>
  value === undefined ? Prisma.JsonNull : (value as Prisma.InputJsonValue);

export const ensurePublishedInstrumentFields = async (instrumentIds: string[]) => {
  const uniqueInstrumentIds = Array.from(new Set(instrumentIds));
  if (uniqueInstrumentIds.length === 0) return 0;

  const instruments = await prisma.instrument.findMany({
    where: {
      id: { in: uniqueInstrumentIds },
      status: InstrumentStatus.PUBLISHED,
      surveyId: { not: null },
      fields: { none: {} },
    },
    include: {
      survey: { select: { id: true, name: true, blocks: true } },
    },
  });

  if (instruments.length === 0) return 0;

  let repairedFieldCount = 0;
  await prisma.$transaction(async (tx) => {
    for (const instrument of instruments) {
      if (!instrument.survey) continue;

      let snapshot: ReturnType<typeof snapshotFromSurvey>;
      try {
        snapshot = snapshotFromSurvey(instrument.survey);
      } catch (error) {
        console.warn("Unable to repair legacy clinical instrument fields.", {
          instrumentId: instrument.id,
          surveyId: instrument.surveyId,
          error,
        });
        continue;
      }

      if (snapshot.fields.length === 0) continue;

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
        skipDuplicates: true,
      });

      await tx.instrument.update({
        where: { id: instrument.id },
        data: {
          sourceSurveyHash: instrument.sourceSurveyHash ?? buildSurveySourceHash(instrument.survey),
          fieldHash: instrument.fieldHash ?? snapshot.fieldHash,
        },
      });

      repairedFieldCount += snapshot.fields.length;
    }
  });

  return repairedFieldCount;
};
