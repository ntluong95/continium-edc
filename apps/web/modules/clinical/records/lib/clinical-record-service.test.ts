import { InstrumentFieldType } from "@prisma/client";
import { describe, expect, test } from "vitest";
import {
  mergeCellValueIntoResponseData,
  normalizeCellValueForResponse,
} from "./clinical-record-service";

describe("normalizeCellValueForResponse", () => {
  test("returns undefined for empty / whitespace input to signal cell deletion", () => {
    expect(normalizeCellValueForResponse(null, InstrumentFieldType.TEXT)).toBeUndefined();
    expect(normalizeCellValueForResponse("", InstrumentFieldType.TEXT)).toBeUndefined();
    expect(normalizeCellValueForResponse("   ", InstrumentFieldType.NUMBER)).toBeUndefined();
  });

  test("parses NUMBER inputs as JavaScript numbers when finite, otherwise keeps the string", () => {
    expect(normalizeCellValueForResponse("42", InstrumentFieldType.NUMBER)).toBe(42);
    expect(normalizeCellValueForResponse("-12.5", InstrumentFieldType.NUMBER)).toBe(-12.5);
    expect(normalizeCellValueForResponse("not-a-number", InstrumentFieldType.NUMBER)).toBe(
      "not-a-number"
    );
  });

  test("splits MULTI_SELECT comma lists, trimming and dropping empties", () => {
    expect(normalizeCellValueForResponse("foo,bar,baz", InstrumentFieldType.MULTI_SELECT)).toEqual([
      "foo",
      "bar",
      "baz",
    ]);
    expect(normalizeCellValueForResponse(" a , , b ", InstrumentFieldType.MULTI_SELECT)).toEqual([
      "a",
      "b",
    ]);
  });

  test("preserves true / false strings for BOOLEAN, passes other strings through", () => {
    expect(normalizeCellValueForResponse("true", InstrumentFieldType.BOOLEAN)).toBe("true");
    expect(normalizeCellValueForResponse("false", InstrumentFieldType.BOOLEAN)).toBe("false");
    expect(normalizeCellValueForResponse("unknown", InstrumentFieldType.BOOLEAN)).toBe("unknown");
  });

  test("trims string-shaped types (TEXT, SINGLE_SELECT, DATE)", () => {
    expect(normalizeCellValueForResponse("  hi  ", InstrumentFieldType.TEXT)).toBe("hi");
    expect(normalizeCellValueForResponse("  opt-a", InstrumentFieldType.SINGLE_SELECT)).toBe("opt-a");
    expect(normalizeCellValueForResponse("2024-01-01", InstrumentFieldType.DATE)).toBe(
      "2024-01-01"
    );
  });
});

describe("mergeCellValueIntoResponseData", () => {
  test("inserts a normalised value into an empty responses payload", () => {
    const next = mergeCellValueIntoResponseData(null, "field_age", "42", InstrumentFieldType.NUMBER);
    expect(next).toEqual({ field_age: 42 });
  });

  test("overwrites an existing key without mutating the original payload", () => {
    const current = { field_name: "Alice", field_age: 30 };
    const next = mergeCellValueIntoResponseData(
      current,
      "field_name",
      "Bob",
      InstrumentFieldType.TEXT
    );
    expect(next).toEqual({ field_name: "Bob", field_age: 30 });
    expect(current).toEqual({ field_name: "Alice", field_age: 30 });
  });

  test("removes the key when the normalised value is undefined (empty input)", () => {
    const current = { field_name: "Alice", field_age: 30 };
    const next = mergeCellValueIntoResponseData(current, "field_age", "", InstrumentFieldType.NUMBER);
    expect(next).toEqual({ field_name: "Alice" });
    expect("field_age" in next).toBe(false);
  });

  test("treats a non-object existing payload (array, scalar, null) as empty", () => {
    expect(
      mergeCellValueIntoResponseData(["unexpected"], "field_x", "1", InstrumentFieldType.TEXT)
    ).toEqual({ field_x: "1" });
    expect(
      mergeCellValueIntoResponseData("garbage" as never, "field_x", "1", InstrumentFieldType.TEXT)
    ).toEqual({ field_x: "1" });
  });
});
