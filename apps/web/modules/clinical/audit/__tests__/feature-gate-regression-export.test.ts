/**
 * Clinical-seam regression: clinicalExports gate must close BEFORE any DB read.
 *
 * Asserts no data egress when the gate is closed — the export function
 * throws ContiniumFeatureDisabledError at the entrypoint and never calls
 * the audit DB. This is the security-critical property: gating is not just
 * UX, it's an access-control boundary.
 */
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@continium/database", () => ({
  prisma: {
    auditLog: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/modules/clinical/audit/lib/audit-access", () => ({
  getClinicalAuditAccess: vi.fn(),
}));

vi.mock("@/modules/clinical/subjects/lib/audit-events", () => ({
  logClinicalAuditEvent: vi.fn(),
}));

vi.mock("@/modules/clinical/audit/lib/audit-visibility", () => ({
  buildAuditWhereForScope: vi.fn(),
}));

vi.mock("@/modules/continium/licensing/lib/get-continium-entitlements", () => ({
  getContiniumEntitlements: vi.fn(),
}));

const { prisma } = await import("@continium/database");
const { getClinicalAuditAccess } = await import("@/modules/clinical/audit/lib/audit-access");
const { buildAuditWhereForScope } = await import("@/modules/clinical/audit/lib/audit-visibility");
const { getContiniumEntitlements } = await import(
  "@/modules/continium/licensing/lib/get-continium-entitlements"
);
const { exportAuditLogCsv } = await import("@/modules/clinical/audit/lib/audit-export");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("audit export feature gate (clinicalExports)", () => {
  test("throws and does NOT read DB when clinicalExports is disabled", async () => {
    vi.mocked(getContiniumEntitlements).mockResolvedValue({
      edition: "selfHosted",
      plan: "selfHosted",
      features: {
        clinicalEdc: true,
        clinicalTemplates: true,
        clinicalDataAccessGroups: true,
        clinicalAccessRules: true,
        clinicalAuditLog: true,
        clinicalResponseSync: true,
        clinicalExports: false,
        clinicalApiAccess: true,
      },
      source: "env",
      resolvedAt: new Date(),
    });

    await expect(exportAuditLogCsv("env1", {}, "actor1")).rejects.toMatchObject({
      name: "ContiniumFeatureDisabledError",
      code: "CONTINIUM_FEATURE_DISABLED",
    });

    // SECURITY: no audit-access lookup, no Prisma read, no event log.
    expect(vi.mocked(getClinicalAuditAccess)).not.toHaveBeenCalled();
    expect(vi.mocked(prisma.auditLog.findMany)).not.toHaveBeenCalled();
    expect(vi.mocked(buildAuditWhereForScope)).not.toHaveBeenCalled();
  });
});
