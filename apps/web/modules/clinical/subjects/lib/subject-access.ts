import "server-only";
import { prisma } from "@continium/database";
import { ValidationError } from "@continium/types/errors";
import { getProjectByEnvironmentId } from "@/lib/project/service";
import { assertClinicalProject } from "@/modules/clinical/lib/assert-clinical-project";
import { ensureStudyForProject } from "@/modules/clinical/protocol/lib/study-queries";
import { getUserDagIds } from "@/modules/clinical/dag/lib/dag-queries";
import { getEnvironmentAuth } from "@/modules/environments/lib/utils";

export const getClinicalStudyContext = async (environmentId: string) => {
  const project = await getProjectByEnvironmentId(environmentId);
  assertClinicalProject(project);

  const study = await ensureStudyForProject(project.id, project.name);
  return { project, study };
};

export const assertArmBelongsToStudy = async (armId: string, studyId: string, db: unknown = prisma) => {
  const armDb = db as Pick<typeof prisma, "arm">;
  const arm = await armDb.arm.findFirst({
    where: { id: armId, studyId },
    select: { id: true, studyId: true, name: true },
  });

  if (!arm) {
    throw new ValidationError("Arm not found for this study.");
  }

  return arm;
};

export const assertSubjectBelongsToStudy = async (
  subjectId: string,
  studyId: string,
  db: unknown = prisma
) => {
  const subjectDb = db as Pick<typeof prisma, "subject">;
  const subject = await subjectDb.subject.findFirst({
    where: { id: subjectId, studyId },
    select: { id: true, studyId: true, contactId: true, externalId: true },
  });

  if (!subject) {
    throw new ValidationError("Subject not found for this study.");
  }

  return subject;
};

export const assertEnrollmentBelongsToStudy = async (
  enrollmentId: string,
  studyId: string,
  db: unknown = prisma
) => {
  const enrollmentDb = db as Pick<typeof prisma, "enrollment">;
  const enrollment = await enrollmentDb.enrollment.findFirst({
    where: { id: enrollmentId, subject: { studyId } },
    include: {
      arm: { select: { id: true, name: true, studyId: true } },
      subject: { select: { id: true, externalId: true, studyId: true } },
    },
  });

  if (!enrollment) {
    throw new ValidationError("Enrollment not found for this study.");
  }

  return enrollment;
};

export const assertContactBelongsToEnvironment = async (
  contactId: string,
  environmentId: string,
  db: unknown = prisma
) => {
  const contactDb = db as Pick<typeof prisma, "contact">;
  const contact = await contactDb.contact.findFirst({
    where: { id: contactId, environmentId },
    select: { id: true },
  });

  if (!contact) {
    throw new ValidationError("Contact not found for this environment.");
  }

  return contact;
};

/**
 * Returns the current user's clinical data access context.
 * Owners and managers are global admins (bypass DAG filtering).
 * All other members are restricted to their DAG memberships.
 * This is the single source of truth for DAG-based access control.
 */
export const getUserClinicalAccessForUser = async (
  userId: string,
  environmentId: string,
  studyId: string
): Promise<{ isGlobalAdmin: boolean; userDagIds: string[] }> => {
  const auth = await getEnvironmentAuth(environmentId);
  const isGlobalAdmin = auth.isOwner || auth.isManager || auth.hasManageAccess;
  if (isGlobalAdmin) return { isGlobalAdmin: true, userDagIds: [] };
  const userDagIds = await getUserDagIds(userId, studyId);
  return { isGlobalAdmin: false, userDagIds };
};
