import type { TPostHogFeatureFlagValue } from "./types";

export const getPostHogClientFeatureFlag = (flagKey: string): TPostHogFeatureFlagValue | null => {
  if (typeof window === "undefined") return null;

  const posthog = (window as typeof window & { posthog?: { __loaded?: boolean; getFeatureFlag?: (key: string) => TPostHogFeatureFlagValue | undefined } }).posthog;

  if (!posthog?.__loaded) return null;

  const value = posthog.getFeatureFlag?.(flagKey);
  return value ?? false;
};
