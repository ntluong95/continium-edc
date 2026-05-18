import "server-only";
import { BYPASS_DAG_CONTEXT, type DagContext, prisma } from "@continium/database";
import { getUserClinicalAccessForUser } from "@/modules/clinical/subjects/lib/subject-access";

/**
 * Resolve the per-request DAG scope a clinical loader should run under.
 *
 * Returns BYPASS when the study has no DAGs at all (defence in depth still
 * passes through every read), or when no actor is available, or when the
 * actor is a global admin (owner/manager/manage-access).
 *
 * Returns a scoped context with `userDagIds` for any other actor; an empty
 * array means "user has no DAG memberships" — the extension translates that
 * into `dagId IN ()` which matches zero rows, the correct deny-by-default
 * behaviour.
 *
 * Loaders should wrap their body in
 *   `withDagContextAsync(await resolveDagContextForRequest(...), loader)`
 * so reads of Record + Enrollment auto-scope without each call site having
 * to remember to pass a manual `dagId` filter. The wrapper composes
 * harmlessly with existing manual filters: both AND together.
 */
export const resolveDagContextForRequest = async (
  actorId: string | null,
  environmentId: string,
  studyId: string
): Promise<DagContext> => {
  if (!actorId) return BYPASS_DAG_CONTEXT;

  const dagCount = await prisma.dataAccessGroup.count({ where: { studyId } });
  if (dagCount === 0) return BYPASS_DAG_CONTEXT;

  const access = await getUserClinicalAccessForUser(actorId, environmentId, studyId);
  if (access.isGlobalAdmin) return BYPASS_DAG_CONTEXT;

  return { userDagIds: access.userDagIds, bypass: false };
};
