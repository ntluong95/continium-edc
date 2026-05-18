import { describe, expect, test } from "vitest";
import { getSourceFilterCriteria } from "./response-source-filter";

describe("getSourceFilterCriteria", () => {
  test("returns null for 'all'", () => {
    expect(getSourceFilterCriteria("all")).toBeNull();
  });

  test("returns equals(clinical_data_entry) for 'clinical'", () => {
    expect(getSourceFilterCriteria("clinical")).toEqual({
      source: { op: "equals", value: "clinical_data_entry" },
    });
  });

  test("returns notEquals(clinical_data_entry) for 'survey'", () => {
    expect(getSourceFilterCriteria("survey")).toEqual({
      source: { op: "notEquals", value: "clinical_data_entry" },
    });
  });
});
