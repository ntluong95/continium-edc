/**
 * Self-hosted licenseStatus invariant canary (red-team Finding #1).
 *
 * The licensing-refactor's `continium-license-source.ts` deliberately returns
 * `licenseStatus: "no-license"` for the `selfHosted` edition. The risk this
 * test prevents: a future change flips that to `"active"`, which would
 * silently CLOSE every license-guarded entitlement in `checks.ts` for any
 * caller that DID get SaaS-tier features into `context.features` (e.g. via
 * a future hosted-billing source that populates them).
 *
 * What this asserts:
 *   1. The self-hosted snapshot returned by `continium-license-source` is
 *      `{ status: "no-license", features: null, active: false }`.
 *   2. Given that snapshot, `hasOrganizationEntitlementWithLicenseGuard`
 *      DOES reach its `"no-license"` short-circuit branch and returns true
 *      for license-guarded keys present in `context.features` — i.e. the
 *      branch at checks.ts is not bypassed by the new licensing layer.
 *
 * Important context (production self-hosted-without-key behaviour):
 *   The real self-hosted provider produces `context.features = []` because
 *   `mapLicenseFeaturesToEntitlements(null) === []`. So the user-visible
 *   answer for `hide-branding` etc. is `false` (short-circuit at
 *   checks.ts:48 fires first). This is unchanged from the previous EE-based
 *   self-hosted-no-key path. The new wire-compat invariant tested here is
 *   about the cloud-Stripe path and any future source that DOES populate
 *   `context.features` while remaining license-status `"no-license"`.
 */
import { beforeEach, describe, expect, test, vi } from "vitest";
import { hasOrganizationEntitlementWithLicenseGuard } from "@/modules/entitlements/lib/checks";
import { getContiniumSelfHostedLicenseSnapshot } from "@/modules/entitlements/lib/continium-license-source";

vi.mock("server-only", () => ({}));

vi.mock("@/modules/continium/licensing/lib/get-continium-entitlements", () => ({
  getContiniumEntitlements: vi.fn().mockResolvedValue({
    edition: "selfHosted",
    plan: "selfHosted",
    features: {},
    source: "default",
    resolvedAt: new Date(),
  }),
}));

vi.mock("@/modules/entitlements/lib/provider", () => ({
  getOrganizationEntitlementsContext: vi.fn(),
}));

const { getOrganizationEntitlementsContext } = await import("@/modules/entitlements/lib/provider");
const mockGetContext = vi.mocked(getOrganizationEntitlementsContext);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("self-hosted licenseStatus invariant (red-team Finding #1)", () => {
  test("continium-license-source returns no-license status (preserves checks.ts:60-61 short-circuit reachability)", async () => {
    const snapshot = await getContiniumSelfHostedLicenseSnapshot();
    expect(snapshot.status).toBe("no-license");
    expect(snapshot.features).toBeNull();
    expect(snapshot.active).toBe(false);
  });

  test("checks.ts no-license branch returns true for license-guarded keys when present in context.features", async () => {
    // Simulates a future source (or the cloud-Stripe path) that populates
    // context.features alongside licenseStatus:"no-license". The branch
    // at checks.ts:60-61 must remain reachable and short-circuit to true.
    mockGetContext.mockResolvedValue({
      organizationId: "org1",
      source: "self_hosted_license",
      features: [
        "hide-branding",
        "rbac",
        "quota-management",
        "spam-protection",
        "contacts",
        "ai-smart-tools",
        "ai-data-analysis",
      ],
      limits: { projects: 3, monthlyResponses: null },
      licenseStatus: "no-license",
      licenseFeatures: null,
      stripeCustomerId: null,
      subscriptionStatus: null,
      usageCycleAnchor: null,
    });

    const LICENSE_GUARDED = [
      "hide-branding",
      "rbac",
      "quota-management",
      "spam-protection",
      "contacts",
      "ai-smart-tools",
      "ai-data-analysis",
    ] as const;

    for (const key of LICENSE_GUARDED) {
      const allowed = await hasOrganizationEntitlementWithLicenseGuard("org1", key);
      expect(allowed, `expected ${key} to be allowed under no-license short-circuit`).toBe(true);
    }
  });
});
