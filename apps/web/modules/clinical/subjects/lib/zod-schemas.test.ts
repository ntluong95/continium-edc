import { describe, expect, it } from "vitest";
import {
  ZCreateSubjectInput,
  ZEnrollmentActionInput,
  ZEnrollmentTransitionInput,
  ZLinkSubjectContactInput,
} from "./zod-schemas";

const cuid = () => "clzt0000000000000000000000";

describe("ZCreateSubjectInput", () => {
  it("accepts valid minimal input", () => {
    expect(
      ZCreateSubjectInput.safeParse({ externalId: "SITE01-0001", armId: cuid() }).success
    ).toBe(true);
  });

  it("accepts with optional contactId", () => {
    expect(
      ZCreateSubjectInput.safeParse({
        externalId: "SITE01-0002",
        armId: cuid(),
        contactId: cuid(),
      }).success
    ).toBe(true);
  });

  it("trims whitespace from externalId", () => {
    const result = ZCreateSubjectInput.safeParse({
      externalId: "  ID-001  ",
      armId: cuid(),
    });
    expect(result.success && result.data.externalId).toBe("ID-001");
  });

  it("rejects empty externalId", () => {
    expect(ZCreateSubjectInput.safeParse({ externalId: "", armId: cuid() }).success).toBe(false);
  });

  it("rejects externalId longer than 120 chars", () => {
    expect(
      ZCreateSubjectInput.safeParse({ externalId: "x".repeat(121), armId: cuid() }).success
    ).toBe(false);
  });

  it("rejects invalid armId", () => {
    expect(
      ZCreateSubjectInput.safeParse({ externalId: "ID-001", armId: "not-a-cuid" }).success
    ).toBe(false);
  });
});

describe("ZLinkSubjectContactInput", () => {
  it("accepts valid pair", () => {
    expect(
      ZLinkSubjectContactInput.safeParse({ subjectId: cuid(), contactId: cuid() }).success
    ).toBe(true);
  });

  it("accepts null contactId for unlinking", () => {
    expect(
      ZLinkSubjectContactInput.safeParse({ subjectId: cuid(), contactId: null }).success
    ).toBe(true);
  });

  it("rejects invalid subjectId", () => {
    expect(
      ZLinkSubjectContactInput.safeParse({ subjectId: "bad", contactId: cuid() }).success
    ).toBe(false);
  });
});

describe("ZEnrollmentActionInput", () => {
  it("accepts valid input", () => {
    expect(ZEnrollmentActionInput.safeParse({ enrollmentId: cuid() }).success).toBe(true);
  });

  it("rejects invalid enrollmentId", () => {
    expect(ZEnrollmentActionInput.safeParse({ enrollmentId: "bad" }).success).toBe(false);
  });
});

describe("ZEnrollmentTransitionInput", () => {
  it("accepts legal transition without reason", () => {
    expect(
      ZEnrollmentTransitionInput.safeParse({ enrollmentId: cuid(), toStatus: "ENROLLED" }).success
    ).toBe(true);
  });

  it("accepts WITHDRAWN with reason", () => {
    expect(
      ZEnrollmentTransitionInput.safeParse({
        enrollmentId: cuid(),
        toStatus: "WITHDRAWN",
        reason: "Adverse event",
      }).success
    ).toBe(true);
  });

  it("accepts SCREEN_FAIL with reason", () => {
    expect(
      ZEnrollmentTransitionInput.safeParse({
        enrollmentId: cuid(),
        toStatus: "SCREEN_FAIL",
        reason: "Did not meet inclusion criteria",
      }).success
    ).toBe(true);
  });

  it("rejects WITHDRAWN without reason", () => {
    expect(
      ZEnrollmentTransitionInput.safeParse({ enrollmentId: cuid(), toStatus: "WITHDRAWN" }).success
    ).toBe(false);
  });

  it("rejects SCREEN_FAIL without reason", () => {
    expect(
      ZEnrollmentTransitionInput.safeParse({ enrollmentId: cuid(), toStatus: "SCREEN_FAIL" }).success
    ).toBe(false);
  });

  it("rejects WITHDRAWN with blank reason", () => {
    expect(
      ZEnrollmentTransitionInput.safeParse({
        enrollmentId: cuid(),
        toStatus: "WITHDRAWN",
        reason: "   ",
      }).success
    ).toBe(false);
  });

  it("rejects invalid toStatus", () => {
    expect(
      ZEnrollmentTransitionInput.safeParse({
        enrollmentId: cuid(),
        toStatus: "RANDOMIZED",
      }).success
    ).toBe(false);
  });

  it("rejects reason longer than 500 chars", () => {
    expect(
      ZEnrollmentTransitionInput.safeParse({
        enrollmentId: cuid(),
        toStatus: "WITHDRAWN",
        reason: "x".repeat(501),
      }).success
    ).toBe(false);
  });
});
