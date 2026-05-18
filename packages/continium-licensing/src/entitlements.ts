import type { ContiniumEdition, ContiniumPlan } from "./plans";
import type { ContiniumFeature } from "./features";

export type ContiniumEntitlementsSource = "env" | "default" | "cloud";

export type ContiniumEntitlements = {
  edition: ContiniumEdition;
  plan: ContiniumPlan;
  features: Record<ContiniumFeature, boolean>;
  source: ContiniumEntitlementsSource;
  resolvedAt: Date;
};
