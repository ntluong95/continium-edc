import { InstrumentFieldType, Prisma } from "@prisma/client";
import { ValidationError } from "@continium/types/errors";

/**
 * The subset of columns in RecordValue that carry the typed payload.
 * Exactly one column will be non-null per write; the rest are null.
 */
export interface TCoercedValue {
  valueText: string | null;
  valueNumber: Prisma.Decimal | null;
  valueDate: Date | null;
  valueJson: Prisma.InputJsonValue | null;
}

const EMPTY: TCoercedValue = {
  valueText: null,
  valueNumber: null,
  valueDate: null,
  valueJson: null,
};

// ISO 8601 calendar date (`YYYY-MM-DD`) or full datetime
// (`YYYY-MM-DDTHH:mm[:ss[.sss]]` with optional `Z` or `±HH:MM` offset).
const ISO_DATE_ONLY = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const ISO_DATETIME =
  /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.\d{1,3})?)?(Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/;

/**
 * Strict ISO 8601 date parser for clinical data entry. Rejects everything
 * `new Date(...)` accepts loosely — natural-language strings, two-digit
 * years, non-canonical separators — and validates that the parsed date
 * round-trips to the input so impossible calendar dates like
 * `2026-02-31` cannot slip through.
 */
const parseClinicalDate = (input: string): Date | null => {
  const dateOnly = ISO_DATE_ONLY.exec(input);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    const date = new Date(`${y}-${m}-${d}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return null;
    if (date.getUTCFullYear() !== Number(y)) return null;
    if (date.getUTCMonth() + 1 !== Number(m)) return null;
    if (date.getUTCDate() !== Number(d)) return null;
    return date;
  }
  if (ISO_DATETIME.test(input)) {
    const date = new Date(input);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
};

/**
 * Coerce a raw string input into the correct typed RecordValue column.
 * Returns null-filled TCoercedValue for empty / null input (meaning "clear cell").
 * Throws a ValidationError with a user-readable message on invalid input.
 */
export const coerceValue = (
  raw: string | null | undefined,
  fieldType: InstrumentFieldType
): TCoercedValue => {
  // Null / empty → clear the cell
  if (raw === null || raw === undefined || raw.trim() === "") return EMPTY;

  const trimmed = raw.trim();

  switch (fieldType) {
    case InstrumentFieldType.TEXT:
      if (trimmed.length > 10_000) throw new ValidationError("Text value exceeds 10 000 character limit.");
      return { ...EMPTY, valueText: trimmed };

    case InstrumentFieldType.NUMBER: {
      const num = Number(trimmed);
      if (!Number.isFinite(num)) throw new ValidationError(`"${trimmed}" is not a valid number.`);
      return { ...EMPTY, valueNumber: new Prisma.Decimal(trimmed) };
    }

    case InstrumentFieldType.DATE: {
      const date = parseClinicalDate(trimmed);
      if (!date) throw new ValidationError(`"${trimmed}" is not a valid date.`);
      return { ...EMPTY, valueDate: date };
    }

    case InstrumentFieldType.BOOLEAN: {
      const lower = trimmed.toLowerCase();
      if (lower === "true" || lower === "1" || lower === "yes") return { ...EMPTY, valueJson: true };
      if (lower === "false" || lower === "0" || lower === "no") return { ...EMPTY, valueJson: false };
      throw new ValidationError(`"${trimmed}" is not a valid boolean (expected true/false).`);
    }

    case InstrumentFieldType.SINGLE_SELECT:
      if (trimmed.length > 500) throw new ValidationError("Selected value exceeds 500 character limit.");
      return { ...EMPTY, valueText: trimmed };

    case InstrumentFieldType.MULTI_SELECT: {
      let parsed: unknown;
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        // Treat as comma-separated list if not valid JSON
        parsed = trimmed
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (!Array.isArray(parsed)) throw new ValidationError("Multi-select value must be an array.");
      return { ...EMPTY, valueJson: parsed as Prisma.InputJsonValue };
    }
  }
};

/**
 * Extract the display string from a typed RecordValue for rendering.
 * Returns null when the cell is empty.
 */
export const displayValue = (
  valueText: string | null,
  valueNumber: Prisma.Decimal | null | unknown,
  valueDate: Date | null,
  valueJson: unknown
): string | null => {
  if (valueText !== null) return valueText;
  if (valueNumber !== null && valueNumber !== undefined) return String(valueNumber);
  if (valueDate !== null)
    return valueDate instanceof Date ? valueDate.toISOString().split("T")[0] : String(valueDate);
  if (valueJson !== null && valueJson !== undefined) return JSON.stringify(valueJson);
  return null;
};
