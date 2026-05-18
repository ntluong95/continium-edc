import { beforeEach, describe, expect, test, vi } from "vitest";
import { AuthorizationError } from "@continium/types/errors";
import { getUserDagIds } from "@/modules/clinical/dag/lib/dag-queries";
import { ensureStudyForProject } from "@/modules/clinical/protocol/lib/study-queries";
import { getEnvironmentAuth } from "@/modules/environments/lib/utils";
import { getClinicalAuditAccess } from "./audit-access";

vi.mock("@/modules/environments/lib/utils", () => ({
  getEnvironmentAuth: vi.fn(),
}));

vi.mock("@/modules/clinical/protocol/lib/study-queries", () => ({
  ensureStudyForProject: vi.fn(),
}));

vi.mock("@/modules/clinical/dag/lib/dag-queries", () => ({
  getUserDagIds: vi.fn(),
}));

vi.mock("@/modules/clinical/lib/assert-clinical-project", () => ({
  assertClinicalProject: vi.fn(),
}));

const baseAuth = {
  environment: { id: "env1" },
  project: { id: "proj1", name: "Clinical Trial", kind: "CLINICAL" },
  organization: { id: "org1" },
  session: { user: { id: "user1" } },
  currentUserMembership: { role: "member" },
  projectPermission: "read",
  isMember: true,
  isOwner: false,
  isManager: false,
  isBilling: false,
  hasReadAccess: true,
  hasReadWriteAccess: false,
  hasManageAccess: false,
  isReadOnly: true,
} as const;

describe("getClinicalAuditAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getEnvironmentAuth).mockResolvedValue(baseAuth as never);
    vi.mocked(ensureStudyForProject).mockResolvedValue({
      id: "study1",
      projectId: "proj1",
      name: "Clinical Trial",
    } as never);
    vi.mocked(getUserDagIds).mockResolvedValue(["dag-a"]);
  });

  test("allows owners without explicit team permission to view the audit trail", async () => {
    vi.mocked(getEnvironmentAuth).mockResolvedValue({
      ...baseAuth,
      currentUserMembership: { role: "owner" },
      isMember: false,
      isOwner: true,
      hasReadAccess: false,
      hasReadWriteAccess: false,
      hasManageAccess: false,
      isReadOnly: false,
    } as never);

    const access = await getClinicalAuditAccess("env1");

    expect(access.project.id).toBe("proj1");
    expect(access.dagScope.bypass).toBe(true);
    expect(getUserDagIds).not.toHaveBeenCalled();
  });

  test("allows managers to export even without team manage permission", async () => {
    vi.mocked(getEnvironmentAuth).mockResolvedValue({
      ...baseAuth,
      currentUserMembership: { role: "manager" },
      isMember: false,
      isManager: true,
      hasReadAccess: false,
      hasReadWriteAccess: false,
      hasManageAccess: false,
      isReadOnly: false,
    } as never);

    const access = await getClinicalAuditAccess("env1", { requireManageAccess: true });

    expect(access.dagScope.bypass).toBe(true);
    expect(getUserDagIds).not.toHaveBeenCalled();
  });

  test("denies members with no clinical project permission", async () => {
    vi.mocked(getEnvironmentAuth).mockResolvedValue({
      ...baseAuth,
      projectPermission: null,
      hasReadAccess: false,
      hasReadWriteAccess: false,
      hasManageAccess: false,
    } as never);

    await expect(getClinicalAuditAccess("env1")).rejects.toThrow(AuthorizationError);
  });
});
