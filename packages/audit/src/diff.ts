import type { AuditDiff, PrismaMiddlewareParams } from "./types";

const MAX_DIFF_BYTES = 16 * 1024; // 16 KB

const truncate = (obj: Record<string, unknown>): { data: Record<string, unknown>; truncated: boolean } => {
  const json = JSON.stringify(obj);
  // Buffer.byteLength gives actual UTF-8 byte size; json.length counts UTF-16 code units
  // which under-counts multibyte characters (e.g. CJK, emoji, clinical accented chars).
  if (Buffer.byteLength(json, "utf8") <= MAX_DIFF_BYTES) {
    return { data: obj, truncated: false };
  }
  // Truncate: return a marker instead of partial data to avoid misleading diffs.
  return {
    data: { _truncated: true, _originalBytes: json.length },
    truncated: true,
  };
};

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

/**
 * Computes a structured diff from Prisma middleware params.
 * Full before/after diff requires an extra DB read — deferred to Phase 1.6.
 * This phase captures: new values on create, patch data on update, where clause on delete.
 */
export const computeDiff = (params: PrismaMiddlewareParams, result: unknown): AuditDiff | null => {
  const { action, args } = params;

  switch (action) {
    case "create": {
      const { data, truncated } = truncate(toRecord(args.data) ?? {});
      return { action: "create", after: data, truncated: truncated || undefined };
    }

    case "update":
    case "upsert": {
      const { data, truncated } = truncate(toRecord(args.data) ?? {});
      const where = toRecord(args.where);
      return { action: "update", patch: data, where, truncated: truncated || undefined };
    }

    case "delete": {
      const where = toRecord(args.where);
      return { action: "delete", where };
    }

    case "createMany": {
      const count = typeof (result as { count?: number })?.count === "number"
        ? (result as { count: number }).count
        : undefined;
      return { action: "createMany", count };
    }

    case "updateMany": {
      const count = typeof (result as { count?: number })?.count === "number"
        ? (result as { count: number }).count
        : undefined;
      const { data, truncated } = truncate(toRecord(args.data) ?? {});
      return { action: "updateMany", patch: data, count, truncated: truncated || undefined };
    }

    case "deleteMany": {
      const count = typeof (result as { count?: number })?.count === "number"
        ? (result as { count: number }).count
        : undefined;
      const where = toRecord(args.where);
      return { action: "deleteMany", where, count };
    }

    default:
      return null;
  }
};
