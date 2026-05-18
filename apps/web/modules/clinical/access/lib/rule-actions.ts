"use server";

import { AuditEvent } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@continium/database";
import { ValidationError } from "@continium/types/errors";
import { authenticatedActionClient } from "@/lib/utils/action-client";
import { checkAuthorizationUpdated } from "@/lib/utils/action-client/action-client-middleware";
import { getOrganizationIdFromEnvironmentId } from "@/lib/utils/helper";
import {
  ZCreateClinicalAccessRule,
  ZUpdateClinicalAccessRule,
  ZDeleteClinicalAccessRule,
} from "./zod-schemas";
import { logClinicalAuditEvent } from "@/modules/clinical/subjects/lib/audit-events";
import { getClinicalStudyContext } from "@/modules/clinical/subjects/lib/subject-access";
import { assertContiniumFeature } from "@/modules/continium/licensing/lib/assert-continium-feature";

const ZEnvironmentId = z.object({
  environmentId: z.string().cuid2(),
});

export const createClinicalAccessRuleAction = authenticatedActionClient
  .inputSchema(ZEnvironmentId.merge(ZCreateClinicalAccessRule))
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });
    await assertContiniumFeature("clinicalAccessRules");

    const { project, study } = await getClinicalStudyContext(parsedInput.environmentId);

    if (parsedInput.studyId !== study.id) {
      throw new ValidationError("Study ID does not match the environment's study");
    }

    const existingRule = await prisma.clinicalAccessRule.findFirst({
      where: {
        userId: parsedInput.userId,
        studyId: parsedInput.studyId,
        instrumentId: parsedInput.instrumentId,
        eventId: parsedInput.eventId,
      },
    });

    if (existingRule) {
      throw new ValidationError("A rule already exists for this user and target");
    }

    const rule = await prisma.$transaction(async (tx) => {
      const created = await tx.clinicalAccessRule.create({
        data: {
          userId: parsedInput.userId,
          studyId: parsedInput.studyId,
          instrumentId: parsedInput.instrumentId,
          eventId: parsedInput.eventId,
          permission: parsedInput.permission,
          createdById: ctx.user.id,
        },
        include: {
          user: { select: { name: true, email: true } },
          instrument: { select: { name: true } },
          event: { select: { name: true } },
        },
      });

      await logClinicalAuditEvent({
        db: tx,
        event: AuditEvent.CLINICAL_ACCESS_RULE_CREATED,
        actorId: ctx.user.id,
        projectId: project.id,
        resourceId: created.id,
        resourceType: "ClinicalAccessRule",
        metadata: {
          targetUserId: created.userId,
          targetUserEmail: created.user.email,
          instrumentId: created.instrumentId,
          eventId: created.eventId,
          permission: created.permission,
        },
      });

      return created;
    });

    return rule;
  });

export const updateClinicalAccessRuleAction = authenticatedActionClient
  .inputSchema(ZEnvironmentId.merge(ZUpdateClinicalAccessRule))
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });
    await assertContiniumFeature("clinicalAccessRules");

    const { project, study } = await getClinicalStudyContext(parsedInput.environmentId);

    const rule = await prisma.clinicalAccessRule.findUnique({
      where: { id: parsedInput.id, studyId: study.id },
    });

    if (!rule) {
      throw new ValidationError("Rule not found");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.clinicalAccessRule.update({
        where: { id: parsedInput.id },
        data: { permission: parsedInput.permission },
        include: {
          user: { select: { name: true, email: true } },
          instrument: { select: { name: true } },
          event: { select: { name: true } },
        },
      });

      await logClinicalAuditEvent({
        db: tx,
        event: AuditEvent.CLINICAL_ACCESS_RULE_UPDATED,
        actorId: ctx.user.id,
        projectId: project.id,
        resourceId: result.id,
        resourceType: "ClinicalAccessRule",
        metadata: {
          targetUserId: result.userId,
          targetUserEmail: result.user.email,
          instrumentId: result.instrumentId,
          eventId: result.eventId,
          previousPermission: rule.permission,
          newPermission: result.permission,
        },
      });

      return result;
    });

    return updated;
  });

export const deleteClinicalAccessRuleAction = authenticatedActionClient
  .inputSchema(ZEnvironmentId.merge(ZDeleteClinicalAccessRule))
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });
    await assertContiniumFeature("clinicalAccessRules");

    const { project, study } = await getClinicalStudyContext(parsedInput.environmentId);

    const rule = await prisma.clinicalAccessRule.findUnique({
      where: { id: parsedInput.id, studyId: study.id },
      include: {
        user: { select: { email: true } },
      },
    });

    if (!rule) {
      throw new ValidationError("Rule not found");
    }

    await prisma.$transaction(async (tx) => {
      await tx.clinicalAccessRule.delete({
        where: { id: parsedInput.id },
      });

      await logClinicalAuditEvent({
        db: tx,
        event: AuditEvent.CLINICAL_ACCESS_RULE_DELETED,
        actorId: ctx.user.id,
        projectId: project.id,
        resourceId: rule.id,
        resourceType: "ClinicalAccessRule",
        metadata: {
          targetUserId: rule.userId,
          targetUserEmail: rule.user.email,
          instrumentId: rule.instrumentId,
          eventId: rule.eventId,
          previousPermission: rule.permission,
        },
      });
    });

    return { success: true };
  });

export const bulkUpdateClinicalAccessRulesAction = authenticatedActionClient
  .inputSchema(
    ZEnvironmentId.extend({
      rules: z.array(
        ZCreateClinicalAccessRule.extend({
          id: z.string().cuid2().optional(),
        })
      ),
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });
    await assertContiniumFeature("clinicalAccessRules");

    const { project, study } = await getClinicalStudyContext(parsedInput.environmentId);

    const results = await prisma.$transaction(async (tx) => {
      return Promise.all(
        parsedInput.rules.map(async (ruleInput) => {
          if (ruleInput.id) {
            const existing = await tx.clinicalAccessRule.findUnique({
              where: { id: ruleInput.id, studyId: study.id },
            });
            if (!existing) {
              throw new ValidationError(`Rule ${ruleInput.id} not found in this study`);
            }
            const updated = await tx.clinicalAccessRule.update({
              where: { id: ruleInput.id },
              data: { permission: ruleInput.permission },
            });
            await logClinicalAuditEvent({
              db: tx,
              event: AuditEvent.CLINICAL_ACCESS_RULE_UPDATED,
              actorId: ctx.user.id,
              projectId: project.id,
              resourceId: updated.id,
              resourceType: "ClinicalAccessRule",
              metadata: {
                previousPermission: existing.permission,
                newPermission: updated.permission,
              },
            });
            return updated;
          } else {
            const created = await tx.clinicalAccessRule.create({
              data: {
                userId: ruleInput.userId,
                studyId: ruleInput.studyId,
                instrumentId: ruleInput.instrumentId,
                eventId: ruleInput.eventId,
                permission: ruleInput.permission,
                createdById: ctx.user.id,
              },
            });
            await logClinicalAuditEvent({
              db: tx,
              event: AuditEvent.CLINICAL_ACCESS_RULE_CREATED,
              actorId: ctx.user.id,
              projectId: project.id,
              resourceId: created.id,
              resourceType: "ClinicalAccessRule",
              metadata: { permission: created.permission },
            });
            return created;
          }
        })
      );
    });

    return results;
  });
