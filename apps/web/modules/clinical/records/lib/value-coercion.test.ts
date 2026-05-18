import { InstrumentFieldType, Prisma } from "@prisma/client";
import { describe, expect, test } from "vitest";
import { coerceValue, displayValue } from "./value-coercion";

describe("coerceValue", () => {
  test("clears all typed columns for blank values", () => {
    expect(coerceValue("   ", InstrumentFieldType.TEXT)).toEqual({
      valueText: null,
      valueNumber: null,
      valueDate: null,
      valueJson: null,
    });
  });

  test("maps text, number, date, and boolean fields to typed columns", () => {
    expect(coerceValue("hello", InstrumentFieldType.TEXT).valueText).toBe("hello");
    expect(coerceValue("12.50", InstrumentFieldType.NUMBER).valueNumber).toEqual(new Prisma.Decimal("12.50"));
    expect(coerceValue("2026-04-28", InstrumentFieldType.DATE).valueDate?.toISOString()).toContain(
      "2026-04-28"
    );
    expect(coerceValue("yes", InstrumentFieldType.BOOLEAN).valueJson).toBe(true);
  });

  test("maps select fields to text/json payloads", () => {
    expect(coerceValue("choice-a", InstrumentFieldType.SINGLE_SELECT).valueText).toBe("choice-a");
    expect(coerceValue("a, b, c", InstrumentFieldType.MULTI_SELECT).valueJson).toEqual(["a", "b", "c"]);
    expect(coerceValue('["a","b"]', InstrumentFieldType.MULTI_SELECT).valueJson).toEqual(["a", "b"]);
  });

  test("rejects invalid numbers, dates, booleans, and multi-select payloads", () => {
    expect(() => coerceValue("abc", InstrumentFieldType.NUMBER)).toThrow("valid number");
    expect(() => coerceValue("not-a-date", InstrumentFieldType.DATE)).toThrow("valid date");
    expect(() => coerceValue("maybe", InstrumentFieldType.BOOLEAN)).toThrow("valid boolean");
    expect(() => coerceValue('{"a":1}', InstrumentFieldType.MULTI_SELECT)).toThrow("array");
  });

  test("accepts strict ISO date-only and datetime forms", () => {
    expect(coerceValue("2026-04-28", InstrumentFieldType.DATE).valueDate?.toISOString()).toBe(
      "2026-04-28T00:00:00.000Z"
    );
    expect(
      coerceValue("2026-04-28T09:30:00Z", InstrumentFieldType.DATE).valueDate?.toISOString()
    ).toBe("2026-04-28T09:30:00.000Z");
    expect(
      coerceValue("2026-04-28T09:30:00+02:00", InstrumentFieldType.DATE).valueDate?.toISOString()
    ).toBe("2026-04-28T07:30:00.000Z");
  });

  test("rejects loose date strings that the legacy parser accepted", () => {
    // The legacy `new Date(...)` parser accepted natural-language inputs,
    // two-digit years, and impossible calendar dates. The strict parser
    // refuses all of them.
    expect(() => coerceValue("April 28 2026", InstrumentFieldType.DATE)).toThrow("valid date");
    expect(() => coerceValue("04/28/2026", InstrumentFieldType.DATE)).toThrow("valid date");
    expect(() => coerceValue("26-04-28", InstrumentFieldType.DATE)).toThrow("valid date");
    expect(() => coerceValue("2026-02-30", InstrumentFieldType.DATE)).toThrow("valid date");
    expect(() => coerceValue("2026-13-01", InstrumentFieldType.DATE)).toThrow("valid date");
    expect(() => coerceValue("2026-04-32", InstrumentFieldType.DATE)).toThrow("valid date");
    expect(() => coerceValue("Saturday", InstrumentFieldType.DATE)).toThrow("valid date");
  });
});

describe("displayValue", () => {
  test("formats the first non-empty typed column", () => {
    expect(displayValue("abc", null, null, null)).toBe("abc");
    expect(displayValue(null, new Prisma.Decimal("10.5"), null, null)).toBe("10.5");
    expect(displayValue(null, null, new Date("2026-04-28T00:00:00Z"), null)).toBe("2026-04-28");
    expect(displayValue(null, null, null, ["a", "b"])).toBe('["a","b"]');
  });
});
