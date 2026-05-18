import { describe, expect, it } from "vitest";
import { InstrumentFieldType } from "@prisma/client";
import { TSurveyElementTypeEnum } from "@continium/types/surveys/elements";
import {
  UNSUPPORTED_CLINICAL_ELEMENT_TYPES,
  collectUnsupportedFieldTypes,
  snapshotFromSurvey,
} from "./snapshot-from-survey";

const makeSurvey = (elements: Record<string, unknown>[], withLogic = false) => ({
  name: "Clinical survey",
  blocks: [
    {
      id: "clzt0000000000000000000001",
      name: "Block 1",
      elements,
      ...(withLogic
        ? {
            logic: [
              {
                id: "clzt0000000000000000000099",
                conditions: { id: "clzt0000000000000000000098", connector: "and", conditions: [] },
                actions: [
                  {
                    id: "clzt0000000000000000000100",
                    objective: "jumpToBlock",
                    target: "clzt0000000000000000000002",
                  },
                ],
              },
            ],
          }
        : {}),
    },
  ],
});

const choices = [
  { id: "a", label: { default: "A" } },
  { id: "b", label: { default: "B" } },
];

describe("snapshotFromSurvey", () => {
  it("maps all current survey element types into instrument fields", () => {
    const result = snapshotFromSurvey(
      makeSurvey([
        {
          id: "text-email",
          type: TSurveyElementTypeEnum.OpenText,
          headline: { default: "Email" },
          required: true,
          inputType: "email",
          charLimit: { enabled: false },
        },
        {
          id: "text-number",
          type: TSurveyElementTypeEnum.OpenText,
          headline: { default: "Age" },
          required: false,
          inputType: "number",
          charLimit: { enabled: false },
        },
        { id: "single", type: TSurveyElementTypeEnum.MultipleChoiceSingle, headline: { default: "One" }, required: true, choices },
        { id: "multi", type: TSurveyElementTypeEnum.MultipleChoiceMulti, headline: { default: "Many" }, required: false, choices },
        {
          id: "picture",
          type: TSurveyElementTypeEnum.PictureSelection,
          headline: { default: "Picture" },
          required: false,
          allowMulti: true,
          choices: [
            { id: "p1", imageUrl: "https://example.com/1.png" },
            { id: "p2", imageUrl: "https://example.com/2.png" },
          ],
        },
        { id: "rating", type: TSurveyElementTypeEnum.Rating, headline: { default: "Rating" }, required: true, scale: "star", range: 5 },
        { id: "nps", type: TSurveyElementTypeEnum.NPS, headline: { default: "NPS" }, required: true },
        { id: "consent", type: TSurveyElementTypeEnum.Consent, headline: { default: "Consent" }, required: true, label: { default: "I agree" } },
        { id: "date", type: TSurveyElementTypeEnum.Date, headline: { default: "Visit date" }, required: true, format: "M-d-y" },
        { id: "cta", type: TSurveyElementTypeEnum.CTA, headline: { default: "CTA" }, required: false, buttonExternal: true, buttonUrl: "https://example.com", ctaButtonLabel: { default: "Open" } },
        { id: "upload", type: TSurveyElementTypeEnum.FileUpload, headline: { default: "File" }, required: false, allowMultipleFiles: true },
        { id: "cal", type: TSurveyElementTypeEnum.Cal, headline: { default: "Schedule" }, required: false, calUserName: "demo" },
        {
          id: "matrix",
          type: TSurveyElementTypeEnum.Matrix,
          headline: { default: "Matrix" },
          required: false,
          rows: choices,
          columns: choices,
        },
        {
          id: "address",
          type: TSurveyElementTypeEnum.Address,
          headline: { default: "Address" },
          required: false,
          addressLine1: { show: true, required: true, placeholder: { default: "Line 1" } },
          addressLine2: { show: false, required: false, placeholder: { default: "Line 2" } },
          city: { show: true, required: true, placeholder: { default: "City" } },
          state: { show: true, required: false, placeholder: { default: "State" } },
          zip: { show: true, required: false, placeholder: { default: "ZIP" } },
          country: { show: true, required: false, placeholder: { default: "Country" } },
        },
        { id: "ranking", type: TSurveyElementTypeEnum.Ranking, headline: { default: "Rank" }, required: false, choices },
        {
          id: "contact",
          type: TSurveyElementTypeEnum.ContactInfo,
          headline: { default: "Contact" },
          required: false,
          firstName: { show: true, required: true, placeholder: { default: "First" } },
          lastName: { show: true, required: true, placeholder: { default: "Last" } },
          email: { show: true, required: true, placeholder: { default: "Email" } },
          phone: { show: false, required: false, placeholder: { default: "Phone" } },
          company: { show: false, required: false, placeholder: { default: "Company" } },
        },
      ], true)
    );

    expect(result.fields).toHaveLength(16);
    expect(result.fields.map((field) => field.position)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    ]);

    expect(result.fields.find((field) => field.key === "text-email")).toMatchObject({
      type: InstrumentFieldType.TEXT,
      validationCode: "email",
      branchingJson: { logicFallback: null },
    });
    expect(result.fields.find((field) => field.key === "text-number")).toMatchObject({
      type: InstrumentFieldType.NUMBER,
      validationCode: "number",
    });
    expect(result.fields.find((field) => field.key === "single")).toMatchObject({
      type: InstrumentFieldType.SINGLE_SELECT,
    });
    expect(result.fields.find((field) => field.key === "multi")).toMatchObject({
      type: InstrumentFieldType.MULTI_SELECT,
    });
    expect(result.fields.find((field) => field.key === "picture")).toMatchObject({
      type: InstrumentFieldType.MULTI_SELECT,
      validationCode: TSurveyElementTypeEnum.PictureSelection,
    });
    expect(result.fields.find((field) => field.key === "rating")).toMatchObject({
      type: InstrumentFieldType.NUMBER,
      validationCode: TSurveyElementTypeEnum.Rating,
    });
    expect(result.fields.find((field) => field.key === "nps")).toMatchObject({
      type: InstrumentFieldType.NUMBER,
      validationCode: TSurveyElementTypeEnum.NPS,
    });
    expect(result.fields.find((field) => field.key === "consent")).toMatchObject({
      type: InstrumentFieldType.BOOLEAN,
      validationCode: TSurveyElementTypeEnum.Consent,
    });
    expect(result.fields.find((field) => field.key === "date")).toMatchObject({
      type: InstrumentFieldType.DATE,
      validationCode: "M-d-y",
    });

    expect(result.warnings.map((warning) => warning.key)).toEqual([
      "cta", "upload", "cal", "matrix", "address", "ranking", "contact",
    ]);
    expect(result.fieldHash).toBe("fake-hash");
  });

  it("uses the element id when the localized headline is blank", () => {
    const result = snapshotFromSurvey(
      makeSurvey([
        {
          id: "fallback-id",
          type: TSurveyElementTypeEnum.OpenText,
          headline: { default: "" },
          required: false,
          inputType: "text",
          charLimit: { enabled: false },
        },
      ])
    );

    expect(result.fields[0]).toMatchObject({
      key: "fallback-id",
      label: "fallback-id",
      type: InstrumentFieldType.TEXT,
    });
  });
});

describe("collectUnsupportedFieldTypes", () => {
  it("returns the sorted, de-duplicated set of unsupported source element types", () => {
    const fields = [
      { type: InstrumentFieldType.TEXT, validationCode: TSurveyElementTypeEnum.FileUpload },
      { type: InstrumentFieldType.TEXT, validationCode: TSurveyElementTypeEnum.Matrix },
      { type: InstrumentFieldType.TEXT, validationCode: TSurveyElementTypeEnum.FileUpload },
      { type: InstrumentFieldType.TEXT, validationCode: null },
    ];

    expect(collectUnsupportedFieldTypes(fields)).toEqual([
      TSurveyElementTypeEnum.FileUpload,
      TSurveyElementTypeEnum.Matrix,
    ]);
  });

  it("ignores fields that were natively mapped (non-TEXT) even when validationCode is set", () => {
    const fields = [
      // A NUMBER field that carries an OpenText input-type code is NOT an
      // unsupported downgrade; it's the natively-mapped numeric path.
      { type: InstrumentFieldType.NUMBER, validationCode: "phone" },
      { type: InstrumentFieldType.SINGLE_SELECT, validationCode: TSurveyElementTypeEnum.PictureSelection },
    ];
    expect(collectUnsupportedFieldTypes(fields)).toEqual([]);
  });

  it("ignores TEXT fields whose validationCode is not in the unsupported allowlist", () => {
    const fields = [
      { type: InstrumentFieldType.TEXT, validationCode: null },
      { type: InstrumentFieldType.TEXT, validationCode: "email" },
      { type: InstrumentFieldType.TEXT, validationCode: "phone" },
    ];
    expect(collectUnsupportedFieldTypes(fields)).toEqual([]);
  });

  it("UNSUPPORTED_CLINICAL_ELEMENT_TYPES matches the actual downgrade branch in mapElement", () => {
    // Every element type listed in the constant should round-trip: when
    // snapshotFromSurvey processes it, the resulting field must satisfy
    // collectUnsupportedFieldTypes. The shape of "unsupported" can only change
    // here and in the mapElement switch — keeping them aligned is the point.
    for (const sourceType of UNSUPPORTED_CLINICAL_ELEMENT_TYPES) {
      const detected = collectUnsupportedFieldTypes([
        { type: InstrumentFieldType.TEXT, validationCode: sourceType },
      ]);
      expect(detected, `expected ${sourceType} to round-trip`).toEqual([sourceType]);
    }
  });
});
