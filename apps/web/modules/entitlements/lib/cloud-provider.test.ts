import { beforeEach, describe, expect, test, vi } from "vitest";
import type { TOrganizationBilling } from "@continium/types/organizations";
import { getCloudBillingAndLicense } from "@/modules/billing/lib/cloud-license-source";
import { getCloudOrganizationEntitlementsContext } from "./cloud-provider";

vi.mock("server-only", () => ({}));

vi.mock("@continium/logger", () => ({
  logger: { warn: vi.fn() },
}));

vi.mock("@/modules/billing/lib/cloud-license-source", () => ({
  getCloudBillingAndLicense: vi.fn(),
}));

const mockRead = vi.mocked(getCloudBillingAndLicense);

const DEFAULT_BILLING = {
  limits: { projects: 1, monthly: { responses: 250 } },
  stripeCustomerId: null,
  usageCycleAnchor: null,
} as TOrganizationBilling;

const LICENSE_SNAPSHOT = { status: "no-license" as const, features: null, active: false };

const createBillingFixture = (overrides: Partial<TOrganizationBilling> = {}): TOrganizationBilling => ({
  stripeCustomerId: null,
  limits: {
    projects: null,
    monthly: {
      responses: null,
    },
  },
  usageCycleAnchor: null,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCloudOrganizationEntitlementsContext", () => {
  test("returns default entitlements when billing is null", async () => {
    mockRead.mockResolvedValue({ billing: null, defaultBilling: DEFAULT_BILLING, license: LICENSE_SNAPSHOT });

    const result = await getCloudOrganizationEntitlementsContext("org1");

    expect(result).toEqual({
      organizationId: "org1",
      source: "cloud_stripe",
      features: [],
      limits: { projects: 1, monthlyResponses: 250 },
      licenseStatus: "no-license",
      licenseFeatures: null,
      stripeCustomerId: null,
      subscriptionStatus: null,
      usageCycleAnchor: null,
    });
  });

  test("returns context with billing data", async () => {
    const usageCycleAnchor = new Date("2025-01-01");
    mockRead.mockResolvedValue({
      billing: createBillingFixture({
        stripeCustomerId: "cus_1",
        limits: { projects: 5, monthly: { responses: 1000 } },
        usageCycleAnchor,
        stripe: { features: ["rbac", "spam-protection"], plan: "pro" },
      }),
      defaultBilling: DEFAULT_BILLING,
      license: LICENSE_SNAPSHOT,
    });

    const result = await getCloudOrganizationEntitlementsContext("org1");

    expect(result).toEqual({
      organizationId: "org1",
      source: "cloud_stripe",
      features: ["rbac", "spam-protection"],
      limits: { projects: 5, monthlyResponses: 1000 },
      licenseStatus: "no-license",
      licenseFeatures: null,
      stripeCustomerId: "cus_1",
      subscriptionStatus: null,
      usageCycleAnchor,
    });
  });

  test("handles missing stripe features and limits gracefully", async () => {
    mockRead.mockResolvedValue({
      billing: createBillingFixture({ stripe: null as any }),
      defaultBilling: DEFAULT_BILLING,
      license: LICENSE_SNAPSHOT,
    });

    const result = await getCloudOrganizationEntitlementsContext("org1");

    expect(result.features).toEqual([]);
    expect(result.limits).toEqual({ projects: null, monthlyResponses: null });
    expect(result.stripeCustomerId).toBeNull();
    expect(result.subscriptionStatus).toBeNull();
    expect(result.usageCycleAnchor).toBeNull();
  });

  test("parses string usageCycleAnchor to Date", async () => {
    mockRead.mockResolvedValue({
      billing: createBillingFixture({
        usageCycleAnchor: "2025-06-15T00:00:00.000Z" as unknown as Date,
        stripe: null as any,
      }),
      defaultBilling: DEFAULT_BILLING,
      license: LICENSE_SNAPSHOT,
    });

    const result = await getCloudOrganizationEntitlementsContext("org1");

    expect(result.usageCycleAnchor).toBeInstanceOf(Date);
  });

  test("filters out invalid feature keys from stripe", async () => {
    mockRead.mockResolvedValue({
      billing: createBillingFixture({
        stripe: { features: ["rbac", "invalid-feature-xyz"] },
      }),
      defaultBilling: DEFAULT_BILLING,
      license: LICENSE_SNAPSHOT,
    });

    const result = await getCloudOrganizationEntitlementsContext("org1");

    expect(result.features).toEqual(["rbac"]);
  });

  test("exposes subscription status from billing stripe snapshot", async () => {
    mockRead.mockResolvedValue({
      billing: createBillingFixture({
        stripeCustomerId: "cus_1",
        limits: { projects: 5, monthly: { responses: 1000 } },
        stripe: { features: ["follow-ups"], subscriptionStatus: "trialing" },
      }),
      defaultBilling: DEFAULT_BILLING,
      license: LICENSE_SNAPSHOT,
    });

    const result = await getCloudOrganizationEntitlementsContext("org1");

    expect(result.subscriptionStatus).toBe("trialing");
  });
});
