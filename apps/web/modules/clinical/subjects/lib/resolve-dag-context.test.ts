import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@continium/database", async () => {
  const actual = await vi.importActual<typeof import("@continium/database")>(
    "@continium/database"
  );
  return {
    ...actual,
    prisma: {
      dataAccessGroup: {
        count: vi.fn(),
      },
    },
  };
});

vi.mock("@/modules/clinical/subjects/lib/subject-access", () => ({
  getUserClinicalAccessForUser: vi.fn(),
}));

const importHelper = () => import("./resolve-dag-context");

describe("resolveDagContextForRequest", () => {
  afterEach(() => vi.clearAllMocks());

  test("BYPASS when no actor (system path)", async () => {
    const { resolveDagContextForRequest } = await importHelper();
    const ctx = await resolveDagContextForRequest(null, "env_1", "study_1");
    expect(ctx).toEqual({ userDagIds: null, bypass: true });
  });

  test("BYPASS when study has no DAGs", async () => {
    const { prisma } = await import("@continium/database");
    (prisma.dataAccessGroup.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(0);
    const { resolveDagContextForRequest } = await importHelper();

    const ctx = await resolveDagContextForRequest("user_1", "env_1", "study_1");
    expect(ctx.bypass).toBe(true);
    expect(ctx.userDagIds).toBeNull();
  });

  test("BYPASS when actor is a global admin", async () => {
    const { prisma } = await import("@continium/database");
    (prisma.dataAccessGroup.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(2);
    const { getUserClinicalAccessForUser } = await import(
      "@/modules/clinical/subjects/lib/subject-access"
    );
    (getUserClinicalAccessForUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      isGlobalAdmin: true,
      userDagIds: [],
    });

    const { resolveDagContextForRequest } = await importHelper();
    const ctx = await resolveDagContextForRequest("user_1", "env_1", "study_1");
    expect(ctx.bypass).toBe(true);
  });

  test("scoped context for a non-admin actor with DAG memberships", async () => {
    const { prisma } = await import("@continium/database");
    (prisma.dataAccessGroup.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(2);
    const { getUserClinicalAccessForUser } = await import(
      "@/modules/clinical/subjects/lib/subject-access"
    );
    (getUserClinicalAccessForUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      isGlobalAdmin: false,
      userDagIds: ["dag_a", "dag_b"],
    });

    const { resolveDagContextForRequest } = await importHelper();
    const ctx = await resolveDagContextForRequest("user_1", "env_1", "study_1");
    expect(ctx).toEqual({ userDagIds: ["dag_a", "dag_b"], bypass: false });
  });

  test("non-admin with zero DAG memberships → empty array (deny-by-default)", async () => {
    const { prisma } = await import("@continium/database");
    (prisma.dataAccessGroup.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(3);
    const { getUserClinicalAccessForUser } = await import(
      "@/modules/clinical/subjects/lib/subject-access"
    );
    (getUserClinicalAccessForUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      isGlobalAdmin: false,
      userDagIds: [],
    });

    const { resolveDagContextForRequest } = await importHelper();
    const ctx = await resolveDagContextForRequest("user_1", "env_1", "study_1");
    expect(ctx).toEqual({ userDagIds: [], bypass: false });
  });
});
