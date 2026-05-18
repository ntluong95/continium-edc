import "server-only";
import { cache } from "react";
import { prisma } from "@continium/database";

/** Full protocol tree — Study → Arms → Events → EventInstruments (+ Instrument version). */
export type TStudyTree = Awaited<ReturnType<typeof getStudyTree>>;
export type TProtocolStudy = NonNullable<TStudyTree>;

export const getStudyByProjectId = cache(async (projectId: string) => {
  return prisma.study.findUnique({ where: { projectId } });
});

export const ensureStudyForProject = async (projectId: string, projectName: string) => {
  return prisma.study.upsert({
    where: { projectId },
    update: {},
    create: {
      projectId,
      name: projectName || "Protocol",
    },
  });
};

export const getStudyTree = cache(async (projectId: string) => {
  return prisma.study.findUnique({
    where: { projectId },
    include: {
      arms: {
        orderBy: { position: "asc" },
        include: {
          events: {
            orderBy: { position: "asc" },
            include: {
              instruments: {
                include: {
                  instrument: {
                    select: {
                      id: true,
                      displayName: true,
                      version: true,
                      survey: { select: { id: true, name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
});
