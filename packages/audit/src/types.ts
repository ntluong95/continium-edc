/** Actor and request context captured via AsyncLocalStorage. */
export type AuditContext = {
  actorId: string | null;
  actorIp: string | null;
  userAgent: string | null;
};

/** Structured change data attached to every audit event. Capped at 16 KB. */
export type AuditDiff = {
  action: "create" | "update" | "delete" | "createMany" | "updateMany" | "deleteMany";
  /** New field values (create/update). Null for deletes. */
  after?: Record<string, unknown> | null;
  /** Changed field values sent to Prisma (update patch). Null for creates/deletes. */
  patch?: Record<string, unknown> | null;
  /** Where clause used for deletes / batch ops. */
  where?: Record<string, unknown> | null;
  /** Affected row count for batch operations. */
  count?: number;
  /** True when diff was truncated because it exceeded 16 KB. */
  truncated?: boolean;
};

/** Full event envelope written to audit_log. */
export type AuditEnvelope = {
  /** UUID v4 — used for idempotency by the audit-write job. */
  id: string;
  occurredAt: string; // ISO-8601; part of the composite PK
  event: string; // AuditEvent enum value
  actorId: string | null;
  actorIp: string | null;
  userAgent: string | null;
  projectId: string | null;
  resourceId: string | null;
  resourceType: string | null;
  diff: AuditDiff | null;
  metadata: Record<string, unknown> | null;
};

/** Function that persists an AuditEnvelope (async or sync). Injected by the caller. */
export type AuditWriteFn = (envelope: AuditEnvelope) => Promise<void>;

/** Minimal Prisma middleware parameter shape — mirrors Prisma.MiddlewareParams. */
export type PrismaMiddlewareParams = {
  model?: string;
  action: string;
  args: Record<string, unknown>;
  dataPath: string[];
  runInTransaction: boolean;
};

export type PrismaNextFn<T = unknown> = (params: PrismaMiddlewareParams) => Promise<T>;

export type PrismaMiddlewareFn<T = unknown> = (
  params: PrismaMiddlewareParams,
  next: PrismaNextFn<T>
) => Promise<T>;
