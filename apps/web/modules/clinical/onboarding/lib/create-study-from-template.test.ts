import { InstrumentStatus, SurveyStatus, SurveyType } from "@prisma/client";
import { describe, expect, test, vi } from "vitest";
import { createStudyFromTemplate } from "./create-study-from-template";
import type { TClinicalTemplate } from "./template-types";

vi.mock("@/modules/clinical/subjects/lib/audit-events", () => ({
  logClinicalAuditEvent: vi.fn(),
}));

const template: TClinicalTemplate = {
  key: "longitudinal_2_arms",
  name: "Longitudinal Study with 2 Arms",
  description: "Demo",
  purpose: "research",
  source: {
    redcapDemo: "Demo",
    sourceFile: "redcap/redcap_v15.8.4/Resources/sql/create_demo_db2.sql",
  },
  arms: [
    {
      name: "Arm 1",
      position: 0,
      events: [
        {
          name: "Enrollment",
          position: 0,
          dayOffset: 0,
          windowDays: null,
          instrumentBindings: [
            { instrumentKey: "completion_project_questionnaire", required: true, repeating: false },
          ],
        },
      ],
    },
  ],
  instruments: [
    {
      key: "completion_project_questionnaire",
      displayName: "Completion Project Questionnaire",
      fields: [
        {
          key: "cpq1",
          label: "Date of study completion",
          type: "DATE",
          required: false,
          position: 0,
          validationCode: "date_ymd",
        },
        {
          key: "cpq2",
          label: "Transferrin (mg/dL)",
          type: "NUMBER",
          required: false,
          position: 1,
          validationCode: "int",
        },
      ],
    },
  ],
};

const makeTx = () => ({
  arm: {
    count: vi.fn().mockResolvedValue(0),
    create: vi.fn().mockResolvedValue({ id: "arm_1" }),
  },
  survey: {
    create: vi.fn().mockResolvedValue({ id: "survey_1" }),
  },
  instrument: {
    create: vi.fn().mockResolvedValue({ id: "instrument_1" }),
  },
  instrumentField: {
    createMany: vi.fn().mockResolvedValue({ count: 2 }),
  },
  event: {
    create: vi.fn().mockResolvedValue({ id: "event_1" }),
  },
  eventInstrument: {
    create: vi.fn().mockResolvedValue({}),
  },
});

describe("createStudyFromTemplate", () => {
  test("creates a published Survey, linked published Instrument, fields, and event binding", async () => {
    const tx = makeTx();

    await createStudyFromTemplate({
      tx: tx as never,
      studyId: "study_1",
      environmentId: "env_1",
      projectId: "project_1",
      actorId: "user_1",
      template,
    });

    expect(tx.survey.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          environmentId: "env_1",
          createdBy: "user_1",
          name: "Completion Project Questionnaire",
          type: SurveyType.link,
          status: SurveyStatus.inProgress,
          blocks: [
            expect.objectContaining({
              name: "Completion Project Questionnaire",
              elements: [
                expect.objectContaining({ id: "cpq1" }),
                expect.objectContaining({ id: "cpq2", inputType: "number" }),
              ],
            }),
          ],
        }),
      })
    );

    expect(tx.instrument.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          studyId: "study_1",
          surveyId: "survey_1",
          status: InstrumentStatus.PUBLISHED,
          publishedById: "user_1",
          name: "completion_project_questionnaire",
          sourceSurveyHash: "fake-hash",
          fieldHash: "fake-hash",
        }),
      })
    );

    expect(tx.instrumentField.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({ key: "cpq1", type: "DATE", validationCode: "date_ymd" }),
          expect.objectContaining({ key: "cpq2", type: "NUMBER", validationCode: "int" }),
        ],
      })
    );
    expect(tx.eventInstrument.create).toHaveBeenCalledWith({
      data: {
        eventId: "event_1",
        instrumentId: "instrument_1",
        required: true,
        repeating: false,
      },
    });
  });

  test("returns applied=true with summary counts when the template was materialised", async () => {
    const tx = makeTx();

    const result = await createStudyFromTemplate({
      tx: tx as never,
      studyId: "study_1",
      environmentId: "env_1",
      projectId: "project_1",
      actorId: "user_1",
      template,
    });

    expect(result).toEqual({
      applied: true,
      armsCreated: template.arms.length,
      instrumentsCreated: template.instruments.length,
    });
  });

  test("is idempotent: returns applied=false and writes nothing when the study already has arms", async () => {
    const tx = makeTx();
    // Simulate "already initialised" — the count check should fire before any
    // writes happen.
    tx.arm.count.mockResolvedValueOnce(2);

    const result = await createStudyFromTemplate({
      tx: tx as never,
      studyId: "study_1",
      environmentId: "env_1",
      projectId: "project_1",
      actorId: "user_1",
      template,
    });

    expect(result).toEqual({ applied: false, reason: "study_already_initialised" });
    expect(tx.survey.create).not.toHaveBeenCalled();
    expect(tx.instrument.create).not.toHaveBeenCalled();
    expect(tx.instrumentField.createMany).not.toHaveBeenCalled();
    expect(tx.arm.create).not.toHaveBeenCalled();
    expect(tx.event.create).not.toHaveBeenCalled();
    expect(tx.eventInstrument.create).not.toHaveBeenCalled();
  });

  test("auto-publishes every template instrument (Q1)", async () => {
    const tx = makeTx();

    await createStudyFromTemplate({
      tx: tx as never,
      studyId: "study_1",
      environmentId: "env_1",
      projectId: "project_1",
      actorId: "user_1",
      template,
    });

    // Each instrument.create call must request PUBLISHED status with a
    // publishedAt / publishedById set. We assert against the most recent call
    // because the template here has a single instrument.
    expect(tx.instrument.create).toHaveBeenCalledTimes(template.instruments.length);
    for (const call of tx.instrument.create.mock.calls) {
      const data = call[0]?.data;
      expect(data.status).toBe(InstrumentStatus.PUBLISHED);
      expect(data.publishedById).toBe("user_1");
      expect(data.publishedAt).toBeInstanceOf(Date);
    }

    // The linked Survey is also created in the publishable inProgress state so
    // data-entry-eligibility doesn't block subjects from entering data.
    for (const call of tx.survey.create.mock.calls) {
      expect(call[0]?.data?.status).toBe(SurveyStatus.inProgress);
    }
  });
});
