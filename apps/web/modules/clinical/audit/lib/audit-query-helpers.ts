import { AuditEvent, type Prisma } from "@prisma/client";
import type { AuditFilters } from "./audit-filter-schema";

const DEFAULT_LOOKBACK_DAYS = 30;

const toDateBound = (value: string, boundary: "start" | "end") => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(boundary === "start" ? `${value}T00:00:00.000Z` : `${value}T23:59:59.999Z`);
  }

  return new Date(value);
};

export const buildDateBounds = (from?: string, to?: string) => {
  const now = new Date();
  const lower = from
    ? toDateBound(from, "start")
    : new Date(now.getTime() - DEFAULT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const upper = to ? toDateBound(to, "end") : now;
  return { lower, upper };
};

export const AUTH_AUDIT_EVENTS = [
  AuditEvent.USER_LOGIN,
  AuditEvent.USER_LOGIN_FAILED,
  AuditEvent.USER_LOGOUT,
] as const;

export const getAuditFilterPredicates = (filters: AuditFilters): Prisma.AuditLogWhereInput[] => {
  const { lower, upper } = buildDateBounds(filters.from, filters.to);

  return [
    { occurredAt: { gte: lower, lte: upper } },
    ...(filters.event ? [{ event: filters.event }] : []),
    ...(filters.actorId ? [{ actorId: filters.actorId }] : []),
    ...(filters.resourceType ? [{ resourceType: filters.resourceType }] : []),
    ...(filters.resourceId ? [{ resourceId: filters.resourceId }] : []),
    ...(filters.subjectId
      ? [
          {
            OR: [
              { resourceType: "Subject", resourceId: filters.subjectId },
              { metadata: { path: ["subjectId"], equals: filters.subjectId } },
            ],
          },
        ]
      : []),
    ...(filters.search
      ? [
          {
            OR: [
              { actorId: { contains: filters.search } },
              { resourceId: { contains: filters.search } },
            ],
          },
        ]
      : []),
  ];
};
