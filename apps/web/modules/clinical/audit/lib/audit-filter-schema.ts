import { AuditEvent } from "@prisma/client";
import { z } from "zod";

const normalizeOptionalString = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const optionalString = z.preprocess(normalizeOptionalString, z.string().optional());

const optionalAuditDate = z.preprocess(normalizeOptionalString, z.string().optional()).refine(
  (value) => value === undefined || !Number.isNaN(Date.parse(value)),
  "Invalid date filter"
);

export const auditFilterQuerySchema = z.object({
  from: optionalAuditDate.optional(),
  to: optionalAuditDate.optional(),
  event: z.preprocess(normalizeOptionalString, z.nativeEnum(AuditEvent).optional()),
  actorId: optionalString,
  resourceType: optionalString,
  resourceId: optionalString,
  subjectId: optionalString,
  search: optionalString,
  page: z
    .preprocess((value) => {
      if (value === undefined || value === null || value === "") return undefined;
      if (typeof value === "number") return value;
      if (typeof value === "string") return Number.parseInt(value, 10);
      return value;
    }, z.number().int().min(1).max(10_000).optional())
    .optional(),
});

export type AuditFilters = z.infer<typeof auditFilterQuerySchema>;
