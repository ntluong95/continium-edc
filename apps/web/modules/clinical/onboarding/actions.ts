"use server";

import { AuditEvent } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logger } from "@continium/logger";
import { OperationNotAllowedError, ResourceNotFoundError } from "@continium/types/errors";
import { getProjectByEnvironmentId } from "@/lib/project/service";
import { authenticatedActionClient } from "@/lib/utils/action-client";
import { checkAuthorizationUpdated } from "@/lib/utils/action-client/action-client-middleware";
import { getOrganizationIdFromEnvironmentId } from "@/lib/utils/helper";
import { assertClinicalProject } from "@/modules/clinical/lib/assert-clinical-project";
import { withClinicalTx } from "@/modules/clinical/lib/clinical-tx";
import { logClinicalAuditEvent } from "@/modules/clinical/subjects/lib/audit-events";
import { assertContiniumFeature } from "@/modules/continium/licensing/lib/assert-continium-feature";
import { createStudyFromTemplate } from "./lib/create-study-from-template";
import { getClinicalTemplate } from "./lib/templates";
import { ZCompleteClinicalOnboardingInput } from "./lib/zod-schemas";

/**
 * Atomically completes Clinical Project Onboarding.
 *
 * Steps inside a single transaction:
 *   1. Reject if onboarding already completed (idempotent short-circuit).
 *   2. Upsert Study with title + protocolId.
 *   3. If startMethod === "template", apply the template (Arms, Events, Instruments, Fields, EventInstrument).
 *   4. Upsert ClinicalProjectOnboarding with completedAt = now().
 *   5. Write CLINICAL_ONBOARDING_COMPLETED audit event.
 *
 * Authorization: organization owner|manager. Same bar as `convertToClinicalAction`.
 */
export const completeClinicalOnboardingAction = authenticatedActionClient
  .inputSchema(ZCompleteClinicalOnboardingInput)
  .action(async ({ ctx, parsedInput }) => {
    const { environmentId, title, protocolId, purpose, notes, startMethod, templateKey } = parsedInput;

    const organizationId = await getOrganizationIdFromEnvironmentId(environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });
    // Compliance-locked: cannot be disabled via env.
    await assertContiniumFeature("clinicalEdc");
    // Gate template application on the templates capability (env-disable-able).
    if (startMethod === "template") {
      await assertContiniumFeature("clinicalTemplates");
    }

    const project = await getProjectByEnvironmentId(environmentId);
    assertClinicalProject(project);

    const template = startMethod === "template" && templateKey ? getClinicalTemplate(templateKey) : undefined;
    if (startMethod === "template" && !template) {
      throw new ResourceNotFoundError("ClinicalTemplate", templateKey ?? "<unknown>");
    }

    const result = await withClinicalTx(async (tx) => {
      const existingOnboarding = await tx.clinicalProjectOnboarding.findUnique({
        where: { projectId: project.id },
        select: { completedAt: true },
      });
      if (existingOnboarding?.completedAt) {
        throw new OperationNotAllowedError(
          "Clinical onboarding has already been completed for this project."
        );
      }

      const study = await tx.study.upsert({
        where: { projectId: project.id },
        create: {
          projectId: project.id,
          name: title,
          protocolId: protocolId && protocolId.length > 0 ? protocolId : null,
        },
        update: {
          name: title,
          protocolId: protocolId && protocolId.length > 0 ? protocolId : null,
        },
        select: { id: true },
      });

      await logClinicalAuditEvent({
        db: tx,
        event: AuditEvent.STUDY_CREATED,
        actorId: ctx.user.id,
        projectId: project.id,
        resourceId: study.id,
        resourceType: "Study",
        metadata: { title, protocolId: protocolId ?? null, purpose, startMethod },
      });

      if (template) {
        await createStudyFromTemplate({
          tx,
          studyId: study.id,
          environmentId,
          projectId: project.id,
          actorId: ctx.user.id,
          template,
        });
      }

      await tx.clinicalProjectOnboarding.upsert({
        where: { projectId: project.id },
        create: {
          projectId: project.id,
          purpose,
          startMethod,
          templateKey: template ? template.key : null,
          notes: notes && notes.length > 0 ? notes : null,
          createdById: ctx.user.id,
          completedAt: new Date(),
        },
        update: {
          purpose,
          startMethod,
          templateKey: template ? template.key : null,
          notes: notes && notes.length > 0 ? notes : null,
          createdById: ctx.user.id,
          completedAt: new Date(),
        },
      });

      await logClinicalAuditEvent({
        db: tx,
        event: AuditEvent.CLINICAL_ONBOARDING_COMPLETED,
        actorId: ctx.user.id,
        projectId: project.id,
        resourceId: project.id,
        resourceType: "Project",
        metadata: {
          purpose,
          startMethod,
          templateKey: template ? template.key : null,
          studyId: study.id,
          armsCreated: template?.arms.length ?? 0,
          instrumentsCreated: template?.instruments.length ?? 0,
        },
      });

      return { studyId: study.id };
    });

    revalidatePath(`/environments/${environmentId}/clinical`, "layout");
    revalidatePath(`/environments/${environmentId}/clinical-onboarding`);
    revalidatePath(`/environments/${environmentId}/forms`);
    revalidatePath(`/environments/${environmentId}/clinical/protocol`);
    revalidatePath(`/environments/${environmentId}/clinical/subjects`);
    revalidatePath(`/environments/${environmentId}/clinical/instruments`);

    logger.info(
      { projectId: project.id, actorId: ctx.user.id, startMethod, templateKey: templateKey ?? null },
      "clinical onboarding completed"
    );

    return {
      ok: true as const,
      studyId: result.studyId,
      redirectTo: `/environments/${environmentId}/clinical/protocol${template ? "?setup=template" : ""}`,
    };
  });
