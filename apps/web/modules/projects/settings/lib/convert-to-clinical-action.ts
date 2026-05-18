"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@continium/database";
import { logger } from "@continium/logger";
import { ZId } from "@continium/types/common";
import { AuthorizationError } from "@continium/types/errors";
import { getProject } from "@/lib/project/service";
import { authenticatedActionClient } from "@/lib/utils/action-client";
import { checkAuthorizationUpdated } from "@/lib/utils/action-client/action-client-middleware";
import { getOrganizationIdFromProjectId } from "@/lib/utils/helper";
import { assertContiniumFeature } from "@/modules/continium/licensing/lib/assert-continium-feature";

const ZConvertToClinicalInput = z.object({
  projectId: ZId,
});

/**
 * Converts a PRODUCT project to CLINICAL mode.
 * One-way operation: PRODUCT → CLINICAL (reverse deferred to Phase 2).
 * Restricted to organization owners and managers only.
 * Emits PROJECT_KIND_CHANGED to the audit log atomically — if the audit write fails,
 * the project update is rolled back to prevent a CLINICAL project without an audit record.
 */
export const convertToClinicalAction = authenticatedActionClient
  .inputSchema(ZConvertToClinicalInput)
  .action(async ({ ctx, parsedInput }) => {
    const { projectId } = parsedInput;

    const organizationId = await getOrganizationIdFromProjectId(projectId);

    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });

    // Continium clinical-EDC capability gate.
    // Compliance-locked: rejected at boot if disabled (see @continium/licensing).
    await assertContiniumFeature("clinicalEdc");

    const project = await getProject(projectId);

    if (!project) {
      throw new AuthorizationError("Project not found");
    }

    const firstEnvironmentId = project.environments[0]?.id;
    const onboardingRedirect = firstEnvironmentId
      ? `/environments/${firstEnvironmentId}/clinical-onboarding`
      : null;

    if (project.kind === "CLINICAL") {
      // Idempotent — already CLINICAL, nothing to do. Still surface the wizard URL so the
      // caller can route there if onboarding hasn't been completed yet.
      return { kind: "CLINICAL" as const, redirectTo: onboardingRedirect };
    }

    // Atomic: project update + audit record in a single transaction.
    // For regulated EDC, a CLINICAL project without an audit record is a compliance gap.
    // If either write fails, both are rolled back.
    await prisma.$transaction([
      prisma.project.update({
        where: { id: projectId },
        data: { kind: "CLINICAL" },
        select: { id: true }, // minimal select — we don't need the full project back
      }),
      prisma.auditLog.create({
        data: {
          id: randomUUID(),
          occurredAt: new Date(),
          event: "PROJECT_KIND_CHANGED",
          actorId: ctx.user.id,
          projectId,
          resourceId: projectId,
          resourceType: "Project",
          diff: { action: "convert", from: "PRODUCT", to: "CLINICAL" } as object,
          metadata: { organizationId } as object,
        },
      }),
    ]);

    // Revalidate all environments so the Clinical nav item appears immediately
    // regardless of which environment the user is currently viewing.
    for (const env of project.environments) {
      revalidatePath(`/environments/${env.id}`);
    }

    logger.info({ projectId, actorId: ctx.user.id }, "project converted to CLINICAL");

    return { kind: "CLINICAL" as const, redirectTo: onboardingRedirect };
  });
