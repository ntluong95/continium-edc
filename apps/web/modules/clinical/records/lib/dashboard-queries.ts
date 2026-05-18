import "server-only";
import { getServerSession } from "next-auth";
import { cache } from "react";
import { prisma, withDagContextAsync } from "@continium/database";
import { authOptions } from "@/modules/auth/lib/authOptions";
import { resolveDagContextForRequest } from "@/modules/clinical/subjects/lib/resolve-dag-context";
import { getClinicalStudyContext } from "@/modules/clinical/subjects/lib/subject-access";

export const getRecordStatusDashboard = cache(async (environmentId: string, armId: string) => {
  const [{ study }, session] = await Promise.all([
    getClinicalStudyContext(environmentId),
    getServerSession(authOptions),
  ]);
  const dagContext = await resolveDagContextForRequest(
    session?.user?.id ?? null,
    environmentId,
    study.id
  );

  const loadDashboard = async () => {
  const arm = await prisma.arm.findFirst({
    where: { id: armId, studyId: study.id },
    select: {
      id: true,
      name: true,
      events: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          name: true,
          dayOffset: true,
          instruments: {
            select: {
              instrumentId: true,
              instrument: {
                select: {
                  id: true,
                  survey: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!arm) return null;

  const subjects = await prisma.subject.findMany({
    where: { studyId: study.id, enrollments: { some: { armId } } },
    orderBy: { externalId: "asc" },
    select: {
      id: true,
      externalId: true,
      enrollments: { where: { armId }, take: 1, select: { status: true } },
    },
  });

  const subjectIds = subjects.map((s) => s.id);
  const instrumentIds = arm.events.flatMap((e) => e.instruments.map((ei) => ei.instrumentId));
  const eventIds = arm.events.map((e) => e.id);

  const records =
    subjectIds.length > 0 && instrumentIds.length > 0
      ? await prisma.record.findMany({
          where: {
            subjectId: { in: subjectIds },
            eventId: { in: eventIds },
            instrumentId: { in: instrumentIds },
            instance: 1,
          },
          select: { subjectId: true, eventId: true, instrumentId: true, status: true },
        })
      : [];

  // Build lookup: `${subjectId}:${eventId}:${instrumentId}` → status
  const statusLookup: Record<string, string> = {};
  for (const r of records) {
    statusLookup[`${r.subjectId}:${r.eventId}:${r.instrumentId}`] = r.status;
  }

  return { arm, subjects, statusLookup };
  };

  return withDagContextAsync(dagContext, loadDashboard);
});

export type TDashboardData = NonNullable<Awaited<ReturnType<typeof getRecordStatusDashboard>>>;
