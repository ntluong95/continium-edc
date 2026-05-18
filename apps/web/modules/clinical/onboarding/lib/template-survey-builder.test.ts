import { describe, expect, test } from "vitest";
import { TSurveyElementTypeEnum } from "@continium/types/surveys/elements";
import { buildSurveyBlocksFromTemplateInstrument } from "./template-survey-builder";
import type { TClinicalTemplateInstrument } from "./template-types";

const instrument: TClinicalTemplateInstrument = {
  key: "completion_project_questionnaire",
  displayName: "Completion Project Questionnaire",
  fields: [
    {
      key: "withdraw_reason",
      label: "Reason patient withdrew from study",
      type: "SINGLE_SELECT",
      required: false,
      position: 0,
      choicesJson: [
        { value: "0", label: "Non-compliance" },
        { value: "1", label: "Did not wish to continue in study" },
      ],
    },
    {
      key: "completion_data_complete",
      label: "Complete?",
      type: "SINGLE_SELECT",
      required: false,
      position: 1,
      choicesJson: [
        { value: "0", label: "Incomplete" },
        { value: "1", label: "Unverified" },
        { value: "2", label: "Complete" },
      ],
    },
    {
      key: "cpq1",
      label: "Date of study completion",
      type: "DATE",
      required: false,
      position: 2,
      validationCode: "date_ymd",
    },
    {
      key: "cpq2",
      label: "Transferrin (mg/dL)",
      type: "NUMBER",
      required: false,
      position: 3,
      validationCode: "int",
    },
    {
      key: "cpq3",
      label: "Kt/V",
      type: "NUMBER",
      required: true,
      position: 4,
      validationCode: "int",
    },
  ],
};

describe("buildSurveyBlocksFromTemplateInstrument", () => {
  test("maps REDCap-style template fields into Formbricks survey elements", () => {
    const [block] = buildSurveyBlocksFromTemplateInstrument(instrument);

    expect(block.name).toBe("Completion Project Questionnaire");
    expect(block.elements.map((element) => element.id)).toEqual([
      "withdraw_reason",
      "completion_data_complete",
      "cpq1",
      "cpq2",
      "cpq3",
    ]);

    expect(block.elements[0]).toMatchObject({
      type: TSurveyElementTypeEnum.MultipleChoiceSingle,
      choices: [
        { id: "0", label: { default: "Non-compliance" } },
        { id: "1", label: { default: "Did not wish to continue in study" } },
      ],
      displayType: "dropdown",
    });
    expect(block.elements[2]).toMatchObject({
      type: TSurveyElementTypeEnum.Date,
      format: "y-M-d",
    });
    expect(block.elements[3]).toMatchObject({
      type: TSurveyElementTypeEnum.OpenText,
      inputType: "number",
    });
    expect(block.elements[4]).toMatchObject({
      required: true,
      type: TSurveyElementTypeEnum.OpenText,
      inputType: "number",
    });
  });
});
