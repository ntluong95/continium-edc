import { RecordStatus } from "@prisma/client";
import { describe, expect, test } from "vitest";
import { canTransitionRecordStatus, getNextRecordStatuses } from "./record-status-machine";

describe("record status machine — completion workflow", () => {
  test("INCOMPLETE → UNVERIFIED is allowed", () => {
    expect(canTransitionRecordStatus(RecordStatus.INCOMPLETE, RecordStatus.UNVERIFIED)).toBe(true);
  });

  test("UNVERIFIED → COMPLETE is allowed", () => {
    expect(canTransitionRecordStatus(RecordStatus.UNVERIFIED, RecordStatus.COMPLETE)).toBe(true);
  });

  test("COMPLETE → UNVERIFIED is allowed (re-open for review)", () => {
    expect(canTransitionRecordStatus(RecordStatus.COMPLETE, RecordStatus.UNVERIFIED)).toBe(true);
  });

  test("COMPLETE → INCOMPLETE is allowed (re-open for editing)", () => {
    expect(canTransitionRecordStatus(RecordStatus.COMPLETE, RecordStatus.INCOMPLETE)).toBe(true);
  });
});

describe("record status machine — lock policy (B2: require COMPLETE before LOCKED)", () => {
  test("COMPLETE → LOCKED is the only path into LOCKED", () => {
    expect(canTransitionRecordStatus(RecordStatus.COMPLETE, RecordStatus.LOCKED)).toBe(true);
  });

  test("INCOMPLETE → LOCKED is now rejected (must promote to COMPLETE first)", () => {
    expect(canTransitionRecordStatus(RecordStatus.INCOMPLETE, RecordStatus.LOCKED)).toBe(false);
  });

  test("UNVERIFIED → LOCKED is now rejected", () => {
    expect(canTransitionRecordStatus(RecordStatus.UNVERIFIED, RecordStatus.LOCKED)).toBe(false);
  });

  test("LOCKED → INCOMPLETE is the only path out of LOCKED (Unlock button)", () => {
    expect(canTransitionRecordStatus(RecordStatus.LOCKED, RecordStatus.INCOMPLETE)).toBe(true);
  });

  test("LOCKED → COMPLETE / UNVERIFIED is rejected (unlock returns to INCOMPLETE)", () => {
    expect(canTransitionRecordStatus(RecordStatus.LOCKED, RecordStatus.COMPLETE)).toBe(false);
    expect(canTransitionRecordStatus(RecordStatus.LOCKED, RecordStatus.UNVERIFIED)).toBe(false);
  });

  test("getNextRecordStatuses(LOCKED) returns the unlock path only", () => {
    expect(getNextRecordStatuses(RecordStatus.LOCKED)).toEqual([RecordStatus.INCOMPLETE]);
  });

  test("getNextRecordStatuses(INCOMPLETE) and (UNVERIFIED) do not include LOCKED", () => {
    expect(getNextRecordStatuses(RecordStatus.INCOMPLETE)).not.toContain(RecordStatus.LOCKED);
    expect(getNextRecordStatuses(RecordStatus.UNVERIFIED)).not.toContain(RecordStatus.LOCKED);
  });

  test("getNextRecordStatuses(COMPLETE) includes LOCKED", () => {
    expect(getNextRecordStatuses(RecordStatus.COMPLETE)).toContain(RecordStatus.LOCKED);
  });
});

describe("record status machine — invariants", () => {
  test("no-op transitions (X → X) are always valid", () => {
    expect(canTransitionRecordStatus(RecordStatus.COMPLETE, RecordStatus.COMPLETE)).toBe(true);
    expect(canTransitionRecordStatus(RecordStatus.LOCKED, RecordStatus.LOCKED)).toBe(true);
  });
});
