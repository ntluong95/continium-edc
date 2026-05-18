import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Per-request DAG scoping context.
 *
 * null  → system / bypass mode: no DAG filter applied (background jobs, admin paths).
 * []    → user has been looked up but has no DAG memberships AND no admin role: filter returns nothing.
 * [ids] → filter to these DAG IDs only.
 */
export type DagContext = {
  /** null = bypass (system). string[] = allowed DAG ids (empty = none visible). */
  userDagIds: string[] | null;
  /** Whether to bypass filtering entirely (system jobs, org admins). */
  bypass: boolean;
};

const store = new AsyncLocalStorage<DagContext>();

/** Run `fn` with DAG context. Bypass when `userDagIds` is null. */
export const withDagContext = <T>(ctx: DagContext, fn: () => T): T => store.run(ctx, fn);

/**
 * Async-specialised variant of `withDagContext`. Use this when wrapping a
 * function that returns `Promise<T>` and you want TypeScript to infer the
 * inner `T` directly rather than infer the whole `Promise<T>` shape.
 *
 * The generic `withDagContext<T>(ctx, fn: () => T)` works for promise
 * returns, but TypeScript struggles to preserve fidelity through the
 * boundary when `T = Promise<{...complex inferred shape...}>`. In
 * practice that causes inferred-`any` cascades downstream when the
 * wrapped function is, for example, a feature loader returning a deeply
 * structured object.
 *
 * `withDagContextAsync<T>(ctx, fn: () => Promise<T>): Promise<T>` keeps
 * `T` as the inner result type, which preserves the shape end to end.
 * Use this for all read paths that wrap a clinical loader.
 */
export const withDagContextAsync = <T>(ctx: DagContext, fn: () => Promise<T>): Promise<T> =>
  store.run(ctx, fn);

/** Get the current DAG context, or undefined if not set. */
export const getDagContext = (): DagContext | undefined => store.getStore();

/** Bypass context — for system/admin paths. */
export const BYPASS_DAG_CONTEXT: DagContext = { userDagIds: null, bypass: true };
