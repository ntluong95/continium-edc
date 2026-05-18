import { RecordStatus } from "@prisma/client";
import { describe, expect, test, vi } from "vitest";
import {
  CLINICAL_RESPONSE_SOURCE,
  isClinicalResponseFinished,
  upsertClinicalResponseForRecord,
} from "./clinical-response-sync";

const baseRecord = {
  id: "record_1",
  responseId: null,
  projectId: "project_1",
  subjectId: "subject_1",
  eventId: "event_1",
  instrumentId: "instrument_1",
  instance: 1,
  status: RecordStatus.INCOMPLETE,
  subject: { id: "subject_1", externalId: "SUBJ-001", contactId: "contact_1" },
  event: { id: "event_1", name: "Baseline", armId: "arm_1", arm: { id: "arm_1", name: "Arm A" } },
  instrument: {
    id: "instrument_1",
    name: "baseline_data",
    displayName: "Baseline Data",
    surveyId: "survey_1",
  },
};

const createTx = () =>
  ({
    $executeRaw: vi.fn(),
    response: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    record: {
      update: vi.fn(),
    },
  }) as any;

describe("upsertClinicalResponseForRecord", () => {
  test("creates a Formbricks response and links it to the clinical record", async () => {
    const tx = createTx();
    tx.response.findUnique.mockResolvedValue(null);
    tx.response.create.mockResolvedValue({ id: "response_1", surveyId: "survey_1" });

    const result = await upsertClinicalResponseForRecord({
      tx,
      record: baseRecord as any,
      responseData: { field_1: "yes" },
      finished: false,
      userId: "user_1",
      environmentId: "environment_1",
      projectId: "project_1",
    });

    expect(result).toEqual({ id: "response_1", surveyId: "survey_1" });
    expect(tx.response.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        surveyId: "survey_1",
        singleUseId: "clinical-record:record_1",
        contactId: "contact_1",
        data: { field_1: "yes" },
        finished: false,
        language: "default",
        meta: expect.objectContaining({
          source: CLINICAL_RESPONSE_SOURCE,
          recordId: "record_1",
          subjectId: "subject_1",
          subjectExternalId: "SUBJ-001",
          eventId: "event_1",
          eventName: "Baseline",
          armId: "arm_1",
          armName: "Arm A",
          instrumentId: "instrument_1",
          instrumentName: "Baseline Data",
          instance: 1,
          enteredByUserId: "user_1",
          environmentId: "environment_1",
          projectId: "project_1",
        }),
      }),
      select: { id: true, surveyId: true },
    });
    expect(tx.record.update).toHaveBeenCalledWith({
      where: { id: "record_1" },
      data: { responseId: "response_1" },
    });
  });

  test("updates the existing linked response instead of creating a duplicate", async () => {
    const tx = createTx();
    tx.response.findUnique.mockResolvedValueOnce({ id: "response_1" });
    tx.response.update.mockResolvedValue({ id: "response_1", surveyId: "survey_1" });

    await upsertClinicalResponseForRecord({
      tx,
      record: { ...baseRecord, responseId: "response_1", status: RecordStatus.COMPLETE } as any,
      responseData: { field_1: "done" },
      finished: true,
      userId: "user_1",
      environmentId: "environment_1",
      projectId: "project_1",
    });

    expect(tx.response.create).not.toHaveBeenCalled();
    expect(tx.response.update).toHaveBeenCalledWith({
      where: { id: "response_1" },
      data: expect.objectContaining({
        data: { field_1: "done" },
        finished: true,
      }),
      select: { id: true, surveyId: true },
    });
    expect(tx.record.update).not.toHaveBeenCalled();
  });

  test("reuses a response found by the clinical single-use guard when record.responseId is missing", async () => {
    const tx = createTx();
    tx.response.findUnique.mockResolvedValueOnce({ id: "response_1" });
    tx.response.update.mockResolvedValue({ id: "response_1", surveyId: "survey_1" });

    await upsertClinicalResponseForRecord({
      tx,
      record: baseRecord as any,
      responseData: { field_1: "updated" },
      finished: false,
      userId: "user_1",
      environmentId: "environment_1",
      projectId: "project_1",
    });

    expect(tx.response.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "response_1" },
      })
    );
    expect(tx.record.update).toHaveBeenCalledWith({
      where: { id: "record_1" },
      data: { responseId: "response_1" },
    });
  });

  test("skips legacy standalone instruments that are not linked to a survey", async () => {
    const tx = createTx();

    const result = await upsertClinicalResponseForRecord({
      tx,
      record: { ...baseRecord, instrument: { ...baseRecord.instrument, surveyId: null } } as any,
      responseData: { field_1: "value" },
      finished: false,
      userId: "user_1",
      environmentId: "environment_1",
      projectId: "project_1",
    });

    expect(result).toBeNull();
    expect(tx.response.create).not.toHaveBeenCalled();
    expect(tx.record.update).not.toHaveBeenCalled();
  });
});

describe("isClinicalResponseFinished", () => {
  test("treats COMPLETE as the only finished analytics state", () => {
    expect(isClinicalResponseFinished(RecordStatus.COMPLETE)).toBe(true);
    expect(isClinicalResponseFinished(RecordStatus.INCOMPLETE)).toBe(false);
    expect(isClinicalResponseFinished(RecordStatus.UNVERIFIED)).toBe(false);
    expect(isClinicalResponseFinished(RecordStatus.LOCKED)).toBe(false);
  });
});

describe("upsertClinicalResponseForRecord idempotency", () => {
  test("back-to-back calls for the same record produce a single Response row", async () => {
    // Mimic the second call seeing the record.responseId populated by the
    // first call — the same shape the action layer hands over once the
    // record.update has committed inside the transaction.
    let recordResponseId: string | null = null;
    const tx = {
      $executeRaw: vi.fn(),
      response: {
        findUnique: vi.fn().mockImplementation(async ({ where }: { where: { id?: string } }) => {
          if (where.id && where.id === recordResponseId) return { id: recordResponseId };
          return null;
        }),
        create: vi.fn().mockImplementation(async () => {
          recordResponseId = "response_1";
          return { id: "response_1", surveyId: "survey_1" };
        }),
        update: vi.fn().mockResolvedValue({ id: "response_1", surveyId: "survey_1" }),
      },
      record: {
        update: vi.fn().mockImplementation(async () => {
          // mirrors the post-create record patch in upsertClinicalResponseForRecord
        }),
      },
    } as any;

    await upsertClinicalResponseForRecord({
      tx,
      record: baseRecord as any,
      responseData: { field_1: "draft" },
      finished: false,
      userId: "user_1",
      environmentId: "environment_1",
      projectId: "project_1",
    });

    await upsertClinicalResponseForRecord({
      tx,
      record: { ...baseRecord, responseId: recordResponseId } as any,
      responseData: { field_1: "submitted" },
      finished: true,
      userId: "user_1",
      environmentId: "environment_1",
      projectId: "project_1",
    });

    expect(tx.response.create).toHaveBeenCalledTimes(1);
    expect(tx.response.update).toHaveBeenCalledTimes(1);
    expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
  });

  test("creates a new Response when the linked one was hard-deleted", async () => {
    // Simulates a hard purge of the Formbricks Response while the clinical
    // Record kept the dangling responseId. The next sync should detect that
    // the linked response is gone and recreate it, then update record.responseId.
    const tx = {
      $executeRaw: vi.fn(),
      response: {
        findUnique: vi
          .fn()
          // first lookup: record.responseId hit returns null (response deleted)
          .mockResolvedValueOnce(null)
          // second lookup: surveyId+singleUseId guard also returns null
          .mockResolvedValueOnce(null),
        create: vi.fn().mockResolvedValue({ id: "response_2", surveyId: "survey_1" }),
        update: vi.fn(),
      },
      record: {
        update: vi.fn(),
      },
    } as any;

    const result = await upsertClinicalResponseForRecord({
      tx,
      record: { ...baseRecord, responseId: "response_stale" } as any,
      responseData: { field_1: "after purge" },
      finished: false,
      userId: "user_1",
      environmentId: "environment_1",
      projectId: "project_1",
    });

    expect(result).toEqual({ id: "response_2", surveyId: "survey_1" });
    expect(tx.response.create).toHaveBeenCalledTimes(1);
    expect(tx.response.update).not.toHaveBeenCalled();
    expect(tx.record.update).toHaveBeenCalledWith({
      where: { id: "record_1" },
      data: { responseId: "response_2" },
    });
  });
});
