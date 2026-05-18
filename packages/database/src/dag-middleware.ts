import { Prisma } from "@prisma/client";
import { getDagContext } from "./dag-context";
import type { PrismaMiddlewareFn } from "@continium/audit";

/**
 * DAG-scoped query filter for clinical reads.
 *
 * Models scoped: Record, Enrollment (both carry a dagId column).
 * Subject filtering (via enrollment join) is deferred to Phase 2.
 *
 * The extension fires only when the call site is wrapped in
 * `withDagContext(...)` AsyncLocalStorage. Outside that wrapper the
 * context is undefined and every query passes through unchanged — so
 * adding this extension is non-breaking for every existing call site.
 *
 * Bypass conditions (no filter injected):
 *  - No DagContext in AsyncLocalStorage (system / background job paths).
 *  - context.bypass === true (explicit opt-out via withDagContext(BYPASS_DAG_CONTEXT, ...)).
 *  - context.userDagIds === null (admin bypass via withDagContext({ userDagIds: null, ... })).
 *  - Action is a write (extension only scopes reads; writes must supply dagId explicitly).
 *
 * If userDagIds is an EMPTY array, the filter resolves to `dagId IN ()` which
 * matches no rows — that is the correct "user has no DAGs, sees nothing" behaviour.
 */

const READ_OPERATIONS = new Set<Prisma.PrismaAction | string>([
  "findMany",
  "findFirst",
  "findUnique",
  "findUniqueOrThrow",
  "findFirstOrThrow",
  "count",
  "aggregate",
  "groupBy",
]);

type WithWhere = { where?: Record<string, unknown> };

const applyDagFilter = (args: WithWhere | undefined): WithWhere | undefined => {
  const ctx = getDagContext();
  if (!ctx || ctx.bypass || ctx.userDagIds === null) return args;

  const dagFilter =
    ctx.userDagIds.length === 0
      ? { dagId: { in: [] as string[] } }
      : { dagId: { in: ctx.userDagIds } };

  return { ...(args ?? {}), where: { ...(args?.where ?? {}), ...dagFilter } };
};

/**
 * Exported for unit tests so the per-query behaviour can be verified
 * without instantiating a Prisma client. The production extension
 * registers this same function under `query.record.$allOperations` and
 * `query.enrollment.$allOperations`.
 */
export const dagScopeQueryHook = async <T>({
  operation,
  args,
  query,
}: {
  operation: string;
  args: WithWhere;
  query: (a: WithWhere) => Promise<T>;
}): Promise<T> => {
  if (!READ_OPERATIONS.has(operation)) return query(args);
  return query(applyDagFilter(args) ?? args);
};

/**
 * Prisma client extension installing the DAG scope on Record + Enrollment reads.
 *
 * Usage (`packages/database/src/client.ts`):
 *   const client = new PrismaClient(...).$extends(createDagPrismaExtension());
 *
 * The extension is opt-in per-call-site: only queries running inside a
 * `withDagContext` block are filtered. System paths and unscoped reads pass
 * through with no overhead beyond a single AsyncLocalStorage lookup.
 */
export const createDagPrismaExtension = () =>
  Prisma.defineExtension({
    name: "dag-scope",
    query: {
      record: {
        async $allOperations({ operation, args, query }) {
          return dagScopeQueryHook({
            operation,
            args: args as WithWhere,
            query: query as (a: WithWhere) => Promise<unknown>,
          });
        },
      },
      enrollment: {
        async $allOperations({ operation, args, query }) {
          return dagScopeQueryHook({
            operation,
            args: args as WithWhere,
            query: query as (a: WithWhere) => Promise<unknown>,
          });
        },
      },
    },
  });

/**
 * @deprecated Legacy `$use` middleware retained for transitional callers that
 * still construct a bare PrismaClient. Prisma v5+ removed `$use`, so this
 * function is registered through a runtime feature-check in `client.ts` and
 * silently no-ops in v6. Prefer `createDagPrismaExtension()` for new wiring.
 */
const DAG_SCOPED_MODELS = new Set(["Record", "Enrollment"]);

const READ_ACTIONS_LEGACY = new Set([
  "findMany",
  "findFirst",
  "findUnique",
  "findUniqueOrThrow",
  "findFirstOrThrow",
  "count",
  "aggregate",
]);

export const createDagMiddleware = (): PrismaMiddlewareFn => {
  return async (params, next) => {
    const ctx = getDagContext();
    if (
      !ctx ||
      ctx.bypass ||
      !DAG_SCOPED_MODELS.has(params.model ?? "") ||
      !READ_ACTIONS_LEGACY.has(params.action)
    ) {
      return next(params);
    }

    const { userDagIds } = ctx;
    if (userDagIds === null) return next(params);

    const dagFilter =
      userDagIds.length === 0
        ? { dagId: { in: [] as string[] } }
        : { dagId: { in: userDagIds } };

    params.args = {
      ...params.args,
      where: { ...((params.args?.where as object | undefined) ?? {}), ...dagFilter },
    };

    return next(params);
  };
};
