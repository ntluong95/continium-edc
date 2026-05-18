import { describe, it, expect } from "vitest";
import { resolveClinicalPermission, type SimpleAccessRule } from "./rule-resolver";
import type { TClinicalPermission } from "./zod-schemas";

describe("Clinical Access Rule Integration", () => {
  const I1 = "instrument_X";
  const E1 = "event_Visit1";
  const E2 = "event_Visit2";

  describe("Scenario: User A has READ_WRITE on instrument X via project role", () => {
    it("should allow write to Visit1 when no rule exists for event", () => {
      const rules: SimpleAccessRule[] = [];
      const roleDefault: TClinicalPermission = "READ_WRITE";

      const result = resolveClinicalPermission(rules, { instrumentId: I1, eventId: E1 }, roleDefault);

      expect(result).toBe("READ_WRITE");
    });

    it("should allow write to Visit1 when rule only denies Visit2", () => {
      const rules: SimpleAccessRule[] = [
        { instrumentId: I1, eventId: E2, permission: "NO_ACCESS" },
      ];
      const roleDefault: TClinicalPermission = "READ_WRITE";

      const resultForVisit1 = resolveClinicalPermission(rules, { instrumentId: I1, eventId: E1 }, roleDefault);
      expect(resultForVisit1).toBe("READ_WRITE");

      const resultForVisit2 = resolveClinicalPermission(rules, { instrumentId: I1, eventId: E2 }, roleDefault);
      expect(resultForVisit2).toBe("NO_ACCESS");
    });

    it("should deny write to Visit2 when rule explicitly denies", () => {
      const rules: SimpleAccessRule[] = [
        { instrumentId: I1, eventId: E2, permission: "NO_ACCESS" },
      ];
      const roleDefault: TClinicalPermission = "READ_WRITE";

      const result = resolveClinicalPermission(rules, { instrumentId: I1, eventId: E2 }, roleDefault);

      expect(result).toBe("NO_ACCESS");
    });

    it("should apply additive narrowing - rule cannot expand beyond role", () => {
      const rules: SimpleAccessRule[] = [
        { instrumentId: I1, eventId: E2, permission: "READ_WRITE" },
      ];
      const roleDefault: TClinicalPermission = "READ";

      const result = resolveClinicalPermission(rules, { instrumentId: I1, eventId: E2 }, roleDefault);

      expect(result).toBe("READ");
    });
  });

  describe("Specificity hierarchy", () => {
    it("should prefer EventInstrument exact match over partial matches", () => {
      const rules: SimpleAccessRule[] = [
        { instrumentId: I1, eventId: null, permission: "NO_ACCESS" },
        { instrumentId: null, eventId: E1, permission: "NO_ACCESS" },
        { instrumentId: I1, eventId: E1, permission: "READ" },
      ];
      const roleDefault: TClinicalPermission = "READ_WRITE";

      const result = resolveClinicalPermission(rules, { instrumentId: I1, eventId: E1 }, roleDefault);

      expect(result).toBe("READ");
    });

    it("should combine partial matches and take most restrictive", () => {
      const rules: SimpleAccessRule[] = [
        { instrumentId: I1, eventId: null, permission: "READ" },
        { instrumentId: null, eventId: E1, permission: "NO_ACCESS" },
      ];
      const roleDefault: TClinicalPermission = "READ_WRITE";

      const result = resolveClinicalPermission(rules, { instrumentId: I1, eventId: E1 }, roleDefault);

      expect(result).toBe("NO_ACCESS");
    });
  });
});