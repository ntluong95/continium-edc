"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@continium/database";
import { authenticatedActionClient } from "@/lib/utils/action-client";
import { checkAuthorizationUpdated } from "@/lib/utils/action-client/action-client-middleware";
import { getOrganizationIdFromEnvironmentId } from "@/lib/utils/helper";
import { getProjectByEnvironmentId } from "@/lib/project/service";
import { assertClinicalProject } from "@/modules/clinical/lib/assert-clinical-project";
import { ZStudyUpsertInput } from "./zod-schemas";

const ZUpsertStudyAction = z.object({
  environmentId: z.string().cuid(),
  data: ZStudyUpsertInput,
});

/**
 * Creates or updates the Study for a CLINICAL project.
 * Idempotent — safe to call on every visit to the protocol designer.
 */
export const upsertStudyAction = authenticatedActionClient
  .inputSchema(ZUpsertStudyAction)
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });

    const project = await getProjectByEnvironmentId(parsedInput.environmentId);
    assertClinicalProject(project);

    const study = await prisma.study.upsert({
      where: { projectId: project.id },
      create: { projectId: project.id, ...parsedInput.data },
      update: parsedInput.data,
    });

    revalidatePath(`/environments/${parsedInput.environmentId}/clinical/protocol`);
    return study;
  });
