"use server";

import { AuditEvent } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authenticatedActionClient } from "@/lib/utils/action-client";
import { checkAuthorizationUpdated } from "@/lib/utils/action-client/action-client-middleware";
import { getOrganizationIdFromEnvironmentId } from "@/lib/utils/helper";
import { withClinicalTx } from "@/modules/clinical/lib/clinical-tx";
import { logClinicalAuditEvent } from "@/modules/clinical/subjects/lib/audit-events";
import {
  assertArmBelongsToProject,
  assertArmOrderingBelongsToStudy,
  assertStudyBelongsToProject,
  getClinicalProjectForEnvironment,
} from "./protocol-access";
import { reorderPositions, withFriendlyForeignKeyError } from "./protocol-write-helpers";
import {
  ZArmCreateInput,
  ZArmDeleteInput,
  ZArmReorderInput,
  ZArmUpdateInput,
} from "./zod-schemas";

const ZWithEnvironment = z.object({ environmentId: z.string().cuid() });

const revalidateProtocol = (environmentId: string) =>
  revalidatePath(`/environments/${environmentId}/clinical/protocol`);

const resolveProtocolContext = async (environmentId: string, userId: string) => {
  const organizationId = await getOrganizationIdFromEnvironmentId(environmentId);
  await checkAuthorizationUpdated({
    userId,
    organizationId,
    access: [{ type: "organization", roles: ["owner", "manager"] }],
  });
  return getClinicalProjectForEnvironment(environmentId);
};

export const createArmAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZArmCreateInput })))
  .action(async ({ ctx, parsedInput }) => {
    const project = await resolveProtocolContext(parsedInput.environmentId, ctx.user.id);
    await assertStudyBelongsToProject(parsedInput.data.studyId, project.id);

    const arm = await withClinicalTx(async (tx) => {
      const position = await tx.arm.count({ where: { studyId: parsedInput.data.studyId } });
      const created = await tx.arm.create({ data: { ...parsedInput.data, position } });
      await logClinicalAuditEvent({
        db: tx,
        event: AuditEvent.ARM_CREATED,
        actorId: ctx.user.id,
        projectId: project.id,
        resourceId: created.id,
        resourceType: "Arm",
        metadata: { name: created.name, studyId: created.studyId },
      });
      return created;
    });
    revalidateProtocol(parsedInput.environmentId);
    return arm;
  });

export const updateArmAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZArmUpdateInput })))
  .action(async ({ ctx, parsedInput }) => {
    const project = await resolveProtocolContext(parsedInput.environmentId, ctx.user.id);
    await assertArmBelongsToProject(parsedInput.data.id, project.id);

    const { id, ...rest } = parsedInput.data;
    const arm = await withClinicalTx(async (tx) => {
      const updated = await tx.arm.update({ where: { id }, data: rest });
      await logClinicalAuditEvent({
        db: tx,
        event: AuditEvent.ARM_UPDATED,
        actorId: ctx.user.id,
        projectId: project.id,
        resourceId: updated.id,
        resourceType: "Arm",
        metadata: { changes: rest },
      });
      return updated;
    });
    revalidateProtocol(parsedInput.environmentId);
    return arm;
  });

export const deleteArmAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZArmDeleteInput })))
  .action(async ({ ctx, parsedInput }) => {
    const project = await resolveProtocolContext(parsedInput.environmentId, ctx.user.id);
    await assertArmBelongsToProject(parsedInput.data.id, project.id);

    await withFriendlyForeignKeyError(
      "This arm has active enrollments and cannot be deleted. Withdraw or reassign those subjects first.",
      () =>
        withClinicalTx(async (tx) => {
          await tx.arm.delete({ where: { id: parsedInput.data.id } });
          await logClinicalAuditEvent({
            db: tx,
            event: AuditEvent.ARM_DELETED,
            actorId: ctx.user.id,
            projectId: project.id,
            resourceId: parsedInput.data.id,
            resourceType: "Arm",
          });
        })
    );
    revalidateProtocol(parsedInput.environmentId);
  });

export const reorderArmsAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZArmReorderInput })))
  .action(async ({ ctx, parsedInput }) => {
    const project = await resolveProtocolContext(parsedInput.environmentId, ctx.user.id);
    await assertStudyBelongsToProject(parsedInput.data.studyId, project.id);
    await assertArmOrderingBelongsToStudy(parsedInput.data.studyId, parsedInput.data.orderedIds);

    await withClinicalTx(async (tx) => {
      await reorderPositions(tx.arm, parsedInput.data.orderedIds);
      await logClinicalAuditEvent({
        db: tx,
        event: AuditEvent.ARM_REORDERED,
        actorId: ctx.user.id,
        projectId: project.id,
        resourceType: "Arm",
        metadata: { studyId: parsedInput.data.studyId, orderedIds: parsedInput.data.orderedIds },
      });
    });
    revalidateProtocol(parsedInput.environmentId);
  });
