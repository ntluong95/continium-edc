import type { TClinicalPermission } from "./zod-schemas";

export type SimpleAccessRule = {
  instrumentId: string | null;
  eventId: string | null;
  permission: TClinicalPermission;
};

export type RuleMatchQuery = {
  instrumentId?: string | null;
  eventId?: string | null;
};

const PERMISSION_WEIGHTS: Record<TClinicalPermission, number> = {
  NO_ACCESS: 0,
  READ: 1,
  READ_WRITE: 2,
};

/**
 * Returns the most restrictive permission from a list of permissions.
 * NO_ACCESS < READ < READ_WRITE
 */
export function getMostRestrictivePermission(
  permissions: TClinicalPermission[]
): TClinicalPermission | null {
  if (permissions.length === 0) return null;
  return permissions.reduce((mostRestrictive, current) => {
    return PERMISSION_WEIGHTS[current] < PERMISSION_WEIGHTS[mostRestrictive]
      ? current
      : mostRestrictive;
  });
}

/**
 * Resolves the clinical permission for a given user query using the principle
 * of additive narrowing (rules can only restrict, not grant beyond role).
 *
 * Specificity hierarchy:
 * 1. Exact match for both instrumentId and eventId (EventInstrument target)
 * 2. Partial match for either instrumentId or eventId
 * 3. Role default
 */
export function resolveClinicalPermission(
  rules: SimpleAccessRule[],
  query: RuleMatchQuery,
  roleDefault: TClinicalPermission
): TClinicalPermission {
  const { instrumentId = null, eventId = null } = query;

  // 1. Check for exact match on BOTH (EventInstrument)
  if (instrumentId && eventId) {
    const exactMatches = rules.filter(
      (r) => r.instrumentId === instrumentId && r.eventId === eventId
    );
    if (exactMatches.length > 0) {
      const perms = exactMatches.map((r) => r.permission);
      return getMostRestrictivePermission([...perms, roleDefault])!;
    }
  }

  // 2. Check for partial matches (Instrument-only or Event-only)
  const partialMatches = rules.filter((r) => {
    // Rule targets instrument exactly, and has no event restriction
    const isInstrumentMatch = r.instrumentId === instrumentId && r.eventId === null;
    // Rule targets event exactly, and has no instrument restriction
    const isEventMatch = r.eventId === eventId && r.instrumentId === null;

    return isInstrumentMatch || isEventMatch;
  });

  if (partialMatches.length > 0) {
    const perms = partialMatches.map((r) => r.permission);
    // Additive narrowing: we take the most restrictive partial match,
    // and it cannot be less restrictive than the roleDefault.
    return getMostRestrictivePermission([...perms, roleDefault])!;
  }

  // 3. Fallback to role default
  return roleDefault;
}
