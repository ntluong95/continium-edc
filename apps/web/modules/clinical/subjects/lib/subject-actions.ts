"use server";

import { AuditEvent, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@continium/database";
import { ValidationError } from "@continium/types/errors";
import { authenticatedActionClient } from "@/lib/utils/action-client";
import { checkAuthorizationUpdated } from "@/lib/utils/action-client/action-client-middleware";
import { getOrganizationIdFromEnvironmentId } from "@/lib/utils/helper";
import { logClinicalAuditEvent } from "./audit-events";
import {
  assertArmBelongsToStudy,
  assertContactBelongsToEnvironment,
  assertSubjectBelongsToStudy,
  getClinicalStudyContext,
  getUserClinicalAccessForUser,
} from "./subject-access";
import { ZCreateSubjectInput, ZLinkSubjectContactInput } from "./zod-schemas";

const ZWithEnvironment = z.object({ environmentId: z.string().cuid() });

export const createSubjectAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZCreateSubjectInput })))
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });

    const { project, study } = await getClinicalStudyContext(parsedInput.environmentId);
    await assertArmBelongsToStudy(parsedInput.data.armId, study.id);

    if (parsedInput.data.contactId) {
      await assertContactBelongsToEnvironment(parsedInput.data.contactId, parsedInput.environmentId);
    }

    // DAG validation: if a DAG is specified, verify it belongs to this study and the actor can assign it.
    const assignedDagId = parsedInput.data.dagId ?? null;
    if (assignedDagId) {
      const dag = await prisma.dataAccessGroup.findFirst({
        where: { id: assignedDagId, studyId: study.id },
        select: { id: true },
      });
      if (!dag) throw new ValidationError("Data Access Group not found for this study.");

      const access = await getUserClinicalAccessForUser(ctx.user.id, parsedInput.environmentId, study.id);
      if (!access.isGlobalAdmin && !access.userDagIds.includes(assignedDagId)) {
        throw new ValidationError("You are not permitted to assign subjects to this DAG.");
      }
    }

    try {
      const subject = await prisma.$transaction(async (tx) => {
        const existing = await tx.subject.findFirst({
          where: { studyId: study.id, externalId: parsedInput.data.externalId },
          select: { id: true },
        });

        if (existing) {
          throw new ValidationError("Subject external ID already exists in this study.");
        }

        const createdSubject = await tx.subject.create({
          data: {
            studyId: study.id,
            externalId: parsedInput.data.externalId,
            contactId: parsedInput.data.contactId ?? null,
          },
        });

        const enrollment = await tx.enrollment.create({
          data: {
            subjectId: createdSubject.id,
            armId: parsedInput.data.armId,
            dagId: assignedDagId,
            status: "SCREENED",
          },
        });

        await tx.enrollmentEvent.create({
          data: {
            enrollmentId: enrollment.id,
            fromStatus: null,
            toStatus: "SCREENED",
            byUserId: ctx.user.id,
          },
        });

        await logClinicalAuditEvent({
          db: tx,
          event: AuditEvent.SUBJECT_CREATED,
          actorId: ctx.user.id,
          projectId: project.id,
          resourceId: createdSubject.id,
          resourceType: "Subject",
          metadata: { studyId: study.id, armId: parsedInput.data.armId, dagId: assignedDagId },
        });

        await logClinicalAuditEvent({
          db: tx,
          event: AuditEvent.ENROLLMENT_CREATED,
          actorId: ctx.user.id,
          projectId: project.id,
          resourceId: enrollment.id,
          resourceType: "Enrollment",
          metadata: {
            subjectId: createdSubject.id,
            armId: parsedInput.data.armId,
            status: "SCREENED",
          },
        });

        await logClinicalAuditEvent({
          db: tx,
          event: AuditEvent.ENROLLMENT_TRANSITIONED,
          actorId: ctx.user.id,
          projectId: project.id,
          resourceId: enrollment.id,
          resourceType: "Enrollment",
          metadata: {
            subjectId: createdSubject.id,
            armId: parsedInput.data.armId,
            fromStatus: null,
            toStatus: "SCREENED",
          },
        });

        return createdSubject;
      });

      return subject;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ValidationError("Subject external ID already exists in this study.");
      }

      throw error;
    }
  });

export const linkSubjectContactAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZLinkSubjectContactInput })))
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });

    const { project, study } = await getClinicalStudyContext(parsedInput.environmentId);
    await assertSubjectBelongsToStudy(parsedInput.data.subjectId, study.id);

    if (parsedInput.data.contactId) {
      await assertContactBelongsToEnvironment(parsedInput.data.contactId, parsedInput.environmentId);
    }

    const subject = await prisma.$transaction(async (tx) => {
      const updatedSubject = await tx.subject.update({
        where: { id: parsedInput.data.subjectId },
        data: { contactId: parsedInput.data.contactId ?? null },
      });

      await logClinicalAuditEvent({
        db: tx,
        event: AuditEvent.SUBJECT_CONTACT_LINKED,
        actorId: ctx.user.id,
        projectId: project.id,
        resourceId: updatedSubject.id,
        resourceType: "Subject",
        metadata: { contactId: parsedInput.data.contactId ?? null },
      });

      return updatedSubject;
    });

    return subject;
  });
