"use client";

import { Fragment, type ReactNode, createElement } from "react";
import { ALL_CONTINIUM_FEATURES, type ContiniumFeature } from "@continium/licensing";
import { useContiniumEntitlements } from "../hooks/use-continium-entitlements";

const isKnownFeature = (feature: string): feature is ContiniumFeature =>
  (ALL_CONTINIUM_FEATURES as readonly string[]).includes(feature);

/**
 * Display-only feature gate.
 *
 * **Never the sole guard for clinical data access.** Always pair UI gating
 * with a server-side `assertContiniumFeature(feature)` call. The TS type
 * `ContiniumFeature` is erased at runtime; this component runtime-validates
 * the `feature` prop against the canonical registry and renders the fallback
 * (or null) on unknown / disabled / mistyped keys.
 *
 * Recommended fallback: `<UpgradePrompt ... />` from
 * `apps/web/modules/ui/components/upgrade-prompt/`. Avoid wrapping whole
 * pages — wrap the smallest meaningful actionable subtree.
 */
export const FeatureGate = ({
  feature,
  children,
  fallback = null,
}: {
  feature: ContiniumFeature;
  children: ReactNode;
  fallback?: ReactNode;
}) => {
  const entitlements = useContiniumEntitlements();
  if (!isKnownFeature(feature)) return createElement(Fragment, null, fallback);
  if (entitlements.features[feature] !== true) return createElement(Fragment, null, fallback);
  return createElement(Fragment, null, children);
};
