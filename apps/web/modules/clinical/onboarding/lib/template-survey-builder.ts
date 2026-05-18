import { createId } from "@paralleldrive/cuid2";
import { type TSurveyBlock, ZSurveyBlocks } from "@continium/types/surveys/blocks";
import {
  type TSurveyElement,
  type TSurveyElementChoice,
  TSurveyElementTypeEnum,
} from "@continium/types/surveys/elements";
import { createI18nString } from "@/lib/i18n/utils";
import type { TClinicalTemplateField, TClinicalTemplateInstrument } from "./template-types";

const toI18n = (value: string) => createI18nString(value, []);

const dedupeChoiceId = (raw: string, index: number, seen: Set<string>) => {
  const fallback = `choice_${index + 1}`;
  const base = raw.trim() || fallback;
  let id = base;
  let suffix = 2;
  while (seen.has(id)) {
    id = `${base}_${suffix}`;
    suffix += 1;
  }
  seen.add(id);
  return id;
};

const buildChoices = (field: TClinicalTemplateField): TSurveyElementChoice[] => {
  const seen = new Set<string>();
  return (field.choicesJson ?? []).map((choice, index) => ({
    id: dedupeChoiceId(choice.value, index, seen),
    label: toI18n(choice.label),
  }));
};

const buildSelectElement = (
  field: TClinicalTemplateField,
  type: TSurveyElementTypeEnum.MultipleChoiceSingle | TSurveyElementTypeEnum.MultipleChoiceMulti
): TSurveyElement => {
  const choices = buildChoices(field);
  if (choices.length < 2) {
    return buildOpenTextElement(field, "text");
  }

  return {
    id: field.key,
    type,
    headline: toI18n(field.label),
    subheader: field.note ? toI18n(field.note) : undefined,
    required: field.required,
    choices,
    shuffleOption: "none",
    displayType: type === TSurveyElementTypeEnum.MultipleChoiceSingle ? "dropdown" : "list",
  };
};

const buildOpenTextElement = (
  field: TClinicalTemplateField,
  inputType: "text" | "number"
): TSurveyElement => ({
  id: field.key,
  type: TSurveyElementTypeEnum.OpenText,
  headline: toI18n(field.label),
  subheader: field.note ? toI18n(field.note) : undefined,
  required: field.required,
  inputType,
  charLimit: { enabled: false },
});

const buildDateElement = (field: TClinicalTemplateField): TSurveyElement => ({
  id: field.key,
  type: TSurveyElementTypeEnum.Date,
  headline: toI18n(field.label),
  subheader: field.note ? toI18n(field.note) : undefined,
  required: field.required,
  format: "y-M-d",
});

const buildBooleanElement = (field: TClinicalTemplateField): TSurveyElement => ({
  id: field.key,
  type: TSurveyElementTypeEnum.MultipleChoiceSingle,
  headline: toI18n(field.label),
  subheader: field.note ? toI18n(field.note) : undefined,
  required: field.required,
  choices: [
    { id: "1", label: toI18n("Yes") },
    { id: "0", label: toI18n("No") },
  ],
  shuffleOption: "none",
  displayType: "list",
});

const buildElement = (field: TClinicalTemplateField): TSurveyElement => {
  switch (field.type) {
    case "NUMBER":
      return buildOpenTextElement(field, "number");
    case "DATE":
      return buildDateElement(field);
    case "BOOLEAN":
      return buildBooleanElement(field);
    case "SINGLE_SELECT":
      return buildSelectElement(field, TSurveyElementTypeEnum.MultipleChoiceSingle);
    case "MULTI_SELECT":
      return buildSelectElement(field, TSurveyElementTypeEnum.MultipleChoiceMulti);
    case "TEXT":
    default:
      return buildOpenTextElement(field, "text");
  }
};

export const buildSurveyBlocksFromTemplateInstrument = (
  instrument: TClinicalTemplateInstrument
): TSurveyBlock[] => {
  const elements = [...instrument.fields]
    .sort((a, b) => a.position - b.position)
    .map((field) => buildElement(field));

  if (elements.length === 0) return [];

  return ZSurveyBlocks.parse([
    {
      id: createId(),
      name: instrument.displayName,
      elements,
    },
  ]);
};
