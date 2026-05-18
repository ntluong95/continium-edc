import "server-only";
import type { TResponse, TResponseMeta } from "@continium/types/responses";
import { CLINICAL_RESPONSE_SOURCE } from "@/modules/clinical/records/lib/clinical-response-sync";

/**
 * Meta keys that identify a clinical subject, event, instrument instance, or
 * other study artefact. Written into `Response.meta` by
 * `buildClinicalResponseMeta` in clinical-response-sync.ts; stripped when a
 * Response is read by a caller that is NOT on the clinical access surface
 * (the management API, webhook payloads, integration exports).
 *
 * Per the Q4 = "keep in DB, gate by role" decision: API tokens have no
 * concept of clinical scope today, so the redactor applies unconditionally
 * on every external-boundary read path. UI consumers reach the data
 * through Next.js organisation-level auth and continue to read the full
 * meta — the in-app responses page is already gated by the same scope
 * that gates the clinical surface itself.
 *
 * Keep `source`, `environmentId`, and `projectId` so the analytics layer
 * can still filter by `source === "clinical_data_entry"` without learning
 * who the subject is.
 */
export const CLINICAL_PII_META_KEYS = [
  "recordId",
  "subjectId",
  "subjectExternalId",
  "eventId",
  "eventName",
  "armId",
  "armName",
  "instrumentId",
  "instrumentName",
  "instance",
  "enteredByUserId",
] as const satisfies readonly (keyof TResponseMeta)[];

const CLINICAL_PII_META_KEY_SET: ReadonlySet<string> = new Set(CLINICAL_PII_META_KEYS);

const isClinicalMetaObject = (meta: unknown): meta is Record<string, unknown> => {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return false;
  return (meta as Record<string, unknown>).source === CLINICAL_RESPONSE_SOURCE;
};

/**
 * Returns meta with clinical-PII keys removed, only when the meta carries
 * `source === clinical_data_entry`. Non-clinical responses pass through
 * untouched (the original reference is returned to keep allocations zero
 * on the hot path).
 *
 * Generic on T so the function preserves the caller's static type — pass
 * a `TResponseMeta`, get back a `TResponseMeta`; pass a `Prisma.JsonValue`,
 * get back the same.
 */
export const redactClinicalResponseMeta = <T>(meta: T): T => {
  if (!isClinicalMetaObject(meta)) return meta;
  const obj = meta as Record<string, unknown>;
  const redacted: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    if (CLINICAL_PII_META_KEY_SET.has(key)) continue;
    redacted[key] = obj[key];
  }
  return redacted as T;
};

const hasClinicalMeta = <T extends { meta?: unknown }>(rows: readonly T[]): boolean => {
  for (const row of rows) {
    if (isClinicalMetaObject(row.meta)) return true;
  }
  return false;
};

/**
 * Maps over an array of Response-shaped rows and returns a new array
 * where each clinical row has its PII meta keys stripped. Returns the
 * input reference unchanged when zero rows carry clinical meta, so
 * non-clinical workspaces pay no allocation cost.
 *
 * Accepts the looser `{ meta?: unknown }` shape so both Zod-typed
 * `TResponse` and raw Prisma `Response` (where meta is `JsonValue`) work.
 */
export const redactClinicalResponseMetaInResponses = <T extends { meta?: unknown }>(
  rows: T[]
): T[] => {
  if (!hasClinicalMeta(rows)) return rows;
  return rows.map((row) =>
    isClinicalMetaObject(row.meta) ? { ...row, meta: redactClinicalResponseMeta(row.meta) } : row
  );
};

/**
 * Single-row convenience for the webhook pipeline, where the response is
 * already a fully resolved object at the call site.
 */
export const redactClinicalResponseInResponse = <T extends { meta?: unknown }>(row: T): T => {
  if (!isClinicalMetaObject(row.meta)) return row;
  return { ...row, meta: redactClinicalResponseMeta(row.meta) };
};

/**
 * Re-exported for callers that need the typed shape (test fixtures,
 * the response service's filter-dropdown builder).
 */
export type { TResponse, TResponseMeta };
