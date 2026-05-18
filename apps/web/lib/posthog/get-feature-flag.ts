import "server-only";
import PostHog from "posthog-node";
import { POSTHOG_KEY } from "@/lib/constants";
import type { TPostHogFeatureFlagContext, TPostHogFeatureFlagValue } from "./types";

const buildPostHogGroups = (context: TPostHogFeatureFlagContext): Record<string, string> => {
  const groups: Record<string, string> = {};
  if (context.organizationId) groups.organization = context.organizationId;
  if (context.workspaceId) groups.workspace = context.workspaceId;
  return groups;
};

export const getPostHogFeatureFlag = async (
  flagKey: string,
  distinctId: string,
  context: TPostHogFeatureFlagContext = {}
): Promise<TPostHogFeatureFlagValue | null> => {
  if (!POSTHOG_KEY) return null;

  const client = new PostHog(POSTHOG_KEY, {
    host: "https://eu.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });

  try {
    const groups = buildPostHogGroups(context);
    const value = await client.getFeatureFlag(flagKey, distinctId, {
      groups: Object.keys(groups).length > 0 ? groups : undefined,
    });
    return value ?? false;
  } catch (error) {
    console.error(`Failed to get PostHog feature flag "${flagKey}":`, error);
    return null;
  } finally {
    await client.shutdown();
  }
};
