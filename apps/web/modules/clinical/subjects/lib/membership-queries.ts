"use server";

import { prisma } from "@continium/database";
import { getClinicalStudyContext } from "./subject-access";

export async function getMembershipsForStudy(environmentId: string, _studyId: string) {
  const { project } = await getClinicalStudyContext(environmentId);

  const memberships = await prisma.membership.findMany({
    where: { organizationId: project.organizationId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ user: { name: "asc" } }],
  });

  return memberships.map((m) => ({
    id: m.userId,
    userId: m.userId,
    userName: m.user.name,
    userEmail: m.user.email,
    role: m.role,
    roleName: String(m.role),
  }));
}
