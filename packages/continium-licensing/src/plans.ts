import { ALL_CONTINIUM_FEATURES, type ContiniumFeature } from "./features";

/**
 * Continium plan keys.
 *
 * v1: free + selfHosted (env-only).
 * cloud: features fetched from the license server; env-based features are the
 *        fail-safe default until the server responds. The cloud resolver in
 *        get-continium-entitlements.ts overrides the base feature set.
 */
export const CONTINIUM_PLANS = {
  free: "free",
  selfHosted: "selfHosted",
  cloud: "cloud",
} as const;

export type ContiniumPlan = (typeof CONTINIUM_PLANS)[keyof typeof CONTINIUM_PLANS];

export const ALL_CONTINIUM_PLANS: readonly ContiniumPlan[] = Object.values(CONTINIUM_PLANS);

/**
 * Edition → plan mapping.
 *
 * Edition is the public-facing env var (`CONTINIUM_EDITION`); plan is the
 * internal feature-set selector. Keeping them separate makes it cheap to
 * remap editions in the future without breaking the resolver contract.
 */
export const CONTINIUM_EDITIONS = CONTINIUM_PLANS;
export type ContiniumEdition = ContiniumPlan;

const PLAN_TO_FEATURES: Readonly<Record<ContiniumPlan, ReadonlySet<ContiniumFeature>>> = {
  free: new Set<ContiniumFeature>(),
  selfHosted: new Set<ContiniumFeature>(ALL_CONTINIUM_FEATURES),
  // cloud: base features are empty (fail-safe); the cloud resolver in
  // get-continium-entitlements.ts overrides with server-fetched features.
  cloud: new Set<ContiniumFeature>(),
};

export const getFeaturesForPlan = (plan: ContiniumPlan): ReadonlySet<ContiniumFeature> =>
  PLAN_TO_FEATURES[plan];
