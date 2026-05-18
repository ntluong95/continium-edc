"use server";

import { AuditEvent } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@continium/database";
import { ValidationError } from "@continium/types/errors";
import { authenticatedActionClient } from "@/lib/utils/action-client";
import { checkAuthorizationUpdated } from "@/lib/utils/action-client/action-client-middleware";
import { getOrganizationIdFromEnvironmentId } from "@/lib/utils/helper";
import { logClinicalAuditEvent } from "@/modules/clinical/subjects/lib/audit-events";
import { getClinicalStudyContext } from "@/modules/clinical/subjects/lib/subject-access";
import { assertInstrumentCanEnterData } from "./data-entry-eligibility";
import { ZWithEnvironment, dataPagePath } from "./record-action-helpers";
import { ZAddInstanceInput } from "./zod-schemas";

export const addInstanceAction = authenticatedActionClient
  .inputSchema(ZWithEnvironment.merge(z.object({ data: ZAddInstanceInput })))
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromEnvironmentId(parsedInput.environmentId);
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });

    const { project, study } = await getClinicalStudyContext(parsedInput.environmentId);

    const record = await prisma.$transaction(async (tx) => {
      const subject = await tx.subject.findFirst({
        where: { id: parsedInput.data.subjectId, studyId: study.id },
        include: { enrollments: { orderBy: { createdAt: "desc" }, take: 1 } },
      });
      if (!subject) throw new ValidationError("Subject not found for this study.");

      const binding = await tx.eventInstrument.findFirst({
        where: {
          eventId: parsedInput.data.eventId,
          instrumentId: parsedInput.data.instrumentId,
          repeating: true,
          event: { armId: subject.enrollments[0]?.armId, arm: { studyId: study.id } },
        },
        include: {
          instrument: {
            select: {
              id: true,
              status: true,
              surveyId: true,
              survey: { select: { status: true } },
            },
          },
        },
      });
      if (!binding) throw new ValidationError("This instrument is not repeatable for the subject event.");
      assertInstrumentCanEnterData(binding.instrument);

      const lockKey = `${subject.id}:${binding.eventId}:${binding.instrumentId}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
      const max = await tx.record.aggregate({
        where: { subjectId: subject.id, eventId: binding.eventId, instrumentId: binding.instrumentId },
        _max: { instance: true },
      });

      const created = await tx.record.create({
        data: {
          projectId: project.id,
          subjectId: subject.id,
          eventId: binding.eventId,
          instrumentId: binding.instrumentId,
          instance: (max._max.instance ?? 0) + 1,
        },
      });

      await logClinicalAuditEvent({
        db: tx,
        event: AuditEvent.RECORD_INSTANCE_ADDED,
        actorId: ctx.user.id,
        projectId: project.id,
        resourceId: created.id,
        resourceType: "Record",
        metadata: { subjectId: subject.id, eventId: binding.eventId, instrumentId: binding.instrumentId },
      });

      return created;
    });

    revalidatePath(dataPagePath(parsedInput.environmentId, record.subjectId));
    return record;
  });
