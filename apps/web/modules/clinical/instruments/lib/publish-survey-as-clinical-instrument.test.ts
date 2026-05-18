import { InstrumentStatus } from "@prisma/client";
import { describe, expect, test, vi } from "vitest";

const $transactionMock = vi.fn();
const $executeRawMock = vi.fn();
const studyFindUniqueMock = vi.fn();
const instrumentFindFirstMock = vi.fn();
const instrumentAggregateMock = vi.fn();
const instrumentCreateMock = vi.fn();
const instrumentFieldCreateManyMock = vi.fn();

vi.mock("@continium/database", () => ({
  prisma: {
    $transaction: (fn: (tx: unknown) => unknown) => $transactionMock(fn),
  },
}));

vi.mock("@/modules/clinical/subjects/lib/audit-events", () => ({
  logClinicalAuditEvent: vi.fn(),
}));

vi.mock("./snapshot-from-survey", () => ({
  buildSurveySourceHash: () => "sha256:source",
  snapshotFromSurvey: () => ({
    fields: [
      {
        key: "field_one",
        label: "Field One",
        type: "TEXT",
        validationCode: null,
        required: true,
        position: 0,
        choicesJson: null,
        branchingJson: null,
      },
    ],
    fieldHash: "sha256:fields",
    warnings: [],
  }),
}));

import {
  buildClinicalPublishLockKey,
  publishSurveyAsClinicalInstrument,
} from "./publish-survey-as-clinical-instrument";

describe("buildClinicalPublishLockKey", () => {
  test("produces a deterministic key derived from study + survey", () => {
    expect(buildClinicalPublishLockKey("study_1", "survey_1")).toBe(
      "clinical-publish:study_1:survey_1"
    );
  });

  test("differs when either input differs", () => {
    expect(buildClinicalPublishLockKey("study_1", "survey_1")).not.toBe(
      buildClinicalPublishLockKey("study_1", "survey_2")
    );
    expect(buildClinicalPublishLockKey("study_1", "survey_1")).not.toBe(
      buildClinicalPublishLockKey("study_2", "survey_1")
    );
  });
});

describe("publishSurveyAsClinicalInstrument advisory lock", () => {
  test("acquires the pg_advisory_xact_lock before reading instrument state", async () => {
    const orderedCalls: string[] = [];

    studyFindUniqueMock.mockImplementation(async () => {
      orderedCalls.push("study.findUnique");
      return { id: "study_1" };
    });
    $executeRawMock.mockImplementation(async (strings: TemplateStringsArray) => {
      orderedCalls.push(`$executeRaw:${strings.join("?")}`);
      return 0;
    });
    instrumentFindFirstMock.mockImplementation(async () => {
      orderedCalls.push("instrument.findFirst");
      return null;
    });
    instrumentAggregateMock.mockResolvedValue({ _max: { version: null } });
    instrumentCreateMock.mockResolvedValue({
      id: "instrument_1",
      version: 1,
      status: InstrumentStatus.PUBLISHED,
    });
    instrumentFieldCreateManyMock.mockResolvedValue({ count: 1 });

    const tx = {
      $executeRaw: $executeRawMock,
      study: { findUnique: studyFindUniqueMock },
      instrument: {
        findFirst: instrumentFindFirstMock,
        aggregate: instrumentAggregateMock,
        create: instrumentCreateMock,
      },
      instrumentField: { createMany: instrumentFieldCreateManyMock },
    };

    $transactionMock.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(tx));

    await publishSurveyAsClinicalInstrument({
      survey: { id: "survey_1", name: "Demographics", blocks: [] },
      projectId: "project_1",
      actorId: "user_1",
    });

    expect(orderedCalls[0]).toBe("study.findUnique");
    // The advisory lock must be acquired before any instrument read so that
    // concurrent publishes see the same serialized window.
    expect(orderedCalls[1]).toMatch(/\$executeRaw:.*pg_advisory_xact_lock/);
    expect(orderedCalls[2]).toBe("instrument.findFirst");

    // The lock query should use hashtext against the per-(study, survey) key.
    const lockCall = $executeRawMock.mock.calls[0]?.[0] as TemplateStringsArray;
    expect(lockCall.join("?")).toContain("pg_advisory_xact_lock(hashtext(");
    expect($executeRawMock.mock.calls[0]?.[1]).toBe(
      buildClinicalPublishLockKey("study_1", "survey_1")
    );
  });

  test("returns null without acquiring the lock when the project has no study", async () => {
    $executeRawMock.mockClear();
    studyFindUniqueMock.mockResolvedValueOnce(null);

    const tx = {
      $executeRaw: $executeRawMock,
      study: { findUnique: studyFindUniqueMock },
      instrument: {
        findFirst: instrumentFindFirstMock,
        aggregate: instrumentAggregateMock,
        create: instrumentCreateMock,
      },
      instrumentField: { createMany: instrumentFieldCreateManyMock },
    };

    $transactionMock.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(tx));

    const result = await publishSurveyAsClinicalInstrument({
      survey: { id: "survey_1", name: "Demographics", blocks: [] },
      projectId: "project_unknown",
      actorId: "user_1",
    });

    expect(result).toBeNull();
    expect($executeRawMock).not.toHaveBeenCalled();
  });
});
