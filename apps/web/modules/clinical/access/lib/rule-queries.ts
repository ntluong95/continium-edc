"use server";

import { prisma } from "@continium/database";

export async function getClinicalAccessRulesForStudy(studyId: string) {
  return prisma.clinicalAccessRule.findMany({
    where: { studyId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      instrument: {
        select: { id: true, name: true },
      },
      event: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ userId: "asc" }, { instrumentId: "asc" }, { eventId: "asc" }],
  });
}

export async function getClinicalAccessRulesForUser(userId: string, studyId: string) {
  return prisma.clinicalAccessRule.findMany({
    where: { userId, studyId },
    include: {
      instrument: {
        select: { id: true, name: true },
      },
      event: {
        select: { id: true, name: true },
      },
    },
  });
}

export async function getClinicalAccessRulesForMembership(
  userId: string,
  studyId: string
) {
  const study = await prisma.study.findUnique({
    where: { id: studyId },
    select: { project: { select: { organizationId: true } } },
  });

  if (!study) return null;

  const [membership, rules] = await Promise.all([
    prisma.membership.findFirst({
      where: { userId, organizationId: study.project.organizationId },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.clinicalAccessRule.findMany({
      where: { userId, studyId },
      include: {
        instrument: { select: { id: true, name: true } },
        event: { select: { id: true, name: true } },
      },
    }),
  ]);

  if (!membership) return null;

  return { membership, rules };
}

export async function getInstrumentPermissionsForStudy(studyId: string) {
  const instruments = await prisma.instrument.findMany({
    where: { studyId },
    select: { id: true, name: true },
  });

  const events = await prisma.event.findMany({
    where: { arm: { studyId } },
    select: { id: true, name: true },
  });

  const rules = await prisma.clinicalAccessRule.findMany({
    where: { studyId },
    select: {
      userId: true,
      instrumentId: true,
      eventId: true,
      permission: true,
    },
  });

  return {
    instruments,
    events,
    rules,
  };
}