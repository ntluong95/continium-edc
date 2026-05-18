import "server-only";
import { type Prisma } from "@prisma/client";
import { prisma } from "@continium/database";
import { ValidationError } from "@continium/types/errors";
import { getProjectByEnvironmentId } from "@/lib/project/service";
import { assertClinicalProject } from "@/modules/clinical/lib/assert-clinical-project";
import { ensureStudyForProject } from "@/modules/clinical/protocol/lib/study-queries";

type TDbClient = Prisma.TransactionClient | typeof prisma;

export const getClinicalInstrumentContext = async (environmentId: string) => {
  const project = await getProjectByEnvironmentId(environmentId);
  assertClinicalProject(project);

  const study = await ensureStudyForProject(project.id, project.name);
  return { project, study };
};

export const assertInstrumentBelongsToStudy = async (
  instrumentId: string,
  studyId: string,
  db: TDbClient = prisma
) => {
  const instrument = await db.instrument.findFirst({
    where: { id: instrumentId, studyId },
    include: {
      fields: {
        orderBy: { position: "asc" },
      },
      survey: {
        select: { id: true, name: true, blocks: true },
      },
      _count: {
        select: { eventBindings: true },
      },
    },
  });

  if (!instrument) {
    throw new ValidationError("Instrument not found for this clinical workspace.");
  }

  return instrument;
};

export const assertPublishedInstrumentBelongsToStudy = async (
  instrumentId: string,
  studyId: string,
  db: TDbClient = prisma
) => {
  const instrument = await db.instrument.findFirst({
    where: { id: instrumentId, studyId, status: "PUBLISHED" },
    select: {
      id: true,
      studyId: true,
      surveyId: true,
      version: true,
      status: true,
      displayName: true,
    },
  });

  if (!instrument) {
    throw new ValidationError("Published instrument not found for this clinical workspace.");
  }

  return instrument;
};
