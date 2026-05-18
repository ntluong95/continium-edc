import "server-only";

import { withDagContext } from "@continium/database";
import { AuthorizationError } from "@continium/types/errors";
import { assertClinicalProject } from "@/modules/clinical/lib/assert-clinical-project";
import { getUserDagIds } from "@/modules/clinical/dag/lib/dag-queries";
import { ensureStudyForProject } from "@/modules/clinical/protocol/lib/study-queries";
import { getEnvironmentAuth } from "@/modules/environments/lib/utils";

interface ClinicalAuditAccessOptions {
  requireManageAccess?: boolean;
}

export const getClinicalAuditAccess = async (
  environmentId: string,
  options: ClinicalAuditAccessOptions = {}
) => {
  const auth = await getEnvironmentAuth(environmentId);
  assertClinicalProject(auth.project);

  const canManageAuditLog = auth.isOwner || auth.isManager || auth.hasManageAccess;
  const canReadAuditLog =
    canManageAuditLog || auth.hasReadAccess || auth.hasReadWriteAccess;

  if (!canReadAuditLog) {
    throw new AuthorizationError("You do not have access to this clinical audit trail.");
  }

  if (options.requireManageAccess && !canManageAuditLog) {
    throw new AuthorizationError("Audit export requires manager access.");
  }

  const study = await ensureStudyForProject(auth.project.id, auth.project.name);
  const userDagIds = canManageAuditLog ? [] : await getUserDagIds(auth.session.user.id, study.id);

  return {
    ...auth,
    study,
    dagScope: {
      userDagIds,
      // D1: no-membership default = DENY. Only managers bypass DAG filtering.
      bypass: canManageAuditLog,
    },
  };
};

export const withClinicalDagScope = <T>(
  dagScope: { userDagIds: string[]; bypass: boolean },
  fn: () => Promise<T>
) => withDagContext(dagScope, fn);
