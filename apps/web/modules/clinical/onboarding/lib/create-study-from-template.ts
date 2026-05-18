import "server-only";
import {
  AuditEvent,
  type InstrumentFieldType,
  InstrumentStatus,
  Prisma,
  SurveyStatus,
  SurveyType,
} from "@prisma/client";
import {
  type TInstrumentSnapshotField,
  buildInstrumentFieldHash,
  buildSurveySourceHash,
} from "@/modules/clinical/instruments/lib/snapshot-from-survey";
import type { ClinicalTx } from "@/modules/clinical/lib/clinical-tx";
import { logClinicalAuditEvent } from "@/modules/clinical/subjects/lib/audit-events";
import { buildSurveyBlocksFromTemplateInstrument } from "./template-survey-builder";
import type { TClinicalTemplate } from "./template-types";

interface CreateStudyFromTemplateParams {
  tx: ClinicalTx;
  studyId: string;
  environmentId: string;
  projectId: string;
  actorId: string;
  template: TClinicalTemplate;
}

export type CreateStudyFromTemplateResult =
  | { applied: true; instrumentsCreated: number; armsCreated: number }
  | { applied: false; reason: "study_already_initialised" };

/**
 * Materializes a clinical template into Arm/Event/Instrument/InstrumentField/EventInstrument
 * rows for the given study. Caller MUST run this inside a clinical transaction; this helper
 * does not open one.
 *
 * Idempotency: if the study already has arms (i.e. the template has already been applied or
 * the coordinator built the protocol by hand) this is a no-op and returns
 * `{ applied: false, reason: "study_already_initialised" }`. Callers that expect a fresh
 * apply (typically the onboarding action, which guards via
 * `clinicalProjectOnboarding.completedAt`) get a clean result; callers that retry can rely
 * on the idempotent behaviour.
 *
 * Auto-publishes every template-derived instrument (Q1 decision in
 * `changes/refactor-pr-breakdown.md`) so coordinators can immediately enter data without a
 * manual publish step.
 */
export const createStudyFromTemplate = async ({
  tx,
  studyId,
  environmentId,
  projectId,
  actorId,
  template,
}: CreateStudyFromTemplateParams): Promise<CreateStudyFromTemplateResult> => {
  const existingArmCount = await tx.arm.count({ where: { studyId } });
  if (existingArmCount > 0) {
    return { applied: false, reason: "study_already_initialised" };
  }

  const instrumentIdByKey = new Map<string, string>();

  for (const [instrumentIdx, templateInstrument] of template.instruments.entries()) {
    const blocks = buildSurveyBlocksFromTemplateInstrument(templateInstrument);
    const templateFields = templateInstrument.fields.map((field, fieldIdx) => ({
      key: field.key,
      label: field.label,
      type: field.type as InstrumentFieldType,
      validationCode: field.validationCode ?? null,
      required: field.required,
      position: field.position ?? fieldIdx,
      choicesJson: field.choicesJson ?? null,
      branchingJson: field.branchingJson ?? null,
    })) satisfies TInstrumentSnapshotField[];

    const survey = await tx.survey.create({
      data: {
        environmentId,
        createdBy: actorId,
        name: templateInstrument.displayName,
        type: SurveyType.link,
        status: SurveyStatus.inProgress,
        welcomeCard: {
          enabled: false,
          headline: { default: "" },
          subheader: { default: "" },
          buttonLabel: { default: "" },
          timeToFinish: false,
          showResponseCount: false,
        },
        questions: [],
        blocks,
        endings: [],
        hiddenFields: { enabled: false, fieldIds: [] },
        variables: [],
      },
      select: { id: true },
    });

    const instrument = await tx.instrument.create({
      data: {
        studyId,
        surveyId: survey.id,
        version: 1,
        status: InstrumentStatus.PUBLISHED,
        publishedAt: new Date(),
        publishedById: actorId,
        name: templateInstrument.key,
        displayName: templateInstrument.displayName,
        sourceSurveyHash: buildSurveySourceHash({
          name: templateInstrument.displayName,
          blocks,
        }),
        fieldHash: buildInstrumentFieldHash(templateFields),
      },
      select: { id: true },
    });
    instrumentIdByKey.set(templateInstrument.key, instrument.id);

    if (templateInstrument.fields.length > 0) {
      await tx.instrumentField.createMany({
        data: templateInstrument.fields.map((field, fieldIdx) => ({
          instrumentId: instrument.id,
          key: field.key,
          label: field.label,
          type: field.type as InstrumentFieldType,
          validationCode: field.validationCode ?? null,
          required: field.required,
          position: field.position ?? fieldIdx,
          choicesJson: field.choicesJson
            ? (field.choicesJson as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          branchingJson: field.branchingJson
            ? (field.branchingJson as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        })),
      });
    }

    await logClinicalAuditEvent({
      db: tx,
      event: AuditEvent.INSTRUMENT_PUBLISHED,
      actorId,
      projectId,
      resourceId: instrument.id,
      resourceType: "Instrument",
      metadata: {
        templateKey: template.key,
        surveyId: survey.id,
        templateInstrumentKey: templateInstrument.key,
        templateInstrumentIndex: instrumentIdx,
      },
    });
  }

  for (const [armIdx, templateArm] of template.arms.entries()) {
    const arm = await tx.arm.create({
      data: {
        studyId,
        name: dedupeWithinScope(templateArm.name, armIdx),
        position: templateArm.position ?? armIdx,
      },
      select: { id: true },
    });

    await logClinicalAuditEvent({
      db: tx,
      event: AuditEvent.ARM_CREATED,
      actorId,
      projectId,
      resourceId: arm.id,
      resourceType: "Arm",
      metadata: { templateKey: template.key, armName: templateArm.name },
    });

    const seenEventNames = new Set<string>();
    for (const [eventIdx, templateEvent] of templateArm.events.entries()) {
      let eventName = templateEvent.name;
      if (seenEventNames.has(eventName)) {
        eventName = `${eventName} (${eventIdx + 1})`;
      }
      seenEventNames.add(eventName);

      const event = await tx.event.create({
        data: {
          armId: arm.id,
          name: eventName,
          position: templateEvent.position ?? eventIdx,
          dayOffset: templateEvent.dayOffset ?? null,
          windowDays: templateEvent.windowDays ?? null,
        },
        select: { id: true },
      });

      await logClinicalAuditEvent({
        db: tx,
        event: AuditEvent.EVENT_CREATED,
        actorId,
        projectId,
        resourceId: event.id,
        resourceType: "Event",
        metadata: { templateKey: template.key, armName: templateArm.name, eventName },
      });

      const seenBindingKeys = new Set<string>();
      for (const binding of templateEvent.instrumentBindings) {
        if (seenBindingKeys.has(binding.instrumentKey)) continue;
        const instrumentId = instrumentIdByKey.get(binding.instrumentKey);
        if (!instrumentId) continue;
        seenBindingKeys.add(binding.instrumentKey);

        await tx.eventInstrument.create({
          data: {
            eventId: event.id,
            instrumentId,
            required: binding.required,
            repeating: binding.repeating,
          },
        });

        await logClinicalAuditEvent({
          db: tx,
          event: AuditEvent.EVENT_INSTRUMENT_BOUND,
          actorId,
          projectId,
          resourceId: event.id,
          resourceType: "EventInstrument",
          metadata: {
            templateKey: template.key,
            instrumentKey: binding.instrumentKey,
          },
        });
      }
    }
  }

  return {
    applied: true,
    instrumentsCreated: template.instruments.length,
    armsCreated: template.arms.length,
  };
};

const dedupeWithinScope = (raw: string, idx: number): string => (raw.trim() === "" ? `Arm ${idx + 1}` : raw);
