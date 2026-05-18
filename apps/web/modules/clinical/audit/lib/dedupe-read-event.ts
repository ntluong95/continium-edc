/**
 * Per-request read-event deduplication.
 *
 * Read events (SUBJECT_ROSTER_VIEWED, RECORDS_VIEWED, etc.) can fire many
 * times per request if sub-functions call each other. We emit at most one row
 * per unique (actorId, projectId, eventType, resourceType) tuple per request.
 *
 * Usage (server action / route handler):
 *   withReadEventScope(async () => {
 *     await emitReadEvent({ event, actorId, projectId, resourceType, write });
 *   });
 *
 * Outside a scope (e.g. during module init) emitReadEvent is a no-op if
 * there is no store — safe to call unconditionally.
 */
import { AsyncLocalStorage } from "node:async_hooks";

const store = new AsyncLocalStorage<Set<string>>();

/** Wrap a request handler so read-event dedupe is active for its duration. */
export const withReadEventScope = <T>(fn: () => T): T => store.run(new Set(), fn);

/**
 * Returns true when the (event, actorId, projectId, resourceType) tuple has
 * NOT been seen yet in the current request scope — and marks it seen.
 * Always returns true outside a scope (no deduplication active).
 */
export const shouldEmitReadEvent = (
  event: string,
  actorId: string | null | undefined,
  projectId: string | null | undefined,
  resourceType: string | null | undefined
): boolean => {
  const seen = store.getStore();
  if (!seen) return true; // no scope — always emit

  const key = `${event}::${actorId ?? ""}::${projectId ?? ""}::${resourceType ?? ""}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
};
