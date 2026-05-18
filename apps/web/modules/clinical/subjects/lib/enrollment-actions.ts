"use server";

import { AuditEvent, EnrollmentStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@continium/database";
import { ValidationError } from "@continium/types/errors";
import { authenticatedActionClient } from "@/lib/utils/action-client";
import { checkAuthorizationUpdated } from "@/lib/utils/action-client/action-client-middleware";
import { getOrganizationIdFromEnvironmentId } from "@/lib/utils/helper";
import { logClinicalAuditEvent } from "./audit-events";
import { REASON_REQUIRED_STATUSES, canTransitionEnrollment } from "./enrollment-state-machine";
import { assertEnrollmentBelongsToStudy, getClinicalStudyContext } from "./subject-access";
import { ZEnrollmentActionInput, ZEnrollmentTransitionInput } from "./zod-schemas";

const ZWithEnvironment = z.object({ environmentId: z.string().cuid() });

const transitionEnrollment = async ({
  actorId,
  enrollmentId,
  projectId,
  reason,
  studyId,
  toStatus,
}: {
  actorId: string;
  enrollmentId: string;
  projectId: string;
  reason?: string;
  studyId: string;
  toStatus: EnrollmentStatus;
}) => {
  const enrollment = await assertEnrollmentBelongsToStudy(enrollmentId, studyId);

  if (!canTransitionEnrollment(enrollment.status, toStatus)) {
    throw new ValidationError(`Cannot transition enrollment from ${enrollment.status} to ${toStatus}.`);
  }

  if (REASON_REQUIRED_STATUSES.includes(toStatus) && !reason?.trim()) {
    throw new ValidationError("Reason is required for this status transition.");
  }

  return prisma.$transaction(async (tx) => {
    const updatedEnrollment = await tx.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: toStatus,
        enrolledAt:
          toStatus === EnrollmentStatus.ENROLLED && !enrollment.enrolledAt ? new Date() : enrollment.enrolledAt,
        completedAt: toStatus === EnrollmentStatus.COMPLETED ? new Date() : enrollment.completedAt,
        withdrawalReason:
          toStatus === EnrollmentStatus.WITHDRAWN ? reason?.trim() ?? null : enrollment.withdrawalReason,
      },
    });

    await tx.enrollmentEvent.create({
      data: {
        enrollmentId: enrollment.id,
        fromStatus: enrollment.status,
        toStatus,
        byUserId: actorId,
        reason: reason?.trim() || undefined,
      },
    });

    await logClinicalAuditEvent({
      db: tx,
      event: AuditEvent.ENROLLMENT_TRANSITIONED,
      actorId,
      projectId,
      resourceId: enrollment.id,
      resourceType: "Enrollment",
      metadata: {
        subjectId: enrollment.subject.id,
        armId: enrollment.arm.id,
        fromStatus: enrollment.status,
        toStatus,
        reason: reason?.trim() || null,
      },
    });

    return updatedEnrollment;
  });
};

export const enrollSubjectAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZEnrollmentActionInput })))
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });

    const { project, study } = await getClinicalStudyContext(parsedInput.environmentId);
    return transitionEnrollment({
      actorId: ctx.user.id,
      enrollmentId: parsedInput.data.enrollmentId,
      projectId: project.id,
      studyId: study.id,
      toStatus: EnrollmentStatus.ENROLLED,
    });
  });

export const transitionEnrollmentAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZEnrollmentTransitionInput })))
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });

    const { project, study } = await getClinicalStudyContext(parsedInput.environmentId);
    return transitionEnrollment({
      actorId: ctx.user.id,
      enrollmentId: parsedInput.data.enrollmentId,
      projectId: project.id,
      reason: parsedInput.data.reason,
      studyId: study.id,
      toStatus: parsedInput.data.toStatus,
    });
  });
