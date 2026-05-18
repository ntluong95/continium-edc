import { AsyncLocalStorage } from "node:async_hooks";
import type { AuditContext } from "./types";

const auditStorage = new AsyncLocalStorage<AuditContext>();

/**
 * Run `fn` with audit context bound to the current async scope.
 * AsyncLocalStorage propagates correctly across Promise chains (Node 16+).
 * Call this from Next.js server actions / route handlers before any DB writes.
 */
export const withAuditContext = <T>(ctx: AuditContext, fn: () => T): T => {
  return auditStorage.run(ctx, fn);
};

/** Returns the audit context bound to the current async scope, or null if none. */
export const getAuditContext = (): AuditContext | null => {
  return auditStorage.getStore() ?? null;
};
