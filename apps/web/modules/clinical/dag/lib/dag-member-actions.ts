"use server";

import { AuditEvent } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@continium/database";
import { authenticatedActionClient } from "@/lib/utils/action-client";
import { checkAuthorizationUpdated } from "@/lib/utils/action-client/action-client-middleware";
import { getOrganizationIdFromEnvironmentId } from "@/lib/utils/helper";
import { logClinicalAuditEvent } from "@/modules/clinical/subjects/lib/audit-events";
import { getClinicalStudyContext } from "@/modules/clinical/subjects/lib/subject-access";
import { assertContiniumFeature } from "@/modules/continium/licensing/lib/assert-continium-feature";
import { ZAddDagMemberInput, ZRemoveDagMemberInput } from "./zod-schemas";

const ZWithEnvironment = z.object({ environmentId: z.string().cuid() });

const dagDetailPath = (environmentId: string, dagId: string) =>
  `/environments/${environmentId}/clinical/dags/${dagId}`;

export const addDagMemberAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZAddDagMemberInput })))
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });
    await assertContiniumFeature("clinicalDataAccessGroups");

    const { project, study } = await getClinicalStudyContext(parsedInput.environmentId);

    // Guard: DAG must belong to this study.
    const dag = await prisma.dataAccessGroup.findFirst({
      where: { id: parsedInput.data.dagId, studyId: study.id },
    });
    if (!dag) throw new Error("DAG not found.");

    // Guard: target user must be an accepted org member (prevents adding arbitrary userIds).
    const orgMembership = await prisma.membership.findFirst({
      where: { userId: parsedInput.data.userId, organizationId: project.organizationId, accepted: true },
    });
    if (!orgMembership) throw new Error("User is not a member of this organisation.");

    await prisma.dagMember.create({
      data: {
        dagId: parsedInput.data.dagId,
        userId: parsedInput.data.userId,
        addedById: ctx.user.id,
      },
    });

    await logClinicalAuditEvent({
      db: prisma,
      event: AuditEvent.DAG_MEMBER_ADDED,
      actorId: ctx.user.id,
      projectId: project.id,
      resourceId: parsedInput.data.dagId,
      resourceType: "DagMember",
      metadata: { dagId: parsedInput.data.dagId, userId: parsedInput.data.userId, dagName: dag.name },
    });

    revalidatePath(dagDetailPath(parsedInput.environmentId, parsedInput.data.dagId));
  });

export const removeDagMemberAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZRemoveDagMemberInput })))
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });
    await assertContiniumFeature("clinicalDataAccessGroups");

    const { project, study } = await getClinicalStudyContext(parsedInput.environmentId);

    // Guard: DAG must belong to this study.
    const dag = await prisma.dataAccessGroup.findFirst({
      where: { id: parsedInput.data.dagId, studyId: study.id },
    });
    if (!dag) throw new Error("DAG not found.");

    await prisma.dagMember.delete({
      where: { dagId_userId: { dagId: parsedInput.data.dagId, userId: parsedInput.data.userId } },
    });

    await logClinicalAuditEvent({
      db: prisma,
      event: AuditEvent.DAG_MEMBER_REMOVED,
      actorId: ctx.user.id,
      projectId: project.id,
      resourceId: parsedInput.data.dagId,
      resourceType: "DagMember",
      metadata: { dagId: parsedInput.data.dagId, userId: parsedInput.data.userId, dagName: dag.name },
    });

    revalidatePath(dagDetailPath(parsedInput.environmentId, parsedInput.data.dagId));
  });
