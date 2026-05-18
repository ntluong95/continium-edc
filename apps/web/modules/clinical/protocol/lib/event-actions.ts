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
  assertEventBelongsToProject,
  assertEventOrderingBelongsToArm,
  getClinicalProjectForEnvironment,
} from "./protocol-access";
import { reorderPositions, withFriendlyForeignKeyError } from "./protocol-write-helpers";
import {
  ZEventCreateInput,
  ZEventDeleteInput,
  ZEventReorderInput,
  ZEventUpdateInput,
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

export const createEventAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZEventCreateInput })))
  .action(async ({ ctx, parsedInput }) => {
    const project = await resolveProtocolContext(parsedInput.environmentId, ctx.user.id);
    await assertArmBelongsToProject(parsedInput.data.armId, project.id);

    const event = await withClinicalTx(async (tx) => {
      const position = await tx.event.count({ where: { armId: parsedInput.data.armId } });
      const created = await tx.event.create({ data: { ...parsedInput.data, position } });
      await logClinicalAuditEvent({
        db: tx,
        event: AuditEvent.EVENT_CREATED,
        actorId: ctx.user.id,
        projectId: project.id,
        resourceId: created.id,
        resourceType: "Event",
        metadata: { name: created.name, armId: created.armId },
      });
      return created;
    });
    revalidateProtocol(parsedInput.environmentId);
    return event;
  });

export const updateEventAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZEventUpdateInput })))
  .action(async ({ ctx, parsedInput }) => {
    const project = await resolveProtocolContext(parsedInput.environmentId, ctx.user.id);
    await assertEventBelongsToProject(parsedInput.data.id, project.id);

    const { id, ...rest } = parsedInput.data;
    const event = await withClinicalTx(async (tx) => {
      const updated = await tx.event.update({ where: { id }, data: rest });
      await logClinicalAuditEvent({
        db: tx,
        event: AuditEvent.EVENT_UPDATED,
        actorId: ctx.user.id,
        projectId: project.id,
        resourceId: updated.id,
        resourceType: "Event",
        metadata: { changes: rest },
      });
      return updated;
    });
    revalidateProtocol(parsedInput.environmentId);
    return event;
  });

export const deleteEventAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZEventDeleteInput })))
  .action(async ({ ctx, parsedInput }) => {
    const project = await resolveProtocolContext(parsedInput.environmentId, ctx.user.id);
    await assertEventBelongsToProject(parsedInput.data.id, project.id);

    await withFriendlyForeignKeyError(
      "This event still has records attached. Delete or move those records before removing the event.",
      () =>
        withClinicalTx(async (tx) => {
          await tx.event.delete({ where: { id: parsedInput.data.id } });
          await logClinicalAuditEvent({
            db: tx,
            event: AuditEvent.EVENT_DELETED,
            actorId: ctx.user.id,
            projectId: project.id,
            resourceId: parsedInput.data.id,
            resourceType: "Event",
          });
        })
    );
    revalidateProtocol(parsedInput.environmentId);
  });

export const reorderEventsAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZEventReorderInput })))
  .action(async ({ ctx, parsedInput }) => {
    const project = await resolveProtocolContext(parsedInput.environmentId, ctx.user.id);
    await assertArmBelongsToProject(parsedInput.data.armId, project.id);
    await assertEventOrderingBelongsToArm(parsedInput.data.armId, parsedInput.data.orderedIds);

    await withClinicalTx(async (tx) => {
      await reorderPositions(tx.event, parsedInput.data.orderedIds);
      await logClinicalAuditEvent({
        db: tx,
        event: AuditEvent.EVENT_REORDERED,
        actorId: ctx.user.id,
        projectId: project.id,
        resourceType: "Event",
        metadata: { armId: parsedInput.data.armId, orderedIds: parsedInput.data.orderedIds },
      });
    });
    revalidateProtocol(parsedInput.environmentId);
  });
