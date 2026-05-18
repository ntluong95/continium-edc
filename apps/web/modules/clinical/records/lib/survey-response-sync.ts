import "server-only";
import { type InstrumentFieldType, Prisma } from "@prisma/client";
import { coerceValue } from "./value-coercion";

// ── Value adapter ─────────────────────────────────────────────────────────────

/**
 * Convert a raw Formbricks response value (string | number | string[] | boolean | …)
 * to the string input expected by coerceValue, or null to clear the cell.
 */
const toCoerceInput = (raw: unknown): string | null => {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "string") return raw;
  if (typeof raw === "number") return String(raw);
  if (typeof raw === "boolean") return String(raw);
  if (Array.isArray(raw)) return JSON.stringify(raw);
  if (typeof raw === "object") return JSON.stringify(raw);
  return String(raw);
};

// ── Main sync function ────────────────────────────────────────────────────────

interface SyncOptions {
  tx: Prisma.TransactionClient;
  recordId: string;
  instrumentId: string;
  projectId: string;
  responsesJson: Record<string, unknown>;
  actorId: string;
}

/**
 * Mirror responsesJson entries into RecordValue rows.
 * Matches each InstrumentField by its `key` (= Formbricks element ID).
 * Unknown keys are silently skipped; existing values overwritten.
 */
export const syncSurveyResponseToRecordValues = async ({
  tx,
  recordId,
  instrumentId,
  projectId,
  responsesJson,
  actorId,
}: SyncOptions): Promise<void> => {
  const fields = await tx.instrumentField.findMany({
    where: { instrumentId },
    select: { id: true, key: true, type: true },
  });

  for (const field of fields) {
    const raw = responsesJson[field.key];
    if (raw === undefined) continue;

    const coerced = coerceValue(toCoerceInput(raw), field.type as InstrumentFieldType);

    const existing = await tx.recordValue.findUnique({
      where: {
        recordId_instrumentFieldId_projectId: {
          recordId,
          instrumentFieldId: field.id,
          projectId,
        },
      },
    });

    const valueJson = (coerced.valueJson as Prisma.InputJsonValue) ?? Prisma.JsonNull;

    if (existing) {
      await tx.recordValue.update({
        where: { id_projectId: { id: existing.id, projectId } },
        data: {
          valueText: coerced.valueText,
          valueNumber: coerced.valueNumber,
          valueDate: coerced.valueDate,
          valueJson,
          updatedById: actorId,
        },
      });
    } else {
      await tx.recordValue.create({
        data: {
          projectId,
          recordId,
          instrumentFieldId: field.id,
          valueText: coerced.valueText,
          valueNumber: coerced.valueNumber,
          valueDate: coerced.valueDate,
          valueJson,
          updatedById: actorId,
        },
      });
    }
  }
};
