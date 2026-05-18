import { Prisma } from "@prisma/client";
import { z } from "zod";
import { ValidationError } from "@continium/types/errors";
import { clinicalResponseRecordInclude } from "./clinical-response-sync";
import type { TCoercedValue } from "./value-coercion";

export const ZWithEnvironment = z.object({ environmentId: z.string().cuid() });
export type TTx = Prisma.TransactionClient;

export const dataPagePath = (environmentId: string, subjectId: string) =>
  `/environments/${environmentId}/clinical/subjects/${subjectId}/data`;

export const assertRecordForStudy = async (tx: TTx, recordId: string, studyId: string) => {
  const record = await tx.record.findFirst({
    where: { id: recordId, subject: { studyId } },
    include: clinicalResponseRecordInclude,
  });
  if (!record) throw new ValidationError("Record not found for this clinical workspace.");
  return record;
};

export const jsonInput = (value: Prisma.JsonValue | Prisma.InputJsonValue | null) =>
  value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue);

export const valuesEqual = (
  existing: {
    valueText: string | null;
    valueNumber: Prisma.Decimal | null;
    valueDate: Date | null;
    valueJson: unknown;
  },
  next: TCoercedValue
) => {
  return (
    existing.valueText === next.valueText &&
    String(existing.valueNumber ?? "") === String(next.valueNumber ?? "") &&
    (existing.valueDate?.toISOString() ?? null) === (next.valueDate?.toISOString() ?? null) &&
    JSON.stringify(existing.valueJson) === JSON.stringify(next.valueJson)
  );
};
