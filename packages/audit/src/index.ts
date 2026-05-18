// Context
export { withAuditContext, getAuditContext } from "./context";

// Middleware
export {
  auditWriteExtensionHook,
  createAuditMiddleware,
  createAuditPrismaExtension,
  recordEvent,
} from "./middleware";
export type { AuditExtensionOptions, AuditMiddlewareOptions } from "./middleware";

// Diff
export { computeDiff } from "./diff";

// Types
export type {
  AuditContext,
  AuditDiff,
  AuditEnvelope,
  AuditWriteFn,
  PrismaMiddlewareFn,
  PrismaMiddlewareParams,
  PrismaNextFn,
} from "./types";

// Job contracts (schemas + payload types)
export { auditWriteJobSchema } from "./contracts/audit-write-contract";
export type { TAuditWriteJobPayload } from "./contracts/audit-write-contract";

export { partitionCreateJobSchema } from "./contracts/partition-create-contract";
export type { TPartitionCreateJobPayload } from "./contracts/partition-create-contract";
