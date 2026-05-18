import "server-only";
import { prisma } from "@continium/database";
import { ValidationError } from "@continium/types/errors";
import { getProjectByEnvironmentId } from "@/lib/project/service";
import { assertClinicalProject } from "@/modules/clinical/lib/assert-clinical-project";

const assertMatch = (matches: boolean, message: string) => {
  if (!matches) {
    throw new ValidationError(message);
  }
};

export const getClinicalProjectForEnvironment = async (environmentId: string) => {
  const project = await getProjectByEnvironmentId(environmentId);
  assertClinicalProject(project);
  return project;
};

export const assertStudyBelongsToProject = async (studyId: string, projectId: string) => {
  const study = await prisma.study.findFirst({
    where: { id: studyId, projectId },
    select: { id: true },
  });

  assertMatch(Boolean(study), "Study not found for this clinical workspace.");
};

export const assertArmBelongsToProject = async (armId: string, projectId: string) => {
  const arm = await prisma.arm.findFirst({
    where: { id: armId, study: { projectId } },
    select: { id: true, studyId: true },
  });

  assertMatch(Boolean(arm), "Arm not found for this clinical workspace.");
  return arm;
};

export const assertArmBelongsToStudy = async (armId: string, studyId: string) => {
  const arm = await prisma.arm.findFirst({
    where: { id: armId, studyId },
    select: { id: true },
  });

  assertMatch(Boolean(arm), "Arm not found for this study.");
};

export const assertEventBelongsToProject = async (eventId: string, projectId: string) => {
  const event = await prisma.event.findFirst({
    where: { id: eventId, arm: { study: { projectId } } },
    select: { id: true, armId: true },
  });

  assertMatch(Boolean(event), "Event not found for this clinical workspace.");
  return event;
};

export const assertSurveyBelongsToEnvironment = async (surveyId: string, environmentId: string) => {
  const survey = await prisma.survey.findFirst({
    where: { id: surveyId, environmentId },
    select: { id: true },
  });

  assertMatch(Boolean(survey), "Survey not found for this environment.");
};

export const assertArmOrderingBelongsToStudy = async (studyId: string, orderedIds: string[]) => {
  const [arms, totalCount] = await Promise.all([
    prisma.arm.findMany({ where: { studyId, id: { in: orderedIds } }, select: { id: true } }),
    prisma.arm.count({ where: { studyId } }),
  ]);

  assertMatch(arms.length === orderedIds.length, "One or more arms do not belong to this study.");
  assertMatch(orderedIds.length === totalCount, "Reorder list must include all arms in the study.");
};

export const assertEventOrderingBelongsToArm = async (armId: string, orderedIds: string[]) => {
  const [events, totalCount] = await Promise.all([
    prisma.event.findMany({ where: { armId, id: { in: orderedIds } }, select: { id: true } }),
    prisma.event.count({ where: { armId } }),
  ]);

  assertMatch(events.length === orderedIds.length, "One or more events do not belong to this arm.");
  assertMatch(orderedIds.length === totalCount, "Reorder list must include all events in the arm.");
};
