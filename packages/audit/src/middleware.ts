import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { logger } from "@continium/logger";
import { getAuditContext } from "./context";
import { computeDiff } from "./diff";
import type { AuditEnvelope, AuditWriteFn, PrismaMiddlewareFn, PrismaMiddlewareParams } from "./types";

/** Prisma operations that produce an audit event. */
const WRITE_OPERATIONS = new Set([
  "create",
  "createMany",
  "update",
  "updateMany",
  "upsert",
  "delete",
  "deleteMany",
]);

/**
 * Extracts a project ID from common Prisma arg shapes.
 * Works for direct { where: { projectId } } and nested create args.
 */
const extractProjectId = (args: Record<string, unknown>): string | null => {
  const where = args.where as Record<string, unknown> | undefined;
  if (typeof where?.projectId === "string") return where.projectId;

  const data = args.data as Record<string, unknown> | undefined;
  if (typeof data?.projectId === "string") return data.projectId;

  return null;
};

/**
 * Extracts the primary resource ID from the Prisma result.
 * Works for single-row results; returns null for batch ops.
 */
const extractResourceId = (result: unknown): string | null => {
  if (result == null || typeof result !== "object" || Array.isArray(result)) return null;
  const row = result as Record<string, unknown>;
  if (typeof row.id === "string") return row.id;
  return null;
};

export type AuditMiddlewareOptions = {
  write: AuditWriteFn;
  /** Set to false to disable middleware globally (e.g. in tests). Default true. */
  enabled?: boolean;
};

/**
 * Prisma middleware that emits an AuditEnvelope for every write operation.
 *
 * Usage (packages/database/src/client.ts):
 *   prisma.$use(createAuditMiddleware({ write: myWriteFn }));
 *
 * The `write` function is provided by the caller and may enqueue via pg-boss
 * (async) or INSERT directly (sync fallback) — the middleware doesn't care.
 *
 * AuditLog model writes are silently skipped to prevent infinite loops.
 */
export const createAuditMiddleware = ({ write, enabled = true }: AuditMiddlewareOptions): PrismaMiddlewareFn => {
  return async (params: PrismaMiddlewareParams, next) => {
    const result = await next(params);

    if (
      !enabled ||
      !WRITE_OPERATIONS.has(params.action) ||
      params.model === "AuditLog"
    ) {
      return result;
    }

    // Fire-and-forget — never block the main request on audit writes.
    void (async () => {
      try {
        const ctx = getAuditContext();
        const now = new Date();

        const envelope: AuditEnvelope = {
          id: randomUUID(),
          occurredAt: now.toISOString(),
          // PRISMA_OPERATION is a valid catch-all AuditEvent enum value.
          // The exact Prisma model + action are stored in metadata so queries can
          // filter by operation type. Callers replace this with typed events via
          // recordEvent() as Phase 1 models gain explicit audit instrumentation.
          event: "PRISMA_OPERATION",
          actorId: ctx?.actorId ?? null,
          actorIp: ctx?.actorIp ?? null,
          userAgent: ctx?.userAgent ?? null,
          projectId: extractProjectId(params.args),
          resourceId: extractResourceId(result),
          resourceType: params.model ?? null,
          diff: computeDiff(params, result),
          metadata: {
            prismaModel: params.model ?? null,
            prismaAction: params.action,
          },
        };

        await write(envelope);
      } catch (err) {
        // Audit write failures must never surface to the caller.
        logger.error({ err }, "audit middleware: write failed");
      }
    })();

    return result;
  };
};

/**
 * Per-write hook used by the Prisma client extension. Mirrors the
 * `createAuditMiddleware` body but is callable directly so unit tests can
 * exercise it without a real Prisma client. The extension registers this
 * function under `query.$allModels.$allOperations`.
 *
 * The hook is fire-and-forget: it awaits the underlying query first so the
 * caller sees the real result + latency, then asynchronously emits the
 * audit envelope. An exception inside `write(envelope)` is logged but
 * never re-thrown, so audit failures cannot surface to user-visible
 * actions.
 */
export type AuditExtensionOptions = AuditMiddlewareOptions;

export const auditWriteExtensionHook = async <T>(
  {
    model,
    operation,
    args,
    query,
  }: {
    model: string | undefined;
    operation: string;
    args: Record<string, unknown>;
    query: (a: Record<string, unknown>) => Promise<T>;
  },
  options: AuditExtensionOptions
): Promise<T> => {
  const result = await query(args);

  if (!options.enabled || !WRITE_OPERATIONS.has(operation) || model === "AuditLog") {
    return result;
  }

  void (async () => {
    try {
      const ctx = getAuditContext();
      const envelope: AuditEnvelope = {
        id: randomUUID(),
        occurredAt: new Date().toISOString(),
        event: "PRISMA_OPERATION",
        actorId: ctx?.actorId ?? null,
        actorIp: ctx?.actorIp ?? null,
        userAgent: ctx?.userAgent ?? null,
        projectId: extractProjectId(args),
        resourceId: extractResourceId(result),
        resourceType: model ?? null,
        diff: computeDiff(
          { model, action: operation, args, dataPath: [], runInTransaction: false },
          result
        ),
        metadata: { prismaModel: model ?? null, prismaAction: operation },
      };
      await options.write(envelope);
    } catch (err) {
      logger.error({ err }, "audit extension: write failed");
    }
  })();

  return result;
};

/**
 * Prisma client extension installing the audit hook on every model.
 *
 * Usage (`packages/database/src/client.ts`):
 *   const client = new PrismaClient(...)
 *     .$extends(createAuditPrismaExtension({ write: writeFn }));
 *
 * `enabled` defaults to true; pass `enabled: false` to disable in tests.
 * The hook only emits on write operations (see `WRITE_OPERATIONS`);
 * reads pass through untouched. `AuditLog` model writes are silently
 * skipped to prevent infinite loops.
 */
export const createAuditPrismaExtension = (options: AuditExtensionOptions) => {
  const opts: Required<AuditExtensionOptions> = {
    write: options.write,
    enabled: options.enabled ?? true,
  };
  return Prisma.defineExtension({
    name: "audit-emit",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          return auditWriteExtensionHook(
            {
              model,
              operation,
              args: args as Record<string, unknown>,
              query: query as (a: Record<string, unknown>) => Promise<unknown>,
            },
            opts
          );
        },
      },
    },
  });
};

/**
 * Directly records a typed audit event, bypassing the Prisma middleware.
 * Use for non-Prisma events (e.g. auth, exports, permission checks).
 */
export const recordEvent = async (
  event: string,
  write: AuditWriteFn,
  opts: {
    actorId?: string | null;
    actorIp?: string | null;
    userAgent?: string | null;
    projectId?: string | null;
    resourceId?: string | null;
    resourceType?: string | null;
    metadata?: Record<string, unknown> | null;
  } = {}
): Promise<void> => {
  const ctx = getAuditContext();

  const envelope: AuditEnvelope = {
    id: randomUUID(),
    occurredAt: new Date().toISOString(),
    event,
    actorId: opts.actorId ?? ctx?.actorId ?? null,
    actorIp: opts.actorIp ?? ctx?.actorIp ?? null,
    userAgent: opts.userAgent ?? ctx?.userAgent ?? null,
    projectId: opts.projectId ?? null,
    resourceId: opts.resourceId ?? null,
    resourceType: opts.resourceType ?? null,
    diff: null,
    metadata: opts.metadata ?? null,
  };

  await write(envelope);
};
