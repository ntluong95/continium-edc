import { describe, expect, it } from "vitest";
import {
  ENROLLMENT_TRANSITIONS,
  canTransition,
  getAllowedTransitions,
} from "./enrollment-state-machine";
import type { EnrollmentStatus } from "@prisma/client";

describe("ENROLLMENT_TRANSITIONS completeness", () => {
  const allStatuses: EnrollmentStatus[] = [
    "SCREENED", "ENROLLED", "ACTIVE", "COMPLETED",
    "SCREEN_FAIL", "WITHDRAWN", "LOST",
  ];

  it("covers every EnrollmentStatus as a key", () => {
    for (const status of allStatuses) {
      expect(ENROLLMENT_TRANSITIONS).toHaveProperty(status);
    }
  });

  it("terminal states have no outgoing transitions except WITHDRAWN→LOST", () => {
    expect(ENROLLMENT_TRANSITIONS.COMPLETED).toHaveLength(0);
    expect(ENROLLMENT_TRANSITIONS.SCREEN_FAIL).toHaveLength(0);
    expect(ENROLLMENT_TRANSITIONS.LOST).toHaveLength(0);
  });
});

describe("canTransition — legal paths", () => {
  const legal: [EnrollmentStatus, EnrollmentStatus][] = [
    ["SCREENED", "ENROLLED"],
    ["SCREENED", "SCREEN_FAIL"],
    ["ENROLLED", "ACTIVE"],
    ["ENROLLED", "WITHDRAWN"],
    ["ACTIVE", "COMPLETED"],
    ["ACTIVE", "WITHDRAWN"],
    ["WITHDRAWN", "LOST"],
  ];

  for (const [from, to] of legal) {
    it(`allows ${from} → ${to}`, () => {
      expect(canTransition(from, to)).toBe(true);
    });
  }
});

describe("canTransition — illegal paths", () => {
  const illegal: [EnrollmentStatus, EnrollmentStatus][] = [
    ["SCREENED", "ACTIVE"],
    ["SCREENED", "COMPLETED"],
    ["SCREENED", "WITHDRAWN"],
    ["SCREENED", "LOST"],
    ["ENROLLED", "SCREENED"],
    ["ENROLLED", "COMPLETED"],
    ["ACTIVE", "ENROLLED"],
    ["ACTIVE", "SCREENED"],
    ["COMPLETED", "ACTIVE"],
    ["COMPLETED", "SCREENED"],
    ["SCREEN_FAIL", "SCREENED"],
    ["SCREEN_FAIL", "ENROLLED"],
    ["LOST", "WITHDRAWN"],
    ["LOST", "SCREENED"],
    ["WITHDRAWN", "ACTIVE"],
    ["WITHDRAWN", "SCREENED"],
  ];

  for (const [from, to] of illegal) {
    it(`blocks ${from} → ${to}`, () => {
      expect(canTransition(from, to)).toBe(false);
    });
  }
});

describe("getAllowedTransitions", () => {
  it("returns correct options for SCREENED", () => {
    expect(getAllowedTransitions("SCREENED")).toEqual(["ENROLLED", "SCREEN_FAIL"]);
  });

  it("returns empty array for COMPLETED (terminal)", () => {
    expect(getAllowedTransitions("COMPLETED")).toHaveLength(0);
  });

  it("returns LOST for WITHDRAWN", () => {
    expect(getAllowedTransitions("WITHDRAWN")).toEqual(["LOST"]);
  });
});
