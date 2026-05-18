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
import { ZCreateDagInput, ZDeleteDagInput, ZUpdateDagInput } from "./zod-schemas";

const ZWithEnvironment = z.object({ environmentId: z.string().cuid() });

const dagsPath = (environmentId: string) =>
  `/environments/${environmentId}/clinical/dags`;

export const createDagAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZCreateDagInput })))
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });
    await assertContiniumFeature("clinicalDataAccessGroups");

    const { project, study } = await getClinicalStudyContext(parsedInput.environmentId);

    const dag = await prisma.dataAccessGroup.create({
      data: {
        studyId: study.id,
        name: parsedInput.data.name,
        code: parsedInput.data.code,
      },
    });

    await logClinicalAuditEvent({
      db: prisma,
      event: AuditEvent.DAG_CREATED,
      actorId: ctx.user.id,
      projectId: project.id,
      resourceId: dag.id,
      resourceType: "DataAccessGroup",
      metadata: { name: dag.name, code: dag.code, studyId: study.id },
    });

    revalidatePath(dagsPath(parsedInput.environmentId));
    return dag;
  });

export const updateDagAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZUpdateDagInput })))
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });
    await assertContiniumFeature("clinicalDataAccessGroups");

    const { project, study } = await getClinicalStudyContext(parsedInput.environmentId);

    const existing = await prisma.dataAccessGroup.findFirst({
      where: { id: parsedInput.data.id, studyId: study.id },
    });
    if (!existing) throw new Error("DAG not found.");

    const dag = await prisma.dataAccessGroup.update({
      where: { id: existing.id },
      data: { name: parsedInput.data.name, code: parsedInput.data.code },
    });

    await logClinicalAuditEvent({
      db: prisma,
      event: AuditEvent.DAG_UPDATED,
      actorId: ctx.user.id,
      projectId: project.id,
      resourceId: dag.id,
      resourceType: "DataAccessGroup",
      metadata: {
        from: { name: existing.name, code: existing.code },
        to: { name: dag.name, code: dag.code },
      },
    });

    revalidatePath(dagsPath(parsedInput.environmentId));
    return dag;
  });

export const deleteDagAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZDeleteDagInput })))
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });
    await assertContiniumFeature("clinicalDataAccessGroups");

    const { project, study } = await getClinicalStudyContext(parsedInput.environmentId);

    const existing = await prisma.dataAccessGroup.findFirst({
      where: { id: parsedInput.data.id, studyId: study.id },
    });
    if (!existing) throw new Error("DAG not found.");

    await prisma.dataAccessGroup.delete({ where: { id: existing.id } });

    await logClinicalAuditEvent({
      db: prisma,
      event: AuditEvent.DAG_DELETED,
      actorId: ctx.user.id,
      projectId: project.id,
      resourceId: existing.id,
      resourceType: "DataAccessGroup",
      metadata: { name: existing.name, code: existing.code },
    });

    revalidatePath(dagsPath(parsedInput.environmentId));
  });
