import { describe, it, expect } from "vitest";
import { resolveClinicalPermission, SimpleAccessRule } from "./rule-resolver";

describe("resolveClinicalPermission", () => {
  const I1 = "instrument_1";
  const I2 = "instrument_2";
  const E1 = "event_1";
  const E2 = "event_2";

  it("should return role default when no rules are provided", () => {
    expect(
      resolveClinicalPermission([], { instrumentId: I1, eventId: E1 }, "READ_WRITE")
    ).toBe("READ_WRITE");
  });

  it("should apply EventInstrument exact match over partial matches", () => {
    const rules: SimpleAccessRule[] = [
      { instrumentId: I1, eventId: null, permission: "NO_ACCESS" },
      { instrumentId: null, eventId: E1, permission: "READ" },
      { instrumentId: I1, eventId: E1, permission: "READ_WRITE" },
    ];
    // Exact match says READ_WRITE, but roleDefault is READ, so it narrows to READ.
    // Wait, if exact match is READ_WRITE and roleDefault is READ_WRITE, it returns READ_WRITE.
    expect(
      resolveClinicalPermission(rules, { instrumentId: I1, eventId: E1 }, "READ_WRITE")
    ).toBe("READ_WRITE");
  });

  it("should narrow the role default even if rule grants more", () => {
    const rules: SimpleAccessRule[] = [
      { instrumentId: I1, eventId: E1, permission: "READ_WRITE" },
    ];
    // Role default is READ. Rule is READ_WRITE. Should return READ (additive narrowing).
    expect(
      resolveClinicalPermission(rules, { instrumentId: I1, eventId: E1 }, "READ")
    ).toBe("READ");
  });

  it("should combine partial matches and take the most restrictive", () => {
    const rules: SimpleAccessRule[] = [
      { instrumentId: I1, eventId: null, permission: "READ" },
      { instrumentId: null, eventId: E1, permission: "NO_ACCESS" },
    ];
    // Event rule denies access.
    expect(
      resolveClinicalPermission(rules, { instrumentId: I1, eventId: E1 }, "READ_WRITE")
    ).toBe("NO_ACCESS");
  });

  it("should ignore rules that do not match", () => {
    const rules: SimpleAccessRule[] = [
      { instrumentId: I2, eventId: null, permission: "NO_ACCESS" },
      { instrumentId: null, eventId: E2, permission: "NO_ACCESS" },
    ];
    expect(
      resolveClinicalPermission(rules, { instrumentId: I1, eventId: E1 }, "READ_WRITE")
    ).toBe("READ_WRITE");
  });

  it("should work for instrument-only queries", () => {
    const rules: SimpleAccessRule[] = [
      { instrumentId: I1, eventId: null, permission: "READ" },
      { instrumentId: I1, eventId: E1, permission: "NO_ACCESS" },
    ];
    // Query only provides instrumentId
    expect(
      resolveClinicalPermission(rules, { instrumentId: I1 }, "READ_WRITE")
    ).toBe("READ");
  });

  it("should work for event-only queries", () => {
    const rules: SimpleAccessRule[] = [
      { instrumentId: null, eventId: E1, permission: "NO_ACCESS" },
    ];
    expect(
      resolveClinicalPermission(rules, { eventId: E1 }, "READ_WRITE")
    ).toBe("NO_ACCESS");
  });
});
