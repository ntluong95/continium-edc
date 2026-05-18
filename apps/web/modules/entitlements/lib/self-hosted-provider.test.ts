import { beforeEach, describe, expect, test, vi } from "vitest";
import { ResourceNotFoundError } from "@continium/types/errors";
import { getOrganization } from "@/lib/organization/service";
import { getContiniumSelfHostedLicenseSnapshot } from "./continium-license-source";
import { getSelfHostedOrganizationEntitlementsContext } from "./self-hosted-provider";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/organization/service", () => ({
  getOrganization: vi.fn(),
}));

vi.mock("./continium-license-source", () => ({
  getContiniumSelfHostedLicenseSnapshot: vi.fn(),
}));

const mockGetOrg = vi.mocked(getOrganization);
const mockGetLicense = vi.mocked(getContiniumSelfHostedLicenseSnapshot);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetLicense.mockResolvedValue({ status: "no-license", features: null, active: false });
});

describe("getSelfHostedOrganizationEntitlementsContext", () => {
  test("throws ResourceNotFoundError when organization is null", async () => {
    mockGetOrg.mockResolvedValue(null);
    await expect(getSelfHostedOrganizationEntitlementsContext("org1")).rejects.toThrow(
      ResourceNotFoundError,
    );
  });

  test("self-hosted always returns no-license snapshot and empty SaaS-tier features", async () => {
    mockGetOrg.mockResolvedValue({ id: "org1" } as any);
    const result = await getSelfHostedOrganizationEntitlementsContext("org1");
    expect(result).toEqual({
      organizationId: "org1",
      source: "self_hosted_license",
      features: [],
      limits: { projects: 3, monthlyResponses: null },
      licenseStatus: "no-license",
      licenseFeatures: null,
      stripeCustomerId: null,
      subscriptionStatus: null,
      usageCycleAnchor: null,
    });
  });

  test("projects default to 3 when license snapshot reports no-license (current production self-hosted behavior)", async () => {
    mockGetOrg.mockResolvedValue({ id: "org1" } as any);
    const result = await getSelfHostedOrganizationEntitlementsContext("org1");
    expect(result.limits.projects).toBe(3);
  });
});
