import { createHash } from "node:crypto";
import { InstrumentFieldType } from "@prisma/client";
import { type TSurveyBlock, ZSurveyBlocks } from "@continium/types/surveys/blocks";
import {
  type TSurveyElement,
  TSurveyElementTypeEnum,
} from "@continium/types/surveys/elements";

/**
 * Survey element types that have no native equivalent in the clinical data
 * entry surface yet. `mapElement` snapshots them as `TEXT` with the original
 * element type recorded in `validationCode`, and a warning is emitted so that
 * publish-time UI can inform the coordinator before they commit.
 *
 * Exported so downstream consumers (instrument dashboard, publish dialog) can
 * detect these fields on existing InstrumentField rows without having to
 * re-snapshot the source survey.
 */
export const UNSUPPORTED_CLINICAL_ELEMENT_TYPES: ReadonlySet<TSurveyElementTypeEnum> = new Set([
  TSurveyElementTypeEnum.CTA,
  TSurveyElementTypeEnum.FileUpload,
  TSurveyElementTypeEnum.Cal,
  TSurveyElementTypeEnum.Matrix,
  TSurveyElementTypeEnum.Address,
  TSurveyElementTypeEnum.Ranking,
  TSurveyElementTypeEnum.ContactInfo,
]);

/**
 * Returns the sorted, de-duplicated list of source-element types that were
 * snapshotted as TEXT because they have no native clinical mapping. Reads from
 * the already-persisted InstrumentField shape (`type === TEXT` plus the
 * source element name in `validationCode`), so callers don't need to re-run
 * `snapshotFromSurvey` to learn what was downgraded.
 */
export const collectUnsupportedFieldTypes = (
  fields: ReadonlyArray<{ type: InstrumentFieldType; validationCode: string | null }>
): string[] => {
  const seen = new Set<string>();
  for (const field of fields) {
    if (field.type !== InstrumentFieldType.TEXT) continue;
    const code = field.validationCode;
    if (!code) continue;
    if (UNSUPPORTED_CLINICAL_ELEMENT_TYPES.has(code as TSurveyElementTypeEnum)) {
      seen.add(code);
    }
  }
  return [...seen].sort();
};

interface TSurveySnapshotSource {
  name: string;
  blocks: unknown;
}

export interface TInstrumentSnapshotField {
  key: string;
  label: string;
  type: InstrumentFieldType;
  validationCode: string | null;
  required: boolean;
  position: number;
  choicesJson?: unknown;
  branchingJson?: unknown;
}

export interface TInstrumentSnapshotWarning {
  key: string;
  sourceType: TSurveyElementTypeEnum;
  message: string;
}

const readI18n = (value?: Record<string, string> | null) =>
  value?.default?.trim() || Object.values(value ?? {}).find((entry) => entry?.trim())?.trim() || "";

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

const hashValue = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

const buildBranching = (block: TSurveyBlock) =>
  block.logic?.length || block.logicFallback
    ? {
        logic: block.logic ?? [],
        logicFallback: block.logicFallback ?? null,
      }
    : undefined;

const mapElement = (element: TSurveyElement) => {
  switch (element.type) {
    case TSurveyElementTypeEnum.OpenText:
      return {
        type: element.inputType === "number" ? InstrumentFieldType.NUMBER : InstrumentFieldType.TEXT,
        validationCode: element.inputType === "text" ? null : element.inputType,
        choicesJson: {
          placeholder: element.placeholder ?? null,
          longAnswer: element.longAnswer ?? false,
          charLimit: element.charLimit,
        },
      };
    case TSurveyElementTypeEnum.MultipleChoiceSingle:
      return {
        type: InstrumentFieldType.SINGLE_SELECT,
        validationCode: element.displayType ?? null,
        choicesJson: {
          choices: element.choices,
          shuffleOption: element.shuffleOption ?? "none",
          otherOptionPlaceholder: element.otherOptionPlaceholder ?? null,
        },
      };
    case TSurveyElementTypeEnum.MultipleChoiceMulti:
      return {
        type: InstrumentFieldType.MULTI_SELECT,
        validationCode: element.displayType ?? null,
        choicesJson: {
          choices: element.choices,
          shuffleOption: element.shuffleOption ?? "none",
          otherOptionPlaceholder: element.otherOptionPlaceholder ?? null,
        },
      };
    case TSurveyElementTypeEnum.PictureSelection:
      return {
        type: element.allowMulti ? InstrumentFieldType.MULTI_SELECT : InstrumentFieldType.SINGLE_SELECT,
        validationCode: TSurveyElementTypeEnum.PictureSelection,
        choicesJson: {
          allowMulti: element.allowMulti ?? false,
          choices: element.choices,
        },
      };
    case TSurveyElementTypeEnum.Rating:
      return {
        type: InstrumentFieldType.NUMBER,
        validationCode: TSurveyElementTypeEnum.Rating,
        choicesJson: {
          scale: element.scale,
          range: element.range,
          lowerLabel: element.lowerLabel ?? null,
          upperLabel: element.upperLabel ?? null,
        },
      };
    case TSurveyElementTypeEnum.NPS:
      return {
        type: InstrumentFieldType.NUMBER,
        validationCode: TSurveyElementTypeEnum.NPS,
        choicesJson: {
          range: 10,
          lowerLabel: element.lowerLabel ?? null,
          upperLabel: element.upperLabel ?? null,
        },
      };
    case TSurveyElementTypeEnum.Consent:
      return {
        type: InstrumentFieldType.BOOLEAN,
        validationCode: TSurveyElementTypeEnum.Consent,
        choicesJson: { label: element.label },
      };
    case TSurveyElementTypeEnum.Date:
      return {
        type: InstrumentFieldType.DATE,
        validationCode: element.format,
        choicesJson: { html: element.html ?? null, format: element.format },
      };
    case TSurveyElementTypeEnum.CTA:
    case TSurveyElementTypeEnum.FileUpload:
    case TSurveyElementTypeEnum.Cal:
    case TSurveyElementTypeEnum.Matrix:
    case TSurveyElementTypeEnum.Address:
    case TSurveyElementTypeEnum.Ranking:
    case TSurveyElementTypeEnum.ContactInfo:
      return {
        type: InstrumentFieldType.TEXT,
        validationCode: element.type,
        choicesJson: { ...element },
        warning: `Element type ${element.type} is not natively supported in clinical data entry yet and was snapshotted as TEXT.`,
      };
  }
};

export const buildSurveySourceHash = (survey: TSurveySnapshotSource) =>
  hashValue({ name: survey.name, blocks: survey.blocks });

export const buildInstrumentFieldHash = (fields: TInstrumentSnapshotField[]) => hashValue(fields);

export const snapshotFromSurvey = (survey: TSurveySnapshotSource) => {
  const blocks = ZSurveyBlocks.parse(survey.blocks);
  const warnings: TInstrumentSnapshotWarning[] = [];
  let position = 0;

  const fields = blocks.flatMap((block) =>
    block.elements.map((element) => {
      position += 1;
      const mapped = mapElement(element);

      if (mapped.warning) {
        warnings.push({
          key: element.id,
          sourceType: element.type,
          message: mapped.warning,
        });
      }

      return {
        key: element.id,
        label: stripHtml(readI18n(element.headline)) || element.id,
        type: mapped.type,
        validationCode: mapped.validationCode,
        required: element.required,
        position,
        choicesJson: mapped.choicesJson,
        branchingJson: buildBranching(block),
      } satisfies TInstrumentSnapshotField;
    })
  );

  return {
    fields,
    warnings,
    fieldHash: buildInstrumentFieldHash(fields),
  };
};
