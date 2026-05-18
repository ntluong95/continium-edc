import { describe, expect, it } from "vitest";
import { diffInstrumentVersions } from "./diff-instrument-versions";

describe("diffInstrumentVersions", () => {
  it("detects added, removed, and changed fields", () => {
    const before = [
      { key: "q1", label: "Age", type: "NUMBER", required: true, position: 1 },
      { key: "q2", label: "Visit date", type: "DATE", required: false, position: 2 },
      { key: "q3", label: "Legacy", type: "TEXT", required: false, position: 3 },
    ];
    const after = [
      { key: "q1", label: "Age (years)", type: "NUMBER", required: true, position: 1 },
      { key: "q2", label: "Visit date", type: "DATE", required: false, position: 2 },
      { key: "q4", label: "Consent", type: "BOOLEAN", required: true, position: 4 },
    ];

    const diff = diffInstrumentVersions(before, after);

    expect(diff.summary).toEqual({ added: 1, removed: 1, changed: 1 });
    expect(diff.entries).toEqual([
      expect.objectContaining({ key: "q1", kind: "changed" }),
      expect.objectContaining({ key: "q3", kind: "removed" }),
      expect.objectContaining({ key: "q4", kind: "added" }),
    ]);
  });

  it("returns an empty diff when the versions are structurally identical", () => {
    const fields = [{ key: "q1", label: "Age", type: "NUMBER", required: true, position: 1 }];
    const diff = diffInstrumentVersions(fields, fields);

    expect(diff.summary).toEqual({ added: 0, removed: 0, changed: 0 });
    expect(diff.entries).toEqual([]);
  });
});
