"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authenticatedActionClient } from "@/lib/utils/action-client";
import { checkAuthorizationUpdated } from "@/lib/utils/action-client/action-client-middleware";
import { getOrganizationIdFromEnvironmentId } from "@/lib/utils/helper";
import { withClinicalTx } from "@/modules/clinical/lib/clinical-tx";
import { getClinicalStudyContext } from "@/modules/clinical/subjects/lib/subject-access";
import { assertContiniumFeature } from "@/modules/continium/licensing/lib/assert-continium-feature";
import type { TResponseData } from "@continium/types/responses";
import {
  initializeRecord,
  saveClinicalSurveyResponse,
  setRecordStatus,
  upsertRecordValue,
} from "./clinical-record-service";
import { ZWithEnvironment, dataPagePath } from "./record-action-helpers";
import {
  ZAddInstanceInput,
  ZSaveClinicalSurveyResponseInput,
  ZSetRecordStatusInput,
  ZUpsertRecordValueInput,
} from "./zod-schemas";

const revalidateFormAnalysisPaths = (environmentId: string, surveyId?: string | null) => {
  if (!surveyId) return;
  revalidatePath(`/environments/${environmentId}/forms/${surveyId}/summary`);
  revalidatePath(`/environments/${environmentId}/forms/${surveyId}/responses`);
};

/**
 * Boilerplate shared by every clinical record action: load the org id for the
 * environment, gate access to owner/manager, then resolve the
 * `{ project, study }` context. Kept inline (not extracted further) so that
 * the action surface stays grep-able for permission checks.
 */
const resolveActionContext = async (environmentId: string, userId: string) => {
  const organizationId = await getOrganizationIdFromEnvironmentId(environmentId);
  await checkAuthorizationUpdated({
    userId,
    organizationId,
    access: [{ type: "organization", roles: ["owner", "manager"] }],
  });
  return getClinicalStudyContext(environmentId);
};

export const upsertRecordValueAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZUpsertRecordValueInput })))
  .action(async ({ ctx, parsedInput }) => {
    await assertContiniumFeature("clinicalEdc");
    const { project, study } = await resolveActionContext(
      parsedInput.environmentId,
      ctx.user.id
    );

    const result = await withClinicalTx((tx) =>
      upsertRecordValue(tx, {
        recordId: parsedInput.data.recordId,
        instrumentFieldId: parsedInput.data.instrumentFieldId,
        value: parsedInput.data.value,
        reason: parsedInput.data.reason,
        userId: ctx.user.id,
        environmentId: parsedInput.environmentId,
        project,
        study,
      })
    );

    revalidatePath(dataPagePath(parsedInput.environmentId, result.subjectId));
    revalidateFormAnalysisPaths(parsedInput.environmentId, result.surveyId);
    return result.value;
  });

export const setRecordStatusAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZSetRecordStatusInput })))
  .action(async ({ ctx, parsedInput }) => {
    await assertContiniumFeature("clinicalEdc");
    const { project, study } = await resolveActionContext(
      parsedInput.environmentId,
      ctx.user.id
    );

    const record = await withClinicalTx((tx) =>
      setRecordStatus(tx, {
        recordId: parsedInput.data.recordId,
        status: parsedInput.data.status,
        userId: ctx.user.id,
        environmentId: parsedInput.environmentId,
        project,
        study,
      })
    );

    revalidatePath(dataPagePath(parsedInput.environmentId, record.subjectId));
    revalidateFormAnalysisPaths(parsedInput.environmentId, record.instrument.surveyId);
    return record;
  });

export const saveClinicalSurveyResponseAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZSaveClinicalSurveyResponseInput })))
  .action(async ({ ctx, parsedInput }) => {
    await assertContiniumFeature("clinicalResponseSync");
    const { project, study } = await resolveActionContext(
      parsedInput.environmentId,
      ctx.user.id
    );

    const record = await withClinicalTx((tx) =>
      saveClinicalSurveyResponse(tx, {
        recordId: parsedInput.data.recordId,
        responsesJson: parsedInput.data.responsesJson as TResponseData,
        finished: parsedInput.data.finished,
        userId: ctx.user.id,
        environmentId: parsedInput.environmentId,
        project,
        study,
      })
    );

    revalidatePath(dataPagePath(parsedInput.environmentId, record.subjectId));
    revalidateFormAnalysisPaths(parsedInput.environmentId, record.instrument.surveyId);
    return { id: record.id, status: record.status };
  });

/**
 * Creates a single-instance Record (instance=1) when the user starts data
 * entry for a non-repeating instrument. No-ops silently when the record
 * already exists (unique constraint on subjectId+eventId+instrumentId+instance).
 */
export const initializeRecordAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZAddInstanceInput })))
  .action(async ({ ctx, parsedInput }) => {
    await assertContiniumFeature("clinicalEdc");
    const { project, study } = await resolveActionContext(
      parsedInput.environmentId,
      ctx.user.id
    );

    const record = await withClinicalTx((tx) =>
      initializeRecord(tx, {
        subjectId: parsedInput.data.subjectId,
        eventId: parsedInput.data.eventId,
        instrumentId: parsedInput.data.instrumentId,
        userId: ctx.user.id,
        project,
        study,
      })
    );

    revalidatePath(dataPagePath(parsedInput.environmentId, record.subjectId));
    return { id: record.id };
  });
