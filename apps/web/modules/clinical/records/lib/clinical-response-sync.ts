import "server-only";
import { type Prisma, RecordStatus } from "@prisma/client";
import type { TResponseData, TResponseTtc, TResponseVariables } from "@continium/types/responses";
import type { ClinicalTx } from "@/modules/clinical/lib/clinical-tx";

export const CLINICAL_RESPONSE_SOURCE = "clinical_data_entry";

export const clinicalResponseRecordInclude = {
  subject: { select: { id: true, externalId: true, contactId: true } },
  event: {
    select: {
      id: true,
      name: true,
      armId: true,
      arm: { select: { id: true, name: true } },
    },
  },
  instrument: {
    select: {
      id: true,
      name: true,
      displayName: true,
      surveyId: true,
      status: true,
      survey: { select: { id: true, status: true } },
    },
  },
} satisfies Prisma.RecordInclude;

export type ClinicalResponseRecord = Prisma.RecordGetPayload<{
  include: typeof clinicalResponseRecordInclude;
}>;

type UpsertClinicalResponseInput = {
  /**
   * Branded clinical transaction — obtain one via `withClinicalTx`. The brand
   * prevents callers from passing the global `prisma` client, which would
   * bypass the advisory lock below and break Response idempotency.
   */
  tx: ClinicalTx;
  record: ClinicalResponseRecord;
  responseData: TResponseData;
  variables?: TResponseVariables;
  ttc?: TResponseTtc;
  finished: boolean;
  userId: string;
  environmentId: string;
  projectId: string;
  language?: string;
};

const clinicalSingleUseId = (recordId: string) => `clinical-record:${recordId}`;

export const isClinicalResponseFinished = (status: RecordStatus) => status === RecordStatus.COMPLETE;

const buildClinicalResponseMeta = ({
  record,
  userId,
  environmentId,
  projectId,
}: Pick<UpsertClinicalResponseInput, "record" | "userId" | "environmentId" | "projectId">) =>
  ({
    source: CLINICAL_RESPONSE_SOURCE,
    recordId: record.id,
    subjectId: record.subjectId,
    subjectExternalId: record.subject.externalId,
    eventId: record.eventId,
    eventName: record.event.name,
    armId: record.event.armId,
    armName: record.event.arm.name,
    instrumentId: record.instrumentId,
    instrumentName: record.instrument.displayName || record.instrument.name,
    instance: record.instance,
    enteredByUserId: userId,
    environmentId,
    projectId,
  }) satisfies Prisma.InputJsonObject;

const responseWriteData = ({
  record,
  responseData,
  variables,
  ttc,
  finished,
  userId,
  environmentId,
  projectId,
  language,
}: Omit<UpsertClinicalResponseInput, "tx">) => ({
  contactId: record.subject.contactId ?? null,
  data: responseData,
  variables: variables ?? {},
  ttc: ttc ?? {},
  finished,
  language,
  meta: buildClinicalResponseMeta({ record, userId, environmentId, projectId }),
});

export const upsertClinicalResponseForRecord = async ({
  tx,
  record,
  responseData,
  variables = {},
  ttc = {},
  finished,
  userId,
  environmentId,
  projectId,
  language = "default",
}: UpsertClinicalResponseInput) => {
  const surveyId = record.instrument.surveyId;

  // Legacy standalone clinical instruments have no Forms analytics surface.
  // They keep writing Record/RecordValue only until linked to a Survey.
  if (!surveyId) return null;

  const singleUseId = clinicalSingleUseId(record.id);
  const writeData = responseWriteData({
    record,
    responseData,
    variables,
    ttc,
    finished,
    userId,
    environmentId,
    projectId,
    language,
  });

  // Serialise by clinical record so repeated onResponse/onFinished calls cannot
  // race into two Response rows before the surveyId+singleUseId guard is visible.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${singleUseId}))`;

  const existingByRecord = record.responseId
    ? await tx.response.findUnique({
        where: { id: record.responseId },
        select: { id: true },
      })
    : null;

  const existing =
    existingByRecord ??
    (await tx.response.findUnique({
      where: { surveyId_singleUseId: { surveyId, singleUseId } },
      select: { id: true },
    }));

  const response = existing
    ? await tx.response.update({
        where: { id: existing.id },
        data: writeData,
        select: { id: true, surveyId: true },
      })
    : await tx.response.create({
        data: {
          surveyId,
          singleUseId,
          ...writeData,
        },
        select: { id: true, surveyId: true },
      });

  if (record.responseId !== response.id) {
    await tx.record.update({
      where: { id: record.id },
      data: { responseId: response.id },
    });
  }

  return response;
};
