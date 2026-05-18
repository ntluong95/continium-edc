import { z } from "zod";

export const ZClinicalProjectPurpose = z.enum([
  "practice",
  "operational_support",
  "research",
  "quality_improvement",
  "other",
]);
export type TClinicalProjectPurpose = z.infer<typeof ZClinicalProjectPurpose>;

export const ZClinicalProjectStartMethod = z.enum(["empty", "template", "import_later"]);
export type TClinicalProjectStartMethod = z.infer<typeof ZClinicalProjectStartMethod>;

export const ZClinicalTemplateFieldType = z.enum([
  "TEXT",
  "NUMBER",
  "DATE",
  "BOOLEAN",
  "SINGLE_SELECT",
  "MULTI_SELECT",
]);
export type TClinicalTemplateFieldType = z.infer<typeof ZClinicalTemplateFieldType>;

export const ZClinicalTemplateChoice = z.object({
  value: z.string(),
  label: z.string(),
});

export const ZClinicalTemplateField = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: ZClinicalTemplateFieldType,
  required: z.boolean(),
  position: z.number().int().nonnegative(),
  choicesJson: z.array(ZClinicalTemplateChoice).nullable().optional(),
  validationCode: z.string().nullable().optional(),
  branchingJson: z.unknown().nullable().optional(),
  note: z.string().optional(),
});
export type TClinicalTemplateField = z.infer<typeof ZClinicalTemplateField>;

export const ZClinicalTemplateInstrument = z.object({
  key: z.string().min(1),
  displayName: z.string().min(1),
  fields: z.array(ZClinicalTemplateField),
});
export type TClinicalTemplateInstrument = z.infer<typeof ZClinicalTemplateInstrument>;

export const ZClinicalTemplateInstrumentBinding = z.object({
  instrumentKey: z.string().min(1),
  required: z.boolean(),
  repeating: z.boolean(),
});

export const ZClinicalTemplateEvent = z.object({
  name: z.string().min(1),
  position: z.number().int().nonnegative(),
  dayOffset: z.number().int().nullable().optional(),
  windowDays: z.number().int().nullable().optional(),
  instrumentBindings: z.array(ZClinicalTemplateInstrumentBinding),
});

export const ZClinicalTemplateArm = z.object({
  name: z.string().min(1),
  position: z.number().int().nonnegative(),
  events: z.array(ZClinicalTemplateEvent),
});

export const ZClinicalTemplate = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  purpose: ZClinicalProjectPurpose,
  source: z.object({
    redcapDemo: z.string(),
    sourceFile: z.string(),
  }),
  unsupportedFeatures: z.array(z.string()).optional(),
  arms: z.array(ZClinicalTemplateArm),
  instruments: z.array(ZClinicalTemplateInstrument),
});
export type TClinicalTemplate = z.infer<typeof ZClinicalTemplate>;

export interface ClinicalTemplateSummary {
  armCount: number;
  eventCount: number;
  instrumentCount: number;
  fieldCount: number;
}

export const summarizeTemplate = (template: TClinicalTemplate): ClinicalTemplateSummary => {
  const eventCount = template.arms.reduce((sum, arm) => sum + arm.events.length, 0);
  const fieldCount = template.instruments.reduce((sum, instrument) => sum + instrument.fields.length, 0);
  return {
    armCount: template.arms.length,
    eventCount,
    instrumentCount: template.instruments.length,
    fieldCount,
  };
};
