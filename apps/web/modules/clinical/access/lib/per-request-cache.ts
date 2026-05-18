import { AsyncLocalStorage } from "node:async_hooks";
import type { TClinicalPermission } from "./zod-schemas";

type CacheMap = Map<string, TClinicalPermission>;

const accessStore = new AsyncLocalStorage<CacheMap>();

/**
 * Wrap a request handler (e.g. Server Action or API Route) so rule resolution
 * caching is active for its duration.
 */
export const withAccessRuleCache = <T>(fn: () => T): T => accessStore.run(new Map(), fn);

/**
 * Get a cached permission for the current request scope.
 * Returns undefined if no cache is active or if the key is not found.
 */
export const getCachedPermission = (
  userId: string,
  instrumentId: string | null,
  eventId: string | null
): TClinicalPermission | undefined => {
  const store = accessStore.getStore();
  if (!store) return undefined;

  const key = `${userId}::${instrumentId ?? ""}::${eventId ?? ""}`;
  return store.get(key);
};

/**
 * Set a cached permission for the current request scope.
 * No-op if no cache is active.
 */
export const setCachedPermission = (
  userId: string,
  instrumentId: string | null,
  eventId: string | null,
  permission: TClinicalPermission
): void => {
  const store = accessStore.getStore();
  if (!store) return;

  const key = `${userId}::${instrumentId ?? ""}::${eventId ?? ""}`;
  store.set(key, permission);
};
