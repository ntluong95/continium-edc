import "server-only";
import { prisma } from "@continium/database";
import { getClinicalStudyContext } from "@/modules/clinical/subjects/lib/subject-access";

const selectDagSummary = {
  id: true,
  name: true,
  code: true,
  createdAt: true,
  _count: { select: { members: true, enrollments: true } },
} as const;

const selectMember = {
  userId: true,
  addedAt: true,
  user: { select: { id: true, name: true, email: true } },
} as const;

/** All DAGs for a study, ordered by name. */
export const getDagsForStudy = async (environmentId: string) => {
  const { study } = await getClinicalStudyContext(environmentId);
  return prisma.dataAccessGroup.findMany({
    where: { studyId: study.id },
    select: selectDagSummary,
    orderBy: { name: "asc" },
  });
};

export type TDagSummary = Awaited<ReturnType<typeof getDagsForStudy>>[number];

/** Single DAG with its members. Returns null if not found or not in the study. */
export const getDagDetail = async (environmentId: string, dagId: string) => {
  const { study } = await getClinicalStudyContext(environmentId);
  return prisma.dataAccessGroup.findFirst({
    where: { id: dagId, studyId: study.id },
    select: {
      ...selectDagSummary,
      members: { select: selectMember, orderBy: { user: { name: "asc" } } },
    },
  });
};

export type TDagDetail = Awaited<ReturnType<typeof getDagDetail>>;

/**
 * Load the DAG IDs for a user within a study.
 * Used to populate DagContext for the DAG middleware.
 *
 * EDGE-5 (Phase 2): Call sites must wrap their Prisma reads with:
 *   const dagIds = await getUserDagIds(userId, studyId);
 *   withDagContext({ userDagIds: dagIds, bypass: dagIds.length === 0 }, async () => { ... });
 * Until that wiring is in place the middleware is in place but inactive per request.
 */
export const getUserDagIds = async (userId: string, studyId: string): Promise<string[]> => {
  const memberships = await prisma.dagMember.findMany({
    where: { userId, dag: { studyId } },
    select: { dagId: true },
  });
  return memberships.map((m) => m.dagId);
};

/** Org members eligible for DAG membership (accepted, ordered by name). */
export const getOrgMembersForEnvironment = async (environmentId: string) => {
  const { project } = await getClinicalStudyContext(environmentId);
  const memberships = await prisma.membership.findMany({
    where: { organizationId: project.organizationId, accepted: true },
    select: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { user: { name: "asc" } },
  });
  return memberships.map((m) => m.user);
};

export type TOrgMember = Awaited<ReturnType<typeof getOrgMembersForEnvironment>>[number];
