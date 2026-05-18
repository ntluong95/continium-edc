import { createId } from "@paralleldrive/cuid2";
import type { TFunction } from "i18next";
import { TSurveyElementTypeEnum } from "@continium/types/surveys/elements";
import type { TSurveyOpenTextElement } from "@continium/types/surveys/elements";
import type { TSurvey } from "@continium/types/surveys/types";
import type { TTemplate } from "@continium/types/templates";
import {
  buildBlock,
  buildCTAElement,
  buildConsentElement,
  buildMultipleChoiceElement,
  buildNPSElement,
  buildOpenTextElement,
  buildRatingElement,
  createBlockChoiceJumpLogic,
  createBlockJumpLogic,
} from "@/app/lib/survey-block-builder";
import { buildSurvey, getDefaultSurveyPreset, hiddenFieldsDefault } from "@/app/lib/survey-builder";
import { createI18nString } from "@/lib/i18n/utils";

const screeningEligibilityForm = (t: TFunction): TTemplate => {
  const reusableElementIds = [createId(), createId(), createId()];
  const block8Id = createId(); // Pre-generate ID for Block 8, referenced by Block 6 logic
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.screening_eligibility_form"),
      role: "studyCoordinator",
      industries: ["clinicalTrial"],
      channels: ["app"],
      description: t("templates.screening_eligibility_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildCTAElement({
              id: reusableElementIds[0],
              subheader: t("templates.screening_eligibility_form_question_1_html"),
              headline: t("templates.screening_eligibility_form_question_1_headline"),
              required: false,
            }),
          ],
          buttonLabel: t("templates.screening_eligibility_form_question_1_button_label"),
          t,
        }),

        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildMultipleChoiceElement({
              headline: t("templates.screening_eligibility_form_question_2_headline"),
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              subheader: t("templates.screening_eligibility_form_question_2_subheader"),
              choices: [
                t("templates.screening_eligibility_form_question_2_choice_1"),
                t("templates.screening_eligibility_form_question_2_choice_2"),
                t("templates.screening_eligibility_form_question_2_choice_3"),
                t("templates.screening_eligibility_form_question_2_choice_4"),
                t("templates.screening_eligibility_form_question_2_choice_5"),
                t("templates.screening_eligibility_form_question_2_choice_6"),
              ],
              containsOther: true,
            }),
          ],
          t,
        }),

        buildBlock({
          name: t("templates.block_3"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.screening_eligibility_form_question_3_headline"),
              required: false,
              inputType: "text",
            }),
          ],
          t,
        }),

        buildBlock({
          name: t("templates.block_4"),
          elements: [
            buildRatingElement({
              headline: t("templates.screening_eligibility_form_question_4_headline"),
              required: true,
              scale: "number",
              range: 5,
              lowerLabel: t("templates.screening_eligibility_form_question_4_lower_label"),
              upperLabel: t("templates.screening_eligibility_form_question_4_upper_label"),
            }),
          ],
          t,
        }),

        buildBlock({
          name: t("templates.block_5"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceMulti,
              headline: t("templates.screening_eligibility_form_question_5_headline"),
              subheader: t("templates.screening_eligibility_form_question_5_subheader"),
              required: true,
              choices: [
                t("templates.screening_eligibility_form_question_5_choice_1"),
                t("templates.screening_eligibility_form_question_5_choice_2"),
                t("templates.screening_eligibility_form_question_5_choice_3"),
                t("templates.screening_eligibility_form_question_5_choice_4"),
                t("templates.screening_eligibility_form_question_5_choice_5"),
                t("templates.screening_eligibility_form_question_5_choice_6"),
              ],
              containsOther: true,
            }),
          ],
          t,
        }),

        buildBlock({
          name: t("templates.block_6"),
          elements: [
            buildConsentElement({
              id: reusableElementIds[1],
              headline: t("templates.screening_eligibility_form_question_6_headline"),
              subheader: "",
              required: false,
              label: t("templates.screening_eligibility_form_question_6_label"),
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[1], block8Id, "isSkipped")],
          t,
        }),

        buildBlock({
          name: t("templates.block_7"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.screening_eligibility_form_question_7_headline"),
              required: true,
              inputType: "email",
              longAnswer: false,
              placeholder: t("templates.screening_eligibility_form_question_7_placeholder"),
            }),
          ],
          t,
        }),

        buildBlock({
          id: block8Id,
          name: t("templates.block_8"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[2],
              headline: t("templates.screening_eligibility_form_question_8_headline"),
              required: false,
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const enrollmentForm = (t: TFunction): TTemplate => {
  const reusableElementIds = [createId(), createId(), createId()];
  const block8Id = createId(); // Pre-generate ID for Block 8 (referenced by Block 7 logic)
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.enrollment_form"),
      role: "studyCoordinator",
      industries: ["clinicalTrial"],
      channels: ["app", "website"],
      description: t("templates.enrollment_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildCTAElement({
              id: reusableElementIds[0],
              subheader: t("templates.enrollment_form_question_1_html"),
              headline: t("templates.enrollment_form_question_2_headline"),
              required: false,
            }),
          ],
          buttonLabel: t("templates.enrollment_form_question_2_button_label"),
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              headline: t("templates.enrollment_form_question_3_headline"),
              subheader: t("templates.enrollment_form_question_3_subheader"),
              required: true,
              shuffleOption: "none",
              choices: [
                t("templates.enrollment_form_question_3_choice_1"),
                t("templates.enrollment_form_question_3_choice_2"),
                t("templates.enrollment_form_question_3_choice_3"),
                t("templates.enrollment_form_question_3_choice_4"),
                t("templates.enrollment_form_question_3_choice_5"),
                t("templates.enrollment_form_question_3_choice_6"),
              ],
              containsOther: true,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_3"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.enrollment_form_question_4_headline"),
              required: false,
              inputType: "text",
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_4"),
          elements: [
            buildRatingElement({
              headline: t("templates.enrollment_form_question_5_headline"),
              required: true,
              scale: "number",
              range: 5,
              lowerLabel: t("templates.enrollment_form_question_5_lower_label"),
              upperLabel: t("templates.enrollment_form_question_5_upper_label"),
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_5"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceMulti,
              headline: t("templates.enrollment_form_question_6_headline"),
              subheader: t("templates.enrollment_form_question_6_subheader"),
              required: true,
              choices: [
                t("templates.enrollment_form_question_6_choice_1"),
                t("templates.enrollment_form_question_6_choice_2"),
                t("templates.enrollment_form_question_6_choice_3"),
                t("templates.enrollment_form_question_6_choice_4"),
                t("templates.enrollment_form_question_6_choice_5"),
              ],
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_6"),
          elements: [
            buildConsentElement({
              id: reusableElementIds[1],
              headline: t("templates.enrollment_form_question_7_headline"),
              subheader: "",
              required: false,
              label: t("templates.enrollment_form_question_7_label"),
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[1], block8Id, "isSkipped")],
          t,
        }),
        buildBlock({
          name: t("templates.block_7"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.enrollment_form_question_8_headline"),
              required: true,
              inputType: "email",
              longAnswer: false,
              placeholder: "participant@example.com",
            }),
          ],
          t,
        }),
        buildBlock({
          id: block8Id,
          name: t("templates.block_8"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[2],
              headline: t("templates.enrollment_form_question_9_headline"),
              required: false,
              inputType: "text",
            }),
          ],
          t,
        }),
      ],
    },
    t
  );
};

const patientReportedOutcomeForm = (t: TFunction): TTemplate => {
  const reusableElementIds = [createId()];
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.patient_reported_outcome_form"),
      role: "clinician",
      industries: ["registryCohort"],
      channels: ["app", "link"],
      description: t("templates.patient_reported_outcome_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildCTAElement({
              id: reusableElementIds[0],
              subheader: t("templates.patient_reported_outcome_form_question_1_html"),
              headline: t("templates.patient_reported_outcome_form_question_1_headline"),
              required: false,
            }),
          ],
          buttonLabel: t("templates.patient_reported_outcome_form_question_1_button_label"),
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              headline: t("templates.patient_reported_outcome_form_question_2_headline"),
              subheader: t("templates.patient_reported_outcome_form_question_2_subheader"),
              required: true,
              shuffleOption: "none",
              choices: [
                t("templates.patient_reported_outcome_form_question_2_choice_1"),
                t("templates.patient_reported_outcome_form_question_2_choice_2"),
                t("templates.patient_reported_outcome_form_question_2_choice_3"),
              ],
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_3"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              headline: t("templates.patient_reported_outcome_form_question_3_headline"),
              subheader: t("templates.patient_reported_outcome_form_question_3_subheader"),
              required: true,
              shuffleOption: "none",
              choices: [
                t("templates.patient_reported_outcome_form_question_3_choice_1"),
                t("templates.patient_reported_outcome_form_question_3_choice_2"),
                t("templates.patient_reported_outcome_form_question_3_choice_3"),
                t("templates.patient_reported_outcome_form_question_3_choice_4"),
                t("templates.patient_reported_outcome_form_question_3_choice_5"),
              ],
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_4"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.patient_reported_outcome_form_question_4_headline"),
              required: true,
              inputType: "text",
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_5"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.patient_reported_outcome_form_question_5_headline"),
              required: true,
              inputType: "text",
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_6"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.patient_reported_outcome_form_question_6_headline"),
              subheader: t("templates.patient_reported_outcome_form_question_6_subheader"),
              required: true,
              inputType: "text",
            }),
          ],
          t,
        }),
      ],
    },
    t
  );
};

const registryParticipantIntakeForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.registry_participant_intake_form"),
      role: "studyCoordinator",
      industries: ["registryCohort"],
      channels: ["app", "link"],
      description: t("templates.registry_participant_intake_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              headline: t("templates.registry_participant_intake_form_question_1_headline"),
              subheader: t("templates.registry_participant_intake_form_question_1_subheader"),
              required: true,
              shuffleOption: "none",
              choices: [
                t("templates.registry_participant_intake_form_question_1_choice_1"),
                t("templates.registry_participant_intake_form_question_1_choice_2"),
                t("templates.registry_participant_intake_form_question_1_choice_3"),
                t("templates.registry_participant_intake_form_question_1_choice_4"),
                t("templates.registry_participant_intake_form_question_1_choice_5"),
              ],
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              headline: t("templates.registry_participant_intake_form_question_2_headline"),
              subheader: t("templates.registry_participant_intake_form_question_2_subheader"),
              required: true,
              shuffleOption: "none",
              choices: [
                t("templates.registry_participant_intake_form_question_2_choice_1"),
                t("templates.registry_participant_intake_form_question_2_choice_2"),
                t("templates.registry_participant_intake_form_question_2_choice_3"),
                t("templates.registry_participant_intake_form_question_2_choice_4"),
                t("templates.registry_participant_intake_form_question_2_choice_5"),
              ],
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_3"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              headline: t("templates.registry_participant_intake_form_question_3_headline"),
              subheader: t("templates.registry_participant_intake_form_question_3_subheader"),
              required: true,
              shuffleOption: "none",
              choices: [
                t("templates.registry_participant_intake_form_question_3_choice_1"),
                t("templates.registry_participant_intake_form_question_3_choice_2"),
                t("templates.registry_participant_intake_form_question_3_choice_3"),
                t("templates.registry_participant_intake_form_question_3_choice_4"),
                t("templates.registry_participant_intake_form_question_3_choice_5"),
              ],
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const dataQueryTriageForm = (t: TFunction): TTemplate => {
  const reusableElementIds = [createId(), createId(), createId(), createId(), createId()];
  const reusableOptionIds = [createId(), createId(), createId(), createId(), createId()];
  const block2Id = createId(); // Pre-generate IDs for blocks referenced by logic
  const block3Id = createId();
  const block4Id = createId();
  const block5Id = createId();
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.data_query_triage_form"),
      role: "dataManager",
      industries: ["registryCohort", "clinicalTrial", "other"],
      channels: ["app", "link"],
      description: t("templates.data_query_triage_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildMultipleChoiceElement({
              id: reusableElementIds[0],
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              shuffleOption: "none",
              choices: [
                t("templates.data_query_triage_form_question_1_choice_1"),
                t("templates.data_query_triage_form_question_1_choice_2"),
                t("templates.data_query_triage_form_question_1_choice_3"),
                t("templates.data_query_triage_form_question_1_choice_4"),
                t("templates.data_query_triage_form_question_1_choice_5"),
              ],
              choiceIds: [
                reusableOptionIds[0],
                reusableOptionIds[1],
                reusableOptionIds[2],
                reusableOptionIds[3],
                reusableOptionIds[4],
              ],
              headline: t("templates.data_query_triage_form_question_1_headline"),
              required: true,
              subheader: t("templates.data_query_triage_form_question_1_subheader"),
            }),
          ],
          logic: [
            createBlockChoiceJumpLogic(reusableElementIds[0], reusableOptionIds[0], block2Id),
            createBlockChoiceJumpLogic(reusableElementIds[0], reusableOptionIds[1], block3Id),
            createBlockChoiceJumpLogic(reusableElementIds[0], reusableOptionIds[2], block4Id),
            createBlockChoiceJumpLogic(reusableElementIds[0], reusableOptionIds[3], block5Id),
            createBlockChoiceJumpLogic(
              reusableElementIds[0],
              reusableOptionIds[4],
              localSurvey.endings[0].id
            ),
          ],
          t,
        }),
        buildBlock({
          id: block2Id,
          name: t("templates.block_2"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[1],
              headline: t("templates.data_query_triage_form_question_2_headline"),
              required: true,
              inputType: "text",
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[1], localSurvey.endings[0].id, "isSubmitted")],
          buttonLabel: t("templates.data_query_triage_form_question_2_button_label"),
          t,
        }),
        buildBlock({
          id: block3Id,
          name: t("templates.block_3"),
          elements: [
            buildCTAElement({
              id: reusableElementIds[2],
              subheader: t("templates.data_query_triage_form_question_3_html"),
              headline: t("templates.data_query_triage_form_question_3_headline"),
              required: false,
              buttonUrl: "https://continium.com",
              buttonExternal: true,
              ctaButtonLabel: t("templates.data_query_triage_form_question_3_button_label"),
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[2], localSurvey.endings[0].id, "isClicked")],
          t,
        }),
        buildBlock({
          id: block4Id,
          name: t("templates.block_4"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[3],
              headline: t("templates.data_query_triage_form_question_4_headline"),
              required: true,
              inputType: "text",
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[3], localSurvey.endings[0].id, "isSubmitted")],
          t,
        }),
        buildBlock({
          id: block5Id,
          name: t("templates.block_5"),
          elements: [
            buildCTAElement({
              id: reusableElementIds[4],
              subheader: t("templates.data_query_triage_form_question_5_html"),
              headline: t("templates.data_query_triage_form_question_5_headline"),
              required: false,
              buttonUrl: "mailto:data.manager@example.com",
              buttonExternal: true,
              ctaButtonLabel: t("templates.data_query_triage_form_question_5_button_label"),
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[4], localSurvey.endings[0].id, "isClicked")],
          t,
        }),
      ],
    },
    t
  );
};

const adverseEventScreeningForm = (t: TFunction): TTemplate => {
  const reusableElementIds = [createId(), createId(), createId(), createId()];
  const reusableOptionIds = [createId(), createId(), createId(), createId()];
  const block3Id = createId(); // Pre-generate ID for Block 3 (referenced by Block 1 logic)
  const block4Id = createId();
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.adverse_event_screening_form_name"),
      role: "clinician",
      industries: ["registryCohort", "clinicalTrial", "other"],
      channels: ["app", "link"],
      description: t("templates.adverse_event_screening_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildMultipleChoiceElement({
              id: reusableElementIds[0],
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              shuffleOption: "none",
              choices: [
                t("templates.adverse_event_screening_form_question_1_choice_1"),
                t("templates.adverse_event_screening_form_question_1_choice_2"),
              ],
              choiceIds: [reusableOptionIds[0], reusableOptionIds[1]],
              headline: t("templates.adverse_event_screening_form_question_1_headline"),
              required: true,
            }),
          ],
          logic: [createBlockChoiceJumpLogic(reusableElementIds[0], reusableOptionIds[1], block3Id)],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[1],
              headline: t("templates.adverse_event_screening_form_question_2_headline"),
              required: true,
              placeholder: t("templates.adverse_event_screening_form_question_2_placeholder"),
              inputType: "text",
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[1], block4Id, "isSubmitted")],
          t,
        }),
        buildBlock({
          id: block3Id,
          name: t("templates.block_3"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[2],
              headline: t("templates.adverse_event_screening_form_question_3_headline"),
              required: true,
              placeholder: t("templates.adverse_event_screening_form_question_3_placeholder"),
              inputType: "text",
            }),
          ],
          t,
        }),
        buildBlock({
          id: block4Id,
          name: t("templates.block_4"),
          elements: [
            buildMultipleChoiceElement({
              id: reusableElementIds[3],
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              shuffleOption: "none",
              choices: [
                t("templates.adverse_event_screening_form_question_4_choice_1"),
                t("templates.adverse_event_screening_form_question_4_choice_2"),
              ],
              choiceIds: [reusableOptionIds[2], reusableOptionIds[3]],
              headline: t("templates.adverse_event_screening_form_question_4_headline"),
              required: true,
            }),
          ],
          logic: [
            createBlockChoiceJumpLogic(
              reusableElementIds[3],
              reusableOptionIds[3],
              localSurvey.endings[0].id
            ),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_5"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.adverse_event_screening_form_question_5_headline"),
              required: true,
              placeholder: t("templates.adverse_event_screening_form_question_5_placeholder"),
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const healthFunctioningAssessmentForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.health_functioning_assessment_form_name"),
      role: "clinician",
      industries: ["registryCohort"],
      channels: ["app", "link"],
      description: t("templates.health_functioning_assessment_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildRatingElement({
              range: 5,
              scale: "number",
              headline: t("templates.health_functioning_assessment_form_question_1_headline"),
              required: true,
              lowerLabel: t("templates.strongly_disagree"),
              upperLabel: t("templates.strongly_agree"),
              isColorCodingEnabled: false,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildRatingElement({
              range: 5,
              scale: "number",
              headline: t("templates.health_functioning_assessment_form_question_2_headline"),
              required: true,
              lowerLabel: t("templates.strongly_disagree"),
              upperLabel: t("templates.strongly_agree"),
              isColorCodingEnabled: false,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_3"),
          elements: [
            buildRatingElement({
              range: 5,
              scale: "number",
              headline: t("templates.health_functioning_assessment_form_question_3_headline"),
              required: true,
              lowerLabel: t("templates.strongly_disagree"),
              upperLabel: t("templates.strongly_agree"),
              isColorCodingEnabled: false,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_4"),
          elements: [
            buildRatingElement({
              range: 5,
              scale: "number",
              headline: t("templates.health_functioning_assessment_form_question_4_headline"),
              required: true,
              lowerLabel: t("templates.strongly_disagree"),
              upperLabel: t("templates.strongly_agree"),
              isColorCodingEnabled: false,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_5"),
          elements: [
            buildRatingElement({
              range: 5,
              scale: "number",
              headline: t("templates.health_functioning_assessment_form_question_5_headline"),
              required: true,
              lowerLabel: t("templates.strongly_disagree"),
              upperLabel: t("templates.strongly_agree"),
              isColorCodingEnabled: false,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_6"),
          elements: [
            buildRatingElement({
              range: 5,
              scale: "number",
              headline: t("templates.health_functioning_assessment_form_question_6_headline"),
              required: true,
              lowerLabel: t("templates.strongly_disagree"),
              upperLabel: t("templates.strongly_agree"),
              isColorCodingEnabled: false,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_7"),
          elements: [
            buildRatingElement({
              range: 5,
              scale: "number",
              headline: t("templates.health_functioning_assessment_form_question_7_headline"),
              required: true,
              lowerLabel: t("templates.strongly_disagree"),
              upperLabel: t("templates.strongly_agree"),
              isColorCodingEnabled: false,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_8"),
          elements: [
            buildRatingElement({
              range: 5,
              scale: "number",
              headline: t("templates.health_functioning_assessment_form_question_8_headline"),
              required: true,
              lowerLabel: t("templates.strongly_disagree"),
              upperLabel: t("templates.strongly_agree"),
              isColorCodingEnabled: false,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_9"),
          elements: [
            buildRatingElement({
              range: 5,
              scale: "number",
              headline: t("templates.health_functioning_assessment_form_question_9_headline"),
              required: true,
              lowerLabel: t("templates.strongly_disagree"),
              upperLabel: t("templates.strongly_agree"),
              isColorCodingEnabled: false,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_10"),
          elements: [
            buildRatingElement({
              range: 5,
              scale: "number",
              headline: t("templates.health_functioning_assessment_form_question_10_headline"),
              required: true,
              lowerLabel: t("templates.strongly_disagree"),
              upperLabel: t("templates.strongly_agree"),
              isColorCodingEnabled: false,
            }),
          ],
          t,
        }),
      ],
    },
    t
  );
};

const followUpRetentionBarrierForm = (t: TFunction): TTemplate => {
  const reusableElementIds = [createId(), createId(), createId(), createId(), createId(), createId()];
  const reusableOptionIds = [
    createId(),
    createId(),
    createId(),
    createId(),
    createId(),
    createId(),
    createId(),
  ];
  const block2Id = createId(); // Pre-generate IDs for blocks referenced by logic
  const block3Id = createId();
  const block4Id = createId();
  const block5Id = createId();
  const block6Id = createId(); // Block 6 referenced by blocks 2, 3, and 5
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.follow_up_retention_barrier_form_name"),
      role: "dataManager",
      industries: ["registryCohort"],
      channels: ["link", "app"],
      description: t("templates.follow_up_retention_barrier_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildMultipleChoiceElement({
              id: reusableElementIds[0],
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              shuffleOption: "none",
              choices: [
                t("templates.follow_up_retention_barrier_form_question_1_choice_1"),
                t("templates.follow_up_retention_barrier_form_question_1_choice_2"),
                t("templates.follow_up_retention_barrier_form_question_1_choice_3"),
                t("templates.follow_up_retention_barrier_form_question_1_choice_4"),
                t("templates.follow_up_retention_barrier_form_question_1_choice_5"),
              ],
              choiceIds: [
                reusableOptionIds[0],
                reusableOptionIds[1],
                reusableOptionIds[2],
                reusableOptionIds[3],
                reusableOptionIds[4],
              ],
              headline: t("templates.follow_up_retention_barrier_form_question_1_headline"),
              required: true,
              subheader: t("templates.follow_up_retention_barrier_form_question_1_subheader"),
            }),
          ],
          logic: [
            createBlockChoiceJumpLogic(reusableElementIds[0], reusableOptionIds[0], block2Id),
            createBlockChoiceJumpLogic(reusableElementIds[0], reusableOptionIds[1], block3Id),
            createBlockChoiceJumpLogic(reusableElementIds[0], reusableOptionIds[2], block4Id),
            createBlockChoiceJumpLogic(reusableElementIds[0], reusableOptionIds[3], block5Id),
            createBlockChoiceJumpLogic(
              reusableElementIds[0],
              reusableOptionIds[4],
              localSurvey.endings[0].id
            ),
          ],
          t,
        }),
        buildBlock({
          id: block2Id,
          name: t("templates.block_2"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[1],
              headline: t("templates.follow_up_retention_barrier_form_question_2_headline"),
              required: true,
              inputType: "text",
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[1], block6Id, "isSubmitted")],
          buttonLabel: t("templates.follow_up_retention_barrier_form_question_2_button_label"),
          t,
        }),
        buildBlock({
          id: block3Id,
          name: t("templates.block_3"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[2],
              headline: t("templates.follow_up_retention_barrier_form_question_3_headline"),
              required: true,
              inputType: "text",
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[2], block6Id, "isSubmitted")],
          buttonLabel: t("templates.follow_up_retention_barrier_form_question_3_button_label"),
          t,
        }),
        buildBlock({
          id: block4Id,
          name: t("templates.block_4"),
          elements: [
            buildCTAElement({
              id: reusableElementIds[3],
              subheader: t("templates.follow_up_retention_barrier_form_question_4_html"),
              headline: t("templates.follow_up_retention_barrier_form_question_4_headline"),
              required: false,
              buttonUrl: "https://continium.com",
              buttonExternal: true,
              ctaButtonLabel: t("templates.follow_up_retention_barrier_form_question_4_button_label"),
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[3], localSurvey.endings[0].id, "isClicked")],
          t,
        }),
        buildBlock({
          id: block5Id,
          name: t("templates.block_5"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[4],
              headline: t("templates.follow_up_retention_barrier_form_question_5_headline"),
              required: true,
              subheader: t("templates.follow_up_retention_barrier_form_question_5_subheader"),
              inputType: "text",
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[4], block6Id, "isSubmitted")],
          buttonLabel: t("templates.follow_up_retention_barrier_form_question_5_button_label"),
          t,
        }),
        buildBlock({
          id: block6Id,
          name: t("templates.block_6"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[5],
              headline: t("templates.follow_up_retention_barrier_form_question_6_headline"),
              required: false,
              subheader: t("templates.follow_up_retention_barrier_form_question_6_subheader"),
              inputType: "text",
            }),
          ],
          logic: [
            createBlockJumpLogic(reusableElementIds[5], localSurvey.endings[0].id, "isSubmitted"),
            createBlockJumpLogic(reusableElementIds[5], localSurvey.endings[0].id, "isSkipped"),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const specimenQualityReviewForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);
  const reusableElementIds = [createId(), createId(), createId()];
  const block3Id = createId(); // Pre-generate ID for Block 3 (referenced by Block 1 logic)

  return buildSurvey(
    {
      name: t("templates.specimen_quality_review_form_name"),
      role: "labStaff",
      industries: ["registryCohort", "clinicalTrial", "other"],
      channels: ["link", "app"],
      description: t("templates.specimen_quality_review_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildRatingElement({
              id: reusableElementIds[0],
              range: 5,
              scale: "star",
              headline: t("templates.specimen_quality_review_form_question_1_headline"),
              required: true,
              lowerLabel: t("templates.specimen_quality_review_form_question_1_lower_label"),
              upperLabel: t("templates.specimen_quality_review_form_question_1_upper_label"),
              isColorCodingEnabled: false,
            }),
          ],
          logic: [
            {
              id: createId(),
              conditions: {
                id: createId(),
                connector: "and",
                conditions: [
                  {
                    id: createId(),
                    leftOperand: {
                      value: reusableElementIds[0],
                      type: "element",
                    },
                    operator: "isLessThanOrEqual",
                    rightOperand: {
                      type: "static",
                      value: 3,
                    },
                  },
                ],
              },
              actions: [
                {
                  id: createId(),
                  objective: "jumpToBlock",
                  target: block3Id,
                },
              ],
            },
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildCTAElement({
              id: reusableElementIds[1],
              subheader: t("templates.specimen_quality_review_form_question_2_html"),
              headline: t("templates.specimen_quality_review_form_question_2_headline"),
              required: false,
              buttonUrl: "https://continium.com",
              buttonExternal: true,
              ctaButtonLabel: t("templates.specimen_quality_review_form_question_2_button_label"),
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[1], localSurvey.endings[0].id, "isClicked")],
          buttonLabel: t("templates.next"),
          backButtonLabel: t("templates.back"),
          t,
        }),
        buildBlock({
          id: block3Id,
          name: t("templates.block_3"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[2],
              headline: t("templates.specimen_quality_review_form_question_3_headline"),
              required: true,
              subheader: t("templates.specimen_quality_review_form_question_3_subheader"),
              placeholder: t("templates.specimen_quality_review_form_question_3_placeholder"),
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.specimen_quality_review_form_question_3_button_label"),
          t,
        }),
      ],
    },
    t
  );
};

const followUpVisitSchedulingPrompt = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.follow_up_visit_scheduling_prompt_name"),
      role: "studyCoordinator",
      industries: ["registryCohort"],
      channels: ["app"],
      description: t("templates.follow_up_visit_scheduling_prompt_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildCTAElement({
              headline: t("templates.follow_up_visit_scheduling_prompt_question_1_headline"),
              subheader: t("templates.follow_up_visit_scheduling_prompt_question_1_html"),
              buttonUrl: "https://continium.com",
              buttonExternal: true,
              required: false,
              ctaButtonLabel: t("templates.follow_up_visit_scheduling_prompt_question_1_button_label"),
            }),
          ],
          buttonLabel: t("templates.next"),
          t,
        }),
      ],
    },
    t
  );
};

const participantIntakeBarrierForm = (t: TFunction): TTemplate => {
  const reusableElementIds = [createId(), createId(), createId(), createId(), createId(), createId()];
  const reusableOptionIds = [createId(), createId(), createId(), createId(), createId()];
  const block3Id = createId(); // Pre-generate IDs for blocks referenced by logic
  const block4Id = createId();
  const block5Id = createId();
  const block6Id = createId();
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.participant_intake_barrier_form_name"),
      role: "studyCoordinator",
      industries: ["registryCohort"],
      channels: ["link"],
      description: t("templates.participant_intake_barrier_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildMultipleChoiceElement({
              id: reusableElementIds[0],
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              shuffleOption: "none",
              choices: [
                t("templates.participant_intake_barrier_form_question_1_choice_1"),
                t("templates.participant_intake_barrier_form_question_1_choice_2"),
                t("templates.participant_intake_barrier_form_question_1_choice_3"),
                t("templates.participant_intake_barrier_form_question_1_choice_4"),
                t("templates.participant_intake_barrier_form_question_1_choice_5"),
              ],
              choiceIds: [
                reusableOptionIds[0],
                reusableOptionIds[1],
                reusableOptionIds[2],
                reusableOptionIds[3],
                reusableOptionIds[4],
              ],
              headline: t("templates.participant_intake_barrier_form_question_1_headline"),
              required: true,
            }),
          ],
          logic: [
            createBlockChoiceJumpLogic(reusableElementIds[0], reusableOptionIds[1], block3Id),
            createBlockChoiceJumpLogic(reusableElementIds[0], reusableOptionIds[2], block4Id),
            createBlockChoiceJumpLogic(reusableElementIds[0], reusableOptionIds[3], block5Id),
            createBlockChoiceJumpLogic(reusableElementIds[0], reusableOptionIds[4], block6Id),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[1],
              headline: t("templates.participant_intake_barrier_form_question_2_headline"),
              required: true,
              placeholder: t("templates.participant_intake_barrier_form_question_2_placeholder"),
              inputType: "text",
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[1], localSurvey.endings[0].id, "isSubmitted")],
          t,
        }),
        buildBlock({
          id: block3Id,
          name: t("templates.block_3"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[2],
              headline: t("templates.participant_intake_barrier_form_question_3_headline"),
              required: true,
              placeholder: t("templates.participant_intake_barrier_form_question_3_placeholder"),
              inputType: "text",
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[2], localSurvey.endings[0].id, "isSubmitted")],
          t,
        }),
        buildBlock({
          id: block4Id,
          name: t("templates.block_4"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[3],
              headline: t("templates.participant_intake_barrier_form_question_4_headline"),
              required: true,
              placeholder: t("templates.participant_intake_barrier_form_question_4_placeholder"),
              inputType: "text",
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[3], localSurvey.endings[0].id, "isSubmitted")],
          t,
        }),
        buildBlock({
          id: block5Id,
          name: t("templates.block_5"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[4],
              headline: t("templates.participant_intake_barrier_form_question_5_headline"),
              required: true,
              placeholder: t("templates.participant_intake_barrier_form_question_5_placeholder"),
              inputType: "text",
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[4], localSurvey.endings[0].id, "isSubmitted")],
          t,
        }),
        buildBlock({
          id: block6Id,
          name: t("templates.block_6"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[5],
              headline: t("templates.participant_intake_barrier_form_question_6_headline"),
              required: false,
              subheader: t("templates.participant_intake_barrier_form_question_6_subheader"),
              placeholder: t("templates.participant_intake_barrier_form_question_6_placeholder"),
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const employeeSatisfaction = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);
  return buildSurvey(
    {
      name: t("templates.employee_satisfaction_name"),
      role: "monitorAuditor",
      industries: ["registryCohort", "clinicalTrial", "other"],
      channels: ["app", "link"],
      description: t("templates.employee_satisfaction_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildRatingElement({
              range: 5,
              scale: "star",
              headline: t("templates.employee_satisfaction_question_1_headline"),
              required: true,
              lowerLabel: t("templates.employee_satisfaction_question_1_lower_label"),
              upperLabel: t("templates.employee_satisfaction_question_1_upper_label"),
              isColorCodingEnabled: true,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              shuffleOption: "none",
              choices: [
                t("templates.employee_satisfaction_question_2_choice_1"),
                t("templates.employee_satisfaction_question_2_choice_2"),
                t("templates.employee_satisfaction_question_2_choice_3"),
                t("templates.employee_satisfaction_question_2_choice_4"),
                t("templates.employee_satisfaction_question_2_choice_5"),
              ],
              headline: t("templates.employee_satisfaction_question_2_headline"),
              required: true,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_3"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.employee_satisfaction_question_3_headline"),
              required: false,
              placeholder: t("templates.employee_satisfaction_question_3_placeholder"),
              inputType: "text",
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_4"),
          elements: [
            buildRatingElement({
              range: 5,
              scale: "number",
              headline: t("templates.employee_satisfaction_question_5_headline"),
              required: true,
              lowerLabel: t("templates.employee_satisfaction_question_5_lower_label"),
              upperLabel: t("templates.employee_satisfaction_question_5_upper_label"),
              isColorCodingEnabled: true,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_5"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.employee_satisfaction_question_6_headline"),
              required: false,
              placeholder: t("templates.employee_satisfaction_question_6_placeholder"),
              inputType: "text",
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_6"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              shuffleOption: "none",
              choices: [
                t("templates.employee_satisfaction_question_7_choice_1"),
                t("templates.employee_satisfaction_question_7_choice_2"),
                t("templates.employee_satisfaction_question_7_choice_3"),
                t("templates.employee_satisfaction_question_7_choice_4"),
                t("templates.employee_satisfaction_question_7_choice_5"),
              ],
              headline: t("templates.employee_satisfaction_question_7_headline"),
              required: true,
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const studyExperienceFeedbackForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.study_experience_feedback_form_name"),
      role: "studyCoordinator",
      industries: ["registryCohort", "other"],
      channels: ["app", "link"],
      description: t("templates.study_experience_feedback_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              shuffleOption: "none",
              choices: [
                t("templates.study_experience_feedback_form_question_1_choice_1"),
                t("templates.study_experience_feedback_form_question_1_choice_2"),
                t("templates.study_experience_feedback_form_question_1_choice_3"),
                t("templates.study_experience_feedback_form_question_1_choice_4"),
                t("templates.study_experience_feedback_form_question_1_choice_5"),
              ],
              headline: t("templates.study_experience_feedback_form_question_1_headline"),
              required: true,
              containsOther: true,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              shuffleOption: "none",
              choices: [
                t("templates.study_experience_feedback_form_question_2_choice_1"),
                t("templates.study_experience_feedback_form_question_2_choice_2"),
                t("templates.study_experience_feedback_form_question_2_choice_3"),
                t("templates.study_experience_feedback_form_question_2_choice_4"),
              ],
              headline: t("templates.study_experience_feedback_form_question_2_headline"),
              required: true,
              subheader: t("templates.study_experience_feedback_form_question_2_subheader"),
              containsOther: true,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_3"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.study_experience_feedback_form_question_3_headline"),
              required: false,
              subheader: t("templates.study_experience_feedback_form_question_3_subheader"),
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const specimenSourceTrackingForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.specimen_source_tracking_form_name"),
      role: "labStaff",
      industries: ["registryCohort", "clinicalTrial"],
      channels: ["website", "app", "link"],
      description: t("templates.specimen_source_tracking_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              headline: t("templates.specimen_source_tracking_form_question_1_headline"),
              subheader: t("templates.specimen_source_tracking_form_question_1_subheader"),
              required: true,
              shuffleOption: "none",
              choices: [
                t("templates.specimen_source_tracking_form_question_1_choice_1"),
                t("templates.specimen_source_tracking_form_question_1_choice_2"),
                t("templates.specimen_source_tracking_form_question_1_choice_3"),
                t("templates.specimen_source_tracking_form_question_1_choice_4"),
                t("templates.specimen_source_tracking_form_question_1_choice_5"),
              ],
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const visitReschedulingFeedbackForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.visit_rescheduling_feedback_form_name"),
      role: "studyCoordinator",
      industries: ["registryCohort"],
      channels: ["app"],
      description: t("templates.visit_rescheduling_feedback_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              headline: t("templates.visit_rescheduling_feedback_form_question_1_headline"),
              required: true,
              shuffleOption: "none",
              choices: [
                t("templates.visit_rescheduling_feedback_form_question_1_choice_1"),
                t("templates.visit_rescheduling_feedback_form_question_1_choice_2"),
                t("templates.visit_rescheduling_feedback_form_question_1_choice_3"),
                t("templates.visit_rescheduling_feedback_form_question_1_choice_4"),
                t("templates.visit_rescheduling_feedback_form_question_1_choice_5"),
              ],
            }),
          ],
          buttonLabel: t("templates.next"),
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              headline: t("templates.visit_rescheduling_feedback_form_question_2_headline"),
              required: true,
              shuffleOption: "none",
              choices: [
                t("templates.visit_rescheduling_feedback_form_question_2_choice_1"),
                t("templates.visit_rescheduling_feedback_form_question_2_choice_2"),
                t("templates.visit_rescheduling_feedback_form_question_2_choice_3"),
              ],
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const participantGoalAssessmentForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.participant_goal_assessment_form_name"),
      role: "studyCoordinator",
      industries: ["registryCohort", "other"],
      channels: ["app", "website"],
      description: t("templates.participant_goal_assessment_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              headline: t("templates.participant_goal_assessment_form_question_1_headline"),
              required: true,
              shuffleOption: "none",
              choices: [
                t("templates.participant_goal_assessment_form_question_1_choice_1"),
                t("templates.participant_goal_assessment_form_question_1_choice_2"),
                t("templates.participant_goal_assessment_form_question_1_choice_3"),
                t("templates.participant_goal_assessment_form_question_1_choice_4"),
              ],
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const participantFollowUpPreferenceForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.participant_follow_up_preference_form_name"),
      role: "studyCoordinator",
      industries: ["registryCohort"],
      channels: ["app"],
      description: t("templates.participant_follow_up_preference_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildRatingElement({
              range: 5,
              scale: "number",
              headline: t("templates.participant_follow_up_preference_form_question_1_headline"),
              required: true,
              lowerLabel: t("templates.participant_follow_up_preference_form_question_1_lower_label"),
              upperLabel: t("templates.participant_follow_up_preference_form_question_1_upper_label"),
              isColorCodingEnabled: false,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              shuffleOption: "none",
              choices: [
                t("templates.participant_follow_up_preference_form_question_2_choice_1"),
                t("templates.participant_follow_up_preference_form_question_2_choice_2"),
                t("templates.participant_follow_up_preference_form_question_2_choice_3"),
                t("templates.participant_follow_up_preference_form_question_2_choice_4"),
              ],
              headline: t("templates.participant_follow_up_preference_form_question_2_headline"),
              required: true,
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const remoteFollowUpInterestForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.remote_follow_up_interest_form_name"),
      role: "studyCoordinator",
      industries: ["registryCohort", "clinicalTrial"],
      channels: ["app", "website"],
      description: t("templates.remote_follow_up_interest_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildRatingElement({
              headline: t("templates.remote_follow_up_interest_form_question_1_headline"),
              required: true,
              lowerLabel: t("templates.remote_follow_up_interest_form_question_1_lower_label"),
              upperLabel: t("templates.remote_follow_up_interest_form_question_1_upper_label"),
              range: 5,
              scale: "number",
              isColorCodingEnabled: false,
            }),
          ],
          buttonLabel: t("templates.next"),
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceMulti,
              headline: t("templates.remote_follow_up_interest_form_question_2_headline"),
              required: false,
              shuffleOption: "none",
              choices: [
                t("templates.remote_follow_up_interest_form_question_2_choice_1"),
                t("templates.remote_follow_up_interest_form_question_2_choice_2"),
                t("templates.remote_follow_up_interest_form_question_2_choice_3"),
                t("templates.remote_follow_up_interest_form_question_2_choice_4"),
              ],
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const studySupportRequestForm = (t: TFunction): TTemplate => {
  const reusableElementIds = [createId(), createId(), createId(), createId()];
  const reusableOptionIds = [createId(), createId()];
  const block2Id = createId(); // Pre-generate IDs for blocks referenced by logic
  const block3Id = createId(); // Block 3 referenced by block 2
  const block4Id = createId();
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.study_support_request_form_name"),
      role: "studyCoordinator",
      industries: ["registryCohort"],
      channels: ["app"],
      description: t("templates.study_support_request_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildMultipleChoiceElement({
              id: reusableElementIds[0],
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              shuffleOption: "none",
              choices: [
                t("templates.study_support_request_form_question_1_choice_1"),
                t("templates.study_support_request_form_question_1_choice_2"),
              ],
              choiceIds: [reusableOptionIds[0], reusableOptionIds[1]],
              headline: t("templates.study_support_request_form_question_1_headline"),
              required: true,
              subheader: t("templates.study_support_request_form_question_1_subheader"),
            }),
          ],
          logic: [
            createBlockChoiceJumpLogic(reusableElementIds[0], reusableOptionIds[0], block2Id),
            createBlockChoiceJumpLogic(reusableElementIds[0], reusableOptionIds[1], block4Id),
          ],
          buttonLabel: t("templates.next"),
          t,
        }),
        buildBlock({
          id: block2Id,
          name: t("templates.block_2"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[1],
              headline: t("templates.study_support_request_form_question_2_headline"),
              required: true,
              subheader: t("templates.study_support_request_form_question_2_subheader"),
              inputType: "text",
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[1], block3Id, "isSubmitted")],
          t,
        }),
        buildBlock({
          id: block3Id,
          name: t("templates.block_3"),
          elements: [
            buildCTAElement({
              id: reusableElementIds[2],
              subheader: t("templates.study_support_request_form_question_3_html"),
              headline: t("templates.study_support_request_form_question_3_headline"),
              required: false,
            }),
          ],
          buttonLabel: t("templates.study_support_request_form_question_3_button_label"),
          t,
        }),
        buildBlock({
          id: block4Id,
          name: t("templates.block_4"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[3],
              headline: t("templates.study_support_request_form_question_4_headline"),
              required: true,
              subheader: t("templates.study_support_request_form_question_4_subheader"),
              placeholder: t("templates.study_support_request_form_question_4_placeholder"),
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.study_support_request_form_question_4_button_label"),
          t,
        }),
      ],
    },
    t
  );
};

const followUpSetupExperienceForm = (t: TFunction): TTemplate => {
  const reusableElementIds = [createId(), createId(), createId()];
  const block3Id = createId(); // Pre-generate ID for Block 3 (referenced by Block 1 logic)
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.follow_up_setup_experience_form_name"),
      role: "studyCoordinator",
      industries: ["registryCohort"],
      channels: ["app"],
      description: t("templates.follow_up_setup_experience_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildRatingElement({
              id: reusableElementIds[0],
              range: 5,
              scale: "number",
              headline: t("templates.follow_up_setup_experience_form_question_1_headline"),
              required: true,
              lowerLabel: t("templates.follow_up_setup_experience_form_question_1_lower_label"),
              upperLabel: t("templates.follow_up_setup_experience_form_question_1_upper_label"),
              isColorCodingEnabled: false,
            }),
          ],
          logic: [
            {
              id: createId(),
              conditions: {
                id: createId(),
                connector: "and",
                conditions: [
                  {
                    id: createId(),
                    leftOperand: {
                      value: reusableElementIds[0],
                      type: "element",
                    },
                    operator: "isGreaterThanOrEqual",
                    rightOperand: {
                      type: "static",
                      value: 4,
                    },
                  },
                ],
              },
              actions: [
                {
                  id: createId(),
                  objective: "jumpToBlock",
                  target: block3Id,
                },
              ],
            },
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[1],
              headline: t("templates.follow_up_setup_experience_form_question_2_headline"),
              required: false,
              placeholder: t("templates.follow_up_setup_experience_form_question_2_placeholder"),
              inputType: "text",
            }),
          ],
          t,
        }),
        buildBlock({
          id: block3Id,
          name: t("templates.block_3"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[2],
              headline: t("templates.follow_up_setup_experience_form_question_3_headline"),
              required: false,
              subheader: t("templates.follow_up_setup_experience_form_question_3_subheader"),
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const preferredFollowUpChannelForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.preferred_follow_up_channel_form_name"),
      role: "studyCoordinator",
      industries: ["registryCohort"],
      channels: ["app"],
      description: t("templates.preferred_follow_up_channel_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              headline: t("templates.preferred_follow_up_channel_form_question_1_headline"),
              required: true,
              shuffleOption: "none",
              choices: [
                t("templates.preferred_follow_up_channel_form_question_1_choice_1"),
                t("templates.preferred_follow_up_channel_form_question_1_choice_2"),
                t("templates.preferred_follow_up_channel_form_question_1_choice_3"),
                t("templates.preferred_follow_up_channel_form_question_1_choice_4"),
                t("templates.preferred_follow_up_channel_form_question_1_choice_5"),
              ],
              containsOther: true,
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const studyInstructionFeedbackForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.study_instruction_feedback_form_name"),
      role: "studyCoordinator",
      industries: ["registryCohort"],
      channels: ["app", "website", "link"],
      description: t("templates.study_instruction_feedback_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              headline: t("templates.study_instruction_feedback_form_question_1_headline"),
              required: true,
              shuffleOption: "none",
              choices: [
                t("templates.study_instruction_feedback_form_question_1_choice_1"),
                t("templates.study_instruction_feedback_form_question_1_choice_2"),
              ],
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.study_instruction_feedback_form_question_2_headline"),
              required: false,
              inputType: "text",
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_3"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.study_instruction_feedback_form_question_3_headline"),
              required: false,
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const studyExperienceScoreForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.study_experience_score_form_name"),
      role: "clinician",
      industries: ["registryCohort", "clinicalTrial", "other"],
      channels: ["app", "link", "website"],
      description: t("templates.study_experience_score_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildNPSElement({
              headline: t("templates.study_experience_score_form_question_1_headline"),
              required: false,
              lowerLabel: t("templates.study_experience_score_form_question_1_lower_label"),
              upperLabel: t("templates.study_experience_score_form_question_1_upper_label"),
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.study_experience_score_form_question_2_headline"),
              required: false,
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const participantStudySatisfactionForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);
  return buildSurvey(
    {
      name: t("templates.participant_study_satisfaction_form_name"),
      role: "clinician",
      industries: ["registryCohort", "clinicalTrial", "other"],
      channels: ["app", "link", "website"],
      description: t("templates.participant_study_satisfaction_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildRatingElement({
              range: 10,
              scale: "number",
              headline: t("templates.participant_study_satisfaction_form_question_1_headline"),
              required: true,
              lowerLabel: t("templates.participant_study_satisfaction_form_question_1_lower_label"),
              upperLabel: t("templates.participant_study_satisfaction_form_question_1_upper_label"),
              isColorCodingEnabled: false,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              headline: t("templates.participant_study_satisfaction_form_question_2_headline"),
              subheader: t("templates.participant_study_satisfaction_form_question_2_subheader"),
              required: true,
              choices: [
                t("templates.participant_study_satisfaction_form_question_2_choice_1"),
                t("templates.participant_study_satisfaction_form_question_2_choice_2"),
                t("templates.participant_study_satisfaction_form_question_2_choice_3"),
                t("templates.participant_study_satisfaction_form_question_2_choice_4"),
                t("templates.participant_study_satisfaction_form_question_2_choice_5"),
              ],
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_3"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceMulti,
              headline: t("templates.participant_study_satisfaction_form_question_3_headline"),
              subheader: t("templates.participant_study_satisfaction_form_question_3_subheader"),
              required: true,
              choices: [
                t("templates.participant_study_satisfaction_form_question_3_choice_1"),
                t("templates.participant_study_satisfaction_form_question_3_choice_2"),
                t("templates.participant_study_satisfaction_form_question_3_choice_3"),
                t("templates.participant_study_satisfaction_form_question_3_choice_4"),
                t("templates.participant_study_satisfaction_form_question_3_choice_5"),
                t("templates.participant_study_satisfaction_form_question_3_choice_6"),
                t("templates.participant_study_satisfaction_form_question_3_choice_7"),
                t("templates.participant_study_satisfaction_form_question_3_choice_8"),
                t("templates.participant_study_satisfaction_form_question_3_choice_9"),
                t("templates.participant_study_satisfaction_form_question_3_choice_10"),
              ],
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_4"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              headline: t("templates.participant_study_satisfaction_form_question_4_headline"),
              subheader: t("templates.participant_study_satisfaction_form_question_4_subheader"),
              required: true,
              choices: [
                t("templates.participant_study_satisfaction_form_question_4_choice_1"),
                t("templates.participant_study_satisfaction_form_question_4_choice_2"),
                t("templates.participant_study_satisfaction_form_question_4_choice_3"),
                t("templates.participant_study_satisfaction_form_question_4_choice_4"),
                t("templates.participant_study_satisfaction_form_question_4_choice_5"),
              ],
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_5"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              headline: t("templates.participant_study_satisfaction_form_question_5_headline"),
              subheader: t("templates.participant_study_satisfaction_form_question_5_subheader"),
              required: true,
              choices: [
                t("templates.participant_study_satisfaction_form_question_5_choice_1"),
                t("templates.participant_study_satisfaction_form_question_5_choice_2"),
                t("templates.participant_study_satisfaction_form_question_5_choice_3"),
                t("templates.participant_study_satisfaction_form_question_5_choice_4"),
                t("templates.participant_study_satisfaction_form_question_5_choice_5"),
              ],
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_6"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              headline: t("templates.participant_study_satisfaction_form_question_6_headline"),
              subheader: t("templates.participant_study_satisfaction_form_question_6_subheader"),
              required: true,
              choices: [
                t("templates.participant_study_satisfaction_form_question_6_choice_1"),
                t("templates.participant_study_satisfaction_form_question_6_choice_2"),
                t("templates.participant_study_satisfaction_form_question_6_choice_3"),
                t("templates.participant_study_satisfaction_form_question_6_choice_4"),
                t("templates.participant_study_satisfaction_form_question_6_choice_5"),
              ],
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_7"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              headline: t("templates.participant_study_satisfaction_form_question_7_headline"),
              subheader: t("templates.participant_study_satisfaction_form_question_7_subheader"),
              required: true,
              choices: [
                t("templates.participant_study_satisfaction_form_question_7_choice_1"),
                t("templates.participant_study_satisfaction_form_question_7_choice_2"),
                t("templates.participant_study_satisfaction_form_question_7_choice_3"),
                t("templates.participant_study_satisfaction_form_question_7_choice_4"),
                t("templates.participant_study_satisfaction_form_question_7_choice_5"),
              ],
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_8"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              headline: t("templates.participant_study_satisfaction_form_question_8_headline"),
              subheader: t("templates.participant_study_satisfaction_form_question_8_subheader"),
              required: true,
              choices: [
                t("templates.participant_study_satisfaction_form_question_8_choice_1"),
                t("templates.participant_study_satisfaction_form_question_8_choice_2"),
                t("templates.participant_study_satisfaction_form_question_8_choice_3"),
                t("templates.participant_study_satisfaction_form_question_8_choice_4"),
                t("templates.participant_study_satisfaction_form_question_8_choice_5"),
              ],
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_9"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              headline: t("templates.participant_study_satisfaction_form_question_9_headline"),
              subheader: t("templates.participant_study_satisfaction_form_question_9_subheader"),
              required: true,
              choices: [
                t("templates.participant_study_satisfaction_form_question_9_choice_1"),
                t("templates.participant_study_satisfaction_form_question_9_choice_2"),
                t("templates.participant_study_satisfaction_form_question_9_choice_3"),
                t("templates.participant_study_satisfaction_form_question_9_choice_4"),
                t("templates.participant_study_satisfaction_form_question_9_choice_5"),
              ],
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_10"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.participant_study_satisfaction_form_question_10_headline"),
              required: false,
              placeholder: t("templates.participant_study_satisfaction_form_question_10_placeholder"),
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const comprehensiveStudyFeedbackForm = (t: TFunction): TTemplate => {
  const reusableElementIds = [
    createId(),
    createId(),
    createId(),
    createId(),
    createId(),
    createId(),
    createId(),
  ];
  const block3Id = createId(); // Pre-generate IDs for blocks referenced by logic
  const block4Id = createId();
  const localSurvey = getDefaultSurveyPreset(t);
  return buildSurvey(
    {
      name: t("templates.comprehensive_study_feedback_form_name"),
      role: "studyCoordinator",
      industries: ["other", "clinicalTrial"],
      channels: ["website", "link"],
      description: t("templates.comprehensive_study_feedback_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildRatingElement({
              id: reusableElementIds[0],
              range: 5,
              scale: "star",
              headline: t("templates.comprehensive_study_feedback_form_question_1_headline"),
              subheader: t("templates.comprehensive_study_feedback_form_question_1_subheader"),
              required: true,
              lowerLabel: t("templates.comprehensive_study_feedback_form_question_1_lower_label"),
              upperLabel: t("templates.comprehensive_study_feedback_form_question_1_upper_label"),
              isColorCodingEnabled: false,
            }),
          ],
          logic: [
            {
              id: createId(),
              conditions: {
                id: createId(),
                connector: "and",
                conditions: [
                  {
                    id: createId(),
                    leftOperand: {
                      value: reusableElementIds[0],
                      type: "element",
                    },
                    operator: "isLessThanOrEqual",
                    rightOperand: {
                      type: "static",
                      value: 3,
                    },
                  },
                ],
              },
              actions: [
                {
                  id: createId(),
                  objective: "jumpToBlock",
                  target: block3Id,
                },
              ],
            },
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[1],
              headline: t("templates.comprehensive_study_feedback_form_question_2_headline"),
              required: true,
              longAnswer: true,
              placeholder: t("templates.comprehensive_study_feedback_form_question_2_placeholder"),
              inputType: "text",
            }),
          ],
          logic: [
            {
              id: createId(),
              conditions: {
                id: createId(),
                connector: "and",
                conditions: [
                  {
                    id: createId(),
                    leftOperand: {
                      value: reusableElementIds[1],
                      type: "element",
                    },
                    operator: "isSubmitted",
                  },
                ],
              },
              actions: [
                {
                  id: createId(),
                  objective: "jumpToBlock",
                  target: block4Id,
                },
              ],
            },
          ],
          t,
        }),
        buildBlock({
          id: block3Id,
          name: t("templates.block_3"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[2],
              headline: t("templates.comprehensive_study_feedback_form_question_3_headline"),
              required: true,
              longAnswer: true,
              placeholder: t("templates.comprehensive_study_feedback_form_question_3_placeholder"),
              inputType: "text",
            }),
          ],
          t,
        }),
        buildBlock({
          id: block4Id,
          name: t("templates.block_4"),
          elements: [
            buildRatingElement({
              id: reusableElementIds[3],
              range: 5,
              scale: "smiley",
              headline: t("templates.comprehensive_study_feedback_form_question_4_headline"),
              required: true,
              lowerLabel: t("templates.comprehensive_study_feedback_form_question_4_lower_label"),
              upperLabel: t("templates.comprehensive_study_feedback_form_question_4_upper_label"),
              isColorCodingEnabled: false,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_5"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[4],
              headline: t("templates.comprehensive_study_feedback_form_question_5_headline"),
              required: false,
              longAnswer: true,
              placeholder: t("templates.comprehensive_study_feedback_form_question_5_placeholder"),
              inputType: "text",
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_6"),
          elements: [
            buildMultipleChoiceElement({
              id: reusableElementIds[5],
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              choices: [
                t("templates.comprehensive_study_feedback_form_question_6_choice_1"),
                t("templates.comprehensive_study_feedback_form_question_6_choice_2"),
                t("templates.comprehensive_study_feedback_form_question_6_choice_3"),
                t("templates.comprehensive_study_feedback_form_question_6_choice_4"),
                t("templates.comprehensive_study_feedback_form_question_6_choice_5"),
              ],
              headline: t("templates.comprehensive_study_feedback_form_question_6_headline"),
              required: true,
              shuffleOption: "none",
              containsOther: true,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_7"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[6],
              headline: t("templates.comprehensive_study_feedback_form_question_7_headline"),
              required: false,
              inputType: "email",
              longAnswer: false,
              placeholder: t("templates.comprehensive_study_feedback_form_question_7_placeholder"),
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const coordinatorWorkloadAssessmentForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.coordinator_workload_assessment_form_name"),
      role: "dataManager",
      industries: ["registryCohort"],
      channels: ["app", "link"],
      description: t("templates.coordinator_workload_assessment_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              headline: t("templates.coordinator_workload_assessment_form_question_1_headline"),
              required: true,
              shuffleOption: "none",
              choices: [
                t("templates.coordinator_workload_assessment_form_question_1_choice_1"),
                t("templates.coordinator_workload_assessment_form_question_1_choice_2"),
                t("templates.coordinator_workload_assessment_form_question_1_choice_3"),
                t("templates.coordinator_workload_assessment_form_question_1_choice_4"),
              ],
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const studyWorkflowPrioritizationForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.study_workflow_prioritization_form_name"),
      role: "studyCoordinator",
      industries: ["registryCohort"],
      channels: ["app"],
      description: t("templates.study_workflow_prioritization_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              shuffleOption: "none",
              choices: [
                t("templates.study_workflow_prioritization_form_question_1_choice_1"),
                t("templates.study_workflow_prioritization_form_question_1_choice_2"),
                t("templates.study_workflow_prioritization_form_question_1_choice_3"),
                t("templates.study_workflow_prioritization_form_question_1_choice_4"),
              ],
              headline: t("templates.study_workflow_prioritization_form_question_1_headline"),
              required: true,
              containsOther: true,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              shuffleOption: "none",
              choices: [
                t("templates.study_workflow_prioritization_form_question_2_choice_1"),
                t("templates.study_workflow_prioritization_form_question_2_choice_2"),
                t("templates.study_workflow_prioritization_form_question_2_choice_3"),
              ],
              headline: t("templates.study_workflow_prioritization_form_question_2_headline"),
              required: true,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_3"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.study_workflow_prioritization_form_question_3_headline"),
              required: true,
              placeholder: t("templates.study_workflow_prioritization_form_question_3_placeholder"),
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const visitProcessEaseForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.visit_process_ease_form_name"),
      role: "studyCoordinator",
      industries: ["registryCohort"],
      channels: ["app"],
      description: t("templates.visit_process_ease_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildRatingElement({
              headline: t("templates.visit_process_ease_form_question_1_headline"),
              required: true,
              lowerLabel: t("templates.visit_process_ease_form_question_1_lower_label"),
              upperLabel: t("templates.visit_process_ease_form_question_1_upper_label"),
              scale: "number",
              range: 5,
              isColorCodingEnabled: false,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.visit_process_ease_form_question_2_headline"),
              required: false,
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const labInstructionClarityForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.lab_instruction_clarity_form_name"),
      role: "labStaff",
      industries: ["registryCohort", "clinicalTrial", "other"],
      channels: ["website"],
      description: t("templates.lab_instruction_clarity_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              headline: t("templates.lab_instruction_clarity_form_question_1_headline"),
              required: true,
              shuffleOption: "none",
              choices: [
                t("templates.lab_instruction_clarity_form_question_1_choice_1"),
                t("templates.lab_instruction_clarity_form_question_1_choice_2"),
                t("templates.lab_instruction_clarity_form_question_1_choice_3"),
              ],
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.lab_instruction_clarity_form_question_2_headline"),
              required: false,
              inputType: "text",
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_3"),
          elements: [
            buildCTAElement({
              headline: t("templates.lab_instruction_clarity_form_question_3_headline"),
              subheader: "",
              required: false,
              buttonUrl: "https://continium.com",
              buttonExternal: true,
              ctaButtonLabel: t("templates.lab_instruction_clarity_form_question_3_button_label"),
            }),
          ],
          buttonLabel: t("templates.next"),
          t,
        }),
      ],
    },
    t
  );
};

const followUpEffortScoreForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.follow_up_effort_score_form_name"),
      role: "studyCoordinator",
      industries: ["registryCohort"],
      channels: ["app"],
      description: t("templates.follow_up_effort_score_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildRatingElement({
              range: 5,
              scale: "number",
              headline: t("templates.follow_up_effort_score_form_question_1_headline"),
              required: true,
              lowerLabel: t("templates.follow_up_effort_score_form_question_1_lower_label"),
              upperLabel: t("templates.follow_up_effort_score_form_question_1_upper_label"),
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.follow_up_effort_score_form_question_2_headline"),
              required: true,
              placeholder: t("templates.follow_up_effort_score_form_question_2_placeholder"),
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const siteMonitoringReadinessForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.site_monitoring_readiness_form_name"),
      role: "monitorAuditor",
      industries: ["registryCohort", "clinicalTrial", "other"],
      channels: ["link"],
      description: t("templates.site_monitoring_readiness_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildRatingElement({
              range: 5,
              scale: "number",
              headline: t("templates.site_monitoring_readiness_form_question_1_headline"),
              lowerLabel: t("templates.site_monitoring_readiness_form_question_1_lower_label"),
              upperLabel: t("templates.site_monitoring_readiness_form_question_1_upper_label"),
              required: true,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildRatingElement({
              range: 5,
              scale: "number",
              headline: t("templates.site_monitoring_readiness_form_question_2_headline"),
              lowerLabel: t("templates.site_monitoring_readiness_form_question_2_lower_label"),
              upperLabel: t("templates.site_monitoring_readiness_form_question_2_upper_label"),
              required: true,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_3"),
          elements: [
            buildRatingElement({
              range: 5,
              scale: "number",
              headline: t("templates.site_monitoring_readiness_form_question_3_headline"),
              lowerLabel: t("templates.site_monitoring_readiness_form_question_3_lower_label"),
              upperLabel: t("templates.site_monitoring_readiness_form_question_3_upper_label"),
              required: true,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_4"),
          elements: [
            buildRatingElement({
              range: 5,
              scale: "number",
              headline: t("templates.site_monitoring_readiness_form_question_4_headline"),
              lowerLabel: t("templates.site_monitoring_readiness_form_question_4_lower_label"),
              upperLabel: t("templates.site_monitoring_readiness_form_question_4_upper_label"),
              required: true,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_5"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              headline: t("templates.site_monitoring_readiness_form_question_5_headline"),
              subheader: t("templates.site_monitoring_readiness_form_question_5_subheader"),
              required: true,
              shuffleOption: "none",
              choices: [
                t("templates.site_monitoring_readiness_form_question_5_choice_1"),
                t("templates.site_monitoring_readiness_form_question_5_choice_2"),
                t("templates.site_monitoring_readiness_form_question_5_choice_3"),
                t("templates.site_monitoring_readiness_form_question_5_choice_4"),
                t("templates.site_monitoring_readiness_form_question_5_choice_5"),
                t("templates.site_monitoring_readiness_form_question_5_choice_6"),
              ],
              containsOther: true,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_6"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              headline: t("templates.site_monitoring_readiness_form_question_6_headline"),
              subheader: t("templates.site_monitoring_readiness_form_question_6_subheader"),
              required: true,
              shuffleOption: "exceptLast",
              choices: [
                t("templates.site_monitoring_readiness_form_question_6_choice_1"),
                t("templates.site_monitoring_readiness_form_question_6_choice_2"),
                t("templates.site_monitoring_readiness_form_question_6_choice_3"),
                t("templates.site_monitoring_readiness_form_question_6_choice_4"),
                t("templates.site_monitoring_readiness_form_question_6_choice_5"),
                t("templates.site_monitoring_readiness_form_question_6_choice_6"),
              ],
              containsOther: true,
            }),
          ],
          t,
        }),
      ],
    },
    t
  );
};

const monitorTrainingNeedsForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);

  return buildSurvey(
    {
      name: t("templates.monitor_training_needs_form_name"),
      role: "monitorAuditor",
      industries: ["registryCohort", "clinicalTrial", "other"],
      channels: ["link"],
      description: t("templates.monitor_training_needs_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              headline: t("templates.monitor_training_needs_form_question_1_headline"),
              required: true,
              shuffleOption: "none",
              choices: [
                t("templates.monitor_training_needs_form_question_1_choice_1"),
                t("templates.monitor_training_needs_form_question_1_choice_2"),
              ],
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceMulti,
              headline: t("templates.monitor_training_needs_form_question_2_headline"),
              subheader: t("templates.monitor_training_needs_form_question_2_subheader"),
              required: true,
              shuffleOption: "exceptLast",
              choices: [
                t("templates.monitor_training_needs_form_question_2_choice_1"),
                t("templates.monitor_training_needs_form_question_2_choice_2"),
                t("templates.monitor_training_needs_form_question_2_choice_3"),
                t("templates.monitor_training_needs_form_question_2_choice_4"),
                t("templates.monitor_training_needs_form_question_2_choice_5"),
                t("templates.monitor_training_needs_form_question_2_choice_6"),
              ],
              containsOther: true,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_3"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              headline: t("templates.monitor_training_needs_form_question_3_headline"),
              required: true,
              shuffleOption: "none",
              choices: [
                t("templates.monitor_training_needs_form_question_3_choice_1"),
                t("templates.monitor_training_needs_form_question_3_choice_2"),
              ],
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_4"),
          elements: [
            buildRatingElement({
              range: 5,
              scale: "number",
              headline: t("templates.monitor_training_needs_form_question_4_headline"),
              lowerLabel: t("templates.monitor_training_needs_form_question_4_lower_label"),
              upperLabel: t("templates.monitor_training_needs_form_question_4_upper_label"),
              required: true,
              isColorCodingEnabled: false,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_5"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceMulti,
              headline: t("templates.monitor_training_needs_form_question_5_headline"),
              required: true,
              shuffleOption: "exceptLast",
              choices: [
                t("templates.monitor_training_needs_form_question_5_choice_1"),
                t("templates.monitor_training_needs_form_question_5_choice_2"),
                t("templates.monitor_training_needs_form_question_5_choice_3"),
                t("templates.monitor_training_needs_form_question_5_choice_4"),
                t("templates.monitor_training_needs_form_question_5_choice_5"),
                t("templates.monitor_training_needs_form_question_5_choice_6"),
              ],
              containsOther: true,
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const consentCompletionExperienceForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);
  const reusableElementIds = [createId(), createId(), createId()];
  const block3Id = createId(); // Pre-generate ID for Block 3 (referenced by Block 1 logic)
  return buildSurvey(
    {
      name: t("templates.consent_completion_experience_name"),
      role: "studyCoordinator",
      industries: ["clinicalTrial"],
      channels: ["website", "app"],
      description: t("templates.consent_completion_experience_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildRatingElement({
              id: reusableElementIds[0],
              range: 5,
              scale: "number",
              headline: t("templates.consent_completion_experience_question_1_headline"),
              required: true,
              lowerLabel: t("templates.consent_completion_experience_question_1_lower_label"),
              upperLabel: t("templates.consent_completion_experience_question_1_upper_label"),
              isColorCodingEnabled: false,
            }),
          ],
          logic: [
            {
              id: createId(),
              conditions: {
                id: createId(),
                connector: "and",
                conditions: [
                  {
                    id: createId(),
                    leftOperand: {
                      value: reusableElementIds[0],
                      type: "element",
                    },
                    operator: "isGreaterThanOrEqual",
                    rightOperand: {
                      type: "static",
                      value: 4,
                    },
                  },
                ],
              },
              actions: [
                {
                  id: createId(),
                  objective: "jumpToBlock",
                  target: block3Id,
                },
              ],
            },
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[1],
              headline: t("templates.consent_completion_experience_question_2_headline"),
              required: true,
              placeholder: t("templates.consent_completion_experience_question_2_placeholder"),
              inputType: "text",
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[1], localSurvey.endings[0].id, "isSubmitted")],
          t,
        }),
        buildBlock({
          id: block3Id,
          name: t("templates.block_3"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[2],
              headline: t("templates.consent_completion_experience_question_3_headline"),
              required: true,
              placeholder: t("templates.consent_completion_experience_question_3_placeholder"),
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const recordSearchExperienceForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);
  const reusableElementIds = [createId(), createId(), createId()];
  const block3Id = createId(); // Pre-generate ID for Block 3 (referenced by Block 1 logic)

  return buildSurvey(
    {
      name: t("templates.record_search_experience_form_name"),
      role: "studyCoordinator",
      industries: ["registryCohort", "clinicalTrial"],
      channels: ["app", "website"],
      description: t("templates.record_search_experience_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildRatingElement({
              id: reusableElementIds[0],
              range: 5,
              scale: "number",
              headline: t("templates.record_search_experience_form_question_1_headline"),
              required: true,
              lowerLabel: t("templates.record_search_experience_form_question_1_lower_label"),
              upperLabel: t("templates.record_search_experience_form_question_1_upper_label"),
              isColorCodingEnabled: false,
            }),
          ],
          logic: [
            {
              id: createId(),
              conditions: {
                id: createId(),
                connector: "and",
                conditions: [
                  {
                    id: createId(),
                    leftOperand: {
                      value: reusableElementIds[0],
                      type: "element",
                    },
                    operator: "isGreaterThanOrEqual",
                    rightOperand: {
                      type: "static",
                      value: 4,
                    },
                  },
                ],
              },
              actions: [
                {
                  id: createId(),
                  objective: "jumpToBlock",
                  target: block3Id,
                },
              ],
            },
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[1],
              headline: t("templates.record_search_experience_form_question_2_headline"),
              required: true,
              placeholder: t("templates.record_search_experience_form_question_2_placeholder"),
              inputType: "text",
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[1], localSurvey.endings[0].id, "isSubmitted")],
          t,
        }),
        buildBlock({
          id: block3Id,
          name: t("templates.block_3"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[2],
              headline: t("templates.record_search_experience_form_question_3_headline"),
              required: true,
              placeholder: t("templates.record_search_experience_form_question_3_placeholder"),
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const labGuidanceQualityForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);
  const reusableElementIds = [createId(), createId(), createId()];
  const block3Id = createId(); // Pre-generate ID for Block 3 (referenced by Block 1 logic)

  return buildSurvey(
    {
      name: t("templates.lab_guidance_quality_form_name"),
      role: "labStaff",
      industries: ["other"],
      channels: ["website"],
      description: t("templates.lab_guidance_quality_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildRatingElement({
              id: reusableElementIds[0],
              range: 5,
              scale: "number",
              headline: t("templates.lab_guidance_quality_form_question_1_headline"),
              required: true,
              lowerLabel: t("templates.lab_guidance_quality_form_question_1_lower_label"),
              upperLabel: t("templates.lab_guidance_quality_form_question_1_upper_label"),
              isColorCodingEnabled: false,
            }),
          ],
          logic: [
            {
              id: createId(),
              conditions: {
                id: createId(),
                connector: "and",
                conditions: [
                  {
                    id: createId(),
                    leftOperand: {
                      value: reusableElementIds[0],
                      type: "element",
                    },
                    operator: "isGreaterThanOrEqual",
                    rightOperand: {
                      type: "static",
                      value: 4,
                    },
                  },
                ],
              },
              actions: [
                {
                  id: createId(),
                  objective: "jumpToBlock",
                  target: block3Id,
                },
              ],
            },
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[1],
              headline: t("templates.lab_guidance_quality_form_question_2_headline"),
              required: true,
              placeholder: t("templates.lab_guidance_quality_form_question_2_placeholder"),
              inputType: "text",
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[1], localSurvey.endings[0].id, "isSubmitted")],
          t,
        }),
        buildBlock({
          id: block3Id,
          name: t("templates.block_3"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[2],
              headline: t("templates.lab_guidance_quality_form_question_3_headline"),
              required: true,
              placeholder: t("templates.lab_guidance_quality_form_question_3_placeholder"),
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const studyTaskCompletionForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);
  const reusableElementIds = [createId(), createId(), createId(), createId(), createId()];
  const reusableOptionIds = [createId(), createId(), createId()];
  const block2Id = createId(); // Pre-generate IDs for blocks referenced by logic
  const block4Id = createId();
  const block5Id = createId();

  return buildSurvey(
    {
      name: t("templates.study_task_completion_form_name"),
      role: "studyCoordinator",
      industries: ["registryCohort"],
      channels: ["app", "website"],
      description: t("templates.study_task_completion_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildMultipleChoiceElement({
              id: reusableElementIds[0],
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              shuffleOption: "none",
              choices: [
                t("templates.study_task_completion_form_question_1_option_1_label"),
                t("templates.study_task_completion_form_question_1_option_2_label"),
                t("templates.study_task_completion_form_question_1_option_3_label"),
              ],
              choiceIds: [reusableOptionIds[0], reusableOptionIds[1], reusableOptionIds[2]],
              headline: t("templates.study_task_completion_form_question_1_headline"),
              required: true,
            }),
          ],
          logic: [
            createBlockChoiceJumpLogic(reusableElementIds[0], reusableOptionIds[1], block4Id),
            createBlockChoiceJumpLogic(reusableElementIds[0], reusableOptionIds[0], block2Id),
            createBlockChoiceJumpLogic(reusableElementIds[0], reusableOptionIds[2], block5Id),
          ],
          t,
        }),
        buildBlock({
          id: block2Id,
          name: t("templates.block_2"),
          elements: [
            buildRatingElement({
              id: reusableElementIds[1],
              range: 5,
              scale: "number",
              headline: t("templates.study_task_completion_form_question_2_headline"),
              required: false,
              lowerLabel: t("templates.study_task_completion_form_question_2_lower_label"),
              upperLabel: t("templates.study_task_completion_form_question_2_upper_label"),
              isColorCodingEnabled: false,
            }),
          ],
          logic: [
            {
              id: createId(),
              conditions: {
                id: createId(),
                connector: "and",
                conditions: [
                  {
                    id: createId(),
                    leftOperand: {
                      value: reusableElementIds[1],
                      type: "element",
                    },
                    operator: "isGreaterThanOrEqual",
                    rightOperand: {
                      type: "static",
                      value: 4,
                    },
                  },
                ],
              },
              actions: [
                {
                  id: createId(),
                  objective: "jumpToBlock",
                  target: block4Id,
                },
              ],
            },
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_3"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[2],
              headline: t("templates.study_task_completion_form_question_3_headline"),
              required: false,
              placeholder: t("templates.study_task_completion_form_question_3_placeholder"),
              inputType: "text",
            }),
          ],
          logic: [
            {
              id: createId(),
              conditions: {
                id: createId(),
                connector: "or",
                conditions: [
                  {
                    id: createId(),
                    leftOperand: {
                      value: reusableElementIds[2],
                      type: "element",
                    },
                    operator: "isSubmitted",
                  },
                  {
                    id: createId(),
                    leftOperand: {
                      value: reusableElementIds[1],
                      type: "element",
                    },
                    operator: "isSkipped",
                  },
                ],
              },
              actions: [
                {
                  id: createId(),
                  objective: "jumpToBlock",
                  target: localSurvey.endings[0].id,
                },
              ],
            },
          ],
          t,
        }),
        buildBlock({
          id: block4Id,
          name: t("templates.block_4"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[3],
              headline: t("templates.study_task_completion_form_question_4_headline"),
              required: false,
              inputType: "text",
            }),
          ],
          logic: [
            {
              id: createId(),
              conditions: {
                id: createId(),
                connector: "or",
                conditions: [
                  {
                    id: createId(),
                    leftOperand: {
                      value: reusableElementIds[3],
                      type: "element",
                    },
                    operator: "isSubmitted",
                  },
                  {
                    id: createId(),
                    leftOperand: {
                      value: reusableElementIds[1],
                      type: "element",
                    },
                    operator: "isSkipped",
                  },
                ],
              },
              actions: [
                {
                  id: createId(),
                  objective: "jumpToBlock",
                  target: localSurvey.endings[0].id,
                },
              ],
            },
          ],
          buttonLabel: t("templates.study_task_completion_form_question_4_button_label"),
          t,
        }),
        buildBlock({
          id: block5Id,
          name: t("templates.block_5"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[4],
              headline: t("templates.study_task_completion_form_question_5_headline"),
              required: true,
              placeholder: t("templates.study_task_completion_form_question_5_placeholder"),
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.study_task_completion_form_question_5_button_label"),
          t,
        }),
      ],
    },
    t
  );
};

const specimenSubmissionBarrierForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);
  const reusableElementIds = [
    createId(),
    createId(),
    createId(),
    createId(),
    createId(),
    createId(),
    createId(),
    createId(),
    createId(),
  ];
  const reusableOptionIds = [createId(), createId(), createId(), createId(), createId()];
  const block4Id = createId(); // Pre-generate IDs for blocks referenced by logic
  const block5Id = createId();
  const block6Id = createId();
  const block7Id = createId();
  const block8Id = createId();
  const block9Id = createId();

  return buildSurvey(
    {
      name: t("templates.specimen_submission_barrier_form_name"),
      role: "labStaff",
      industries: ["registryCohort", "clinicalTrial", "other"],
      channels: ["website"],
      description: t("templates.specimen_submission_barrier_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildCTAElement({
              id: reusableElementIds[0],
              subheader: t("templates.specimen_submission_barrier_form_question_1_html"),
              headline: t("templates.specimen_submission_barrier_form_question_1_headline"),
              required: false,
            }),
          ],
          buttonLabel: t("templates.specimen_submission_barrier_form_question_1_button_label"),
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildRatingElement({
              id: reusableElementIds[1],
              range: 5,
              scale: "number",
              headline: t("templates.specimen_submission_barrier_form_question_2_headline"),
              required: true,
              lowerLabel: t("templates.specimen_submission_barrier_form_question_2_lower_label"),
              upperLabel: t("templates.specimen_submission_barrier_form_question_2_upper_label"),
              isColorCodingEnabled: false,
            }),
          ],
          logic: [
            {
              id: createId(),
              conditions: {
                id: createId(),
                connector: "and",
                conditions: [
                  {
                    id: createId(),
                    leftOperand: {
                      value: reusableElementIds[1],
                      type: "element",
                    },
                    operator: "equals",
                    rightOperand: {
                      type: "static",
                      value: 5,
                    },
                  },
                ],
              },
              actions: [
                {
                  id: createId(),
                  objective: "jumpToBlock",
                  target: localSurvey.endings[0].id,
                },
              ],
            },
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_3"),
          elements: [
            buildMultipleChoiceElement({
              id: reusableElementIds[2],
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              shuffleOption: "none",
              choices: [
                t("templates.specimen_submission_barrier_form_question_3_choice_1_label"),
                t("templates.specimen_submission_barrier_form_question_3_choice_2_label"),
                t("templates.specimen_submission_barrier_form_question_3_choice_3_label"),
                t("templates.specimen_submission_barrier_form_question_3_choice_4_label"),
                t("templates.specimen_submission_barrier_form_question_3_choice_5_label"),
              ],
              choiceIds: [
                reusableOptionIds[0],
                reusableOptionIds[1],
                reusableOptionIds[2],
                reusableOptionIds[3],
                reusableOptionIds[4],
              ],
              headline: t("templates.specimen_submission_barrier_form_question_3_headline"),
              required: true,
            }),
          ],
          logic: [
            createBlockChoiceJumpLogic(reusableElementIds[2], reusableOptionIds[0], block4Id),
            createBlockChoiceJumpLogic(reusableElementIds[2], reusableOptionIds[1], block5Id),
            createBlockChoiceJumpLogic(reusableElementIds[2], reusableOptionIds[2], block6Id),
            createBlockChoiceJumpLogic(reusableElementIds[2], reusableOptionIds[3], block7Id),
            createBlockChoiceJumpLogic(reusableElementIds[2], reusableOptionIds[4], block8Id),
          ],
          t,
        }),
        buildBlock({
          id: block4Id,
          name: t("templates.block_4"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[3],
              headline: t("templates.specimen_submission_barrier_form_question_4_headline"),
              required: true,
              placeholder: t("templates.specimen_submission_barrier_form_question_4_placeholder"),
              inputType: "text",
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[3], block9Id, "isSubmitted")],
          t,
        }),
        buildBlock({
          id: block5Id,
          name: t("templates.block_5"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[4],
              headline: t("templates.specimen_submission_barrier_form_question_5_headline"),
              required: true,
              placeholder: t("templates.specimen_submission_barrier_form_question_5_placeholder"),
              inputType: "text",
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[4], block9Id, "isSubmitted")],
          t,
        }),
        buildBlock({
          id: block6Id,
          name: t("templates.block_6"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[5],
              headline: t("templates.specimen_submission_barrier_form_question_6_headline"),
              required: true,
              placeholder: t("templates.specimen_submission_barrier_form_question_6_placeholder"),
              inputType: "text",
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[5], block9Id, "isSubmitted")],
          t,
        }),
        buildBlock({
          id: block7Id,
          name: t("templates.block_7"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[6],
              headline: t("templates.specimen_submission_barrier_form_question_7_headline"),
              required: true,
              placeholder: t("templates.specimen_submission_barrier_form_question_7_placeholder"),
              inputType: "text",
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[6], block9Id, "isSubmitted")],
          t,
        }),
        buildBlock({
          id: block8Id,
          name: t("templates.block_8"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[7],
              headline: t("templates.specimen_submission_barrier_form_question_8_headline"),
              required: true,
              placeholder: t("templates.specimen_submission_barrier_form_question_8_placeholder"),
              inputType: "text",
            }),
          ],
          t,
        }),
        buildBlock({
          id: block9Id,
          name: t("templates.block_9"),
          elements: [
            buildCTAElement({
              id: reusableElementIds[8],
              subheader: t("templates.specimen_submission_barrier_form_question_9_html"),
              headline: t("templates.specimen_submission_barrier_form_question_9_headline"),
              required: false,
              buttonUrl: "https://continium.com",
              buttonExternal: true,
              ctaButtonLabel: t("templates.specimen_submission_barrier_form_question_9_button_label"),
            }),
          ],
          t,
        }),
      ],
    },
    t
  );
};

const studyWorkflowImprovementForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);
  return buildSurvey(
    {
      name: t("templates.study_workflow_improvement_form_name"),
      role: "studyCoordinator",
      industries: ["registryCohort"],
      channels: ["app", "link"],
      description: t("templates.study_workflow_improvement_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildRatingElement({
              range: 5,
              scale: "number",
              headline: t("templates.study_workflow_improvement_form_question_1_headline"),
              required: true,
              lowerLabel: t("templates.study_workflow_improvement_form_question_1_lower_label"),
              upperLabel: t("templates.study_workflow_improvement_form_question_1_upper_label"),
              isColorCodingEnabled: false,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.study_workflow_improvement_form_question_2_headline"),
              required: true,
              placeholder: t("templates.study_workflow_improvement_form_question_2_placeholder"),
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const dataCollectionReadinessForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);
  const reusableElementIds = [createId(), createId(), createId()];
  const block2Id = createId();
  const block3Id = createId();
  return buildSurvey(
    {
      name: t("templates.data_collection_readiness_form_name"),
      role: "dataManager",
      industries: ["clinicalTrial"],
      channels: ["website", "link", "app"],
      description: t("templates.data_collection_readiness_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildRatingElement({
              id: reusableElementIds[0],
              range: 5,
              scale: "number",
              headline: t("templates.data_collection_readiness_form_question_1_headline"),
              required: true,
              lowerLabel: t("templates.data_collection_readiness_form_question_1_lower_label"),
              upperLabel: t("templates.data_collection_readiness_form_question_1_upper_label"),
              isColorCodingEnabled: false,
            }),
          ],
          logic: [
            createBlockChoiceJumpLogic(reusableElementIds[0], 2, block2Id),
            createBlockChoiceJumpLogic(reusableElementIds[0], 3, block3Id),
            createBlockChoiceJumpLogic(reusableElementIds[0], 4, block3Id),
            createBlockChoiceJumpLogic(reusableElementIds[0], 5, localSurvey.endings[0].id),
          ],
          t,
        }),
        buildBlock({
          id: block2Id,
          name: t("templates.block_2"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[1],
              headline: t("templates.data_collection_readiness_form_question_2_headline"),
              required: false,
              placeholder: t("templates.data_collection_readiness_form_question_2_placeholder"),
              inputType: "text",
            }),
          ],
          logic: [
            createBlockJumpLogic(reusableElementIds[1], localSurvey.endings[0].id, "isSubmitted"),
            createBlockJumpLogic(reusableElementIds[1], localSurvey.endings[0].id, "isSkipped"),
          ],
          t,
        }),
        buildBlock({
          id: block3Id,
          name: t("templates.block_3"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[2],
              headline: t("templates.data_collection_readiness_form_question_3_headline"),
              required: true,
              placeholder: t("templates.data_collection_readiness_form_question_3_placeholder"),
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const labUpdateFeedbackForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);
  const reusableElementIds = [createId(), createId(), createId()];
  const block2Id = createId();
  const block3Id = createId();
  return buildSurvey(
    {
      name: t("templates.lab_update_feedback_form_name"),
      role: "labStaff",
      industries: ["clinicalTrial", "registryCohort", "other"],
      channels: ["link"],
      description: t("templates.lab_update_feedback_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildRatingElement({
              id: reusableElementIds[0],
              range: 5,
              scale: "smiley",
              headline: t("templates.lab_update_feedback_form_question_1_headline"),
              required: true,
              lowerLabel: t("templates.lab_update_feedback_form_question_1_lower_label"),
              upperLabel: t("templates.lab_update_feedback_form_question_1_upper_label"),
              isColorCodingEnabled: false,
            }),
          ],
          logic: [
            createBlockChoiceJumpLogic(reusableElementIds[0], 5, block3Id),
            {
              id: createId(),
              conditions: {
                id: createId(),
                connector: "and",
                conditions: [
                  {
                    id: createId(),
                    leftOperand: {
                      value: reusableElementIds[0],
                      type: "element",
                    },
                    operator: "isLessThan",
                    rightOperand: {
                      type: "static",
                      value: 5,
                    },
                  },
                ],
              },
              actions: [
                {
                  id: createId(),
                  objective: "jumpToBlock",
                  target: block2Id,
                },
              ],
            },
          ],
          t,
        }),
        buildBlock({
          id: block2Id,
          name: t("templates.block_2"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[1],
              headline: t("templates.lab_update_feedback_form_question_2_headline"),
              required: false,
              placeholder: t("templates.lab_update_feedback_form_question_2_placeholder"),
              inputType: "text",
            }),
          ],
          logic: [
            createBlockJumpLogic(reusableElementIds[1], localSurvey.endings[0].id, "isSubmitted"),
            createBlockJumpLogic(reusableElementIds[1], localSurvey.endings[0].id, "isSkipped"),
          ],
          t,
        }),
        buildBlock({
          id: block3Id,
          name: t("templates.block_3"),
          elements: [
            buildCTAElement({
              id: reusableElementIds[2],
              subheader: t("templates.lab_update_feedback_form_question_3_html"),
              headline: t("templates.lab_update_feedback_form_question_3_headline"),
              required: false,
              buttonUrl: "https://continium.com",
              buttonExternal: true,
              ctaButtonLabel: t("templates.lab_update_feedback_form_question_3_button_label"),
            }),
          ],
          t,
        }),
      ],
    },
    t
  );
};

const studyWorkflowConceptFeedbackForm = (t: TFunction): TTemplate => {
  const reusableElementIds = [
    createId(),
    createId(),
    createId(),
    createId(),
    createId(),
    createId(),
    createId(),
    createId(),
  ];
  const block3Id = createId();
  const block4Id = createId();
  const block6Id = createId();
  const block7Id = createId();
  const block8Id = createId();
  const localSurvey = getDefaultSurveyPreset(t);
  return buildSurvey(
    {
      name: t("templates.study_workflow_concept_feedback_form_name"),
      role: "studyCoordinator",
      industries: ["registryCohort", "other"],
      channels: ["link", "app"],
      description: t("templates.study_workflow_concept_feedback_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildCTAElement({
              id: reusableElementIds[0],
              subheader: t("templates.study_workflow_concept_feedback_form_question_1_html"),
              headline: t("templates.study_workflow_concept_feedback_form_question_1_headline"),
              required: false,
            }),
          ],
          buttonLabel: t("templates.study_workflow_concept_feedback_form_question_1_button_label"),
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildRatingElement({
              id: reusableElementIds[1],
              range: 5,
              scale: "number",
              headline: t("templates.study_workflow_concept_feedback_form_question_2_headline"),
              required: true,
              lowerLabel: t("templates.study_workflow_concept_feedback_form_question_2_lower_label"),
              upperLabel: t("templates.study_workflow_concept_feedback_form_question_2_upper_label"),
              isColorCodingEnabled: false,
            }),
          ],
          logic: [
            createBlockChoiceJumpLogic(reusableElementIds[1], 3, block3Id),
            createBlockChoiceJumpLogic(reusableElementIds[1], 4, block4Id),
          ],
          t,
        }),
        buildBlock({
          id: block3Id,
          name: t("templates.block_3"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[2],
              headline: t("templates.study_workflow_concept_feedback_form_question_3_headline"),
              required: true,
              placeholder: t("templates.study_workflow_concept_feedback_form_question_3_placeholder"),
              inputType: "text",
            }),
          ],
          t,
        }),
        buildBlock({
          id: block4Id,
          name: t("templates.block_4"),
          elements: [
            buildCTAElement({
              id: reusableElementIds[3],
              subheader: t("templates.study_workflow_concept_feedback_form_question_4_html"),
              headline: t("templates.study_workflow_concept_feedback_form_question_4_headline"),
              required: false,
            }),
          ],
          buttonLabel: t("templates.study_workflow_concept_feedback_form_question_4_button_label"),
          t,
        }),
        buildBlock({
          name: t("templates.block_5"),
          elements: [
            buildRatingElement({
              id: reusableElementIds[4],
              range: 5,
              scale: "number",
              headline: t("templates.study_workflow_concept_feedback_form_question_5_headline"),
              required: true,
              lowerLabel: t("templates.study_workflow_concept_feedback_form_question_5_lower_label"),
              upperLabel: t("templates.study_workflow_concept_feedback_form_question_5_upper_label"),
              isColorCodingEnabled: false,
            }),
          ],
          logic: [
            createBlockChoiceJumpLogic(reusableElementIds[4], 3, block6Id),
            createBlockChoiceJumpLogic(reusableElementIds[4], 4, block7Id),
          ],
          t,
        }),
        buildBlock({
          id: block6Id,
          name: t("templates.block_6"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[5],
              headline: t("templates.study_workflow_concept_feedback_form_question_6_headline"),
              required: true,
              placeholder: t("templates.study_workflow_concept_feedback_form_question_6_placeholder"),
              inputType: "text",
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[5], block8Id, "isSubmitted")],
          t,
        }),
        buildBlock({
          id: block7Id,
          name: t("templates.block_7"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[6],
              headline: t("templates.study_workflow_concept_feedback_form_question_7_headline"),
              required: true,
              placeholder: t("templates.study_workflow_concept_feedback_form_question_7_placeholder"),
              inputType: "text",
            }),
          ],
          t,
        }),
        buildBlock({
          id: block8Id,
          name: t("templates.block_8"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[7],
              headline: t("templates.study_workflow_concept_feedback_form_question_8_headline"),
              required: false,
              placeholder: t("templates.study_workflow_concept_feedback_form_question_8_placeholder"),
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const participantFollowUpEngagementBarrierForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);
  const reusableElementIds = [createId(), createId(), createId(), createId(), createId(), createId()];
  const reusableOptionIds = [createId(), createId(), createId(), createId()];
  const block2Id = createId();
  const block3Id = createId();
  const block4Id = createId();
  const block5Id = createId();
  const block6Id = createId();
  return buildSurvey(
    {
      name: t("templates.participant_follow_up_engagement_barrier_form_name"),
      role: "studyCoordinator",
      industries: ["registryCohort"],
      channels: ["link"],
      description: t("templates.participant_follow_up_engagement_barrier_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildMultipleChoiceElement({
              id: reusableElementIds[0],
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              shuffleOption: "none",
              choices: [
                t("templates.participant_follow_up_engagement_barrier_form_question_1_choice_1"),
                t("templates.participant_follow_up_engagement_barrier_form_question_1_choice_2"),
                t("templates.participant_follow_up_engagement_barrier_form_question_1_choice_3"),
                t("templates.participant_follow_up_engagement_barrier_form_question_1_choice_4"),
                t("templates.participant_follow_up_engagement_barrier_form_question_1_choice_5"),
              ],
              choiceIds: [
                reusableOptionIds[0],
                reusableOptionIds[1],
                reusableOptionIds[2],
                reusableOptionIds[3],
              ],
              headline: t("templates.participant_follow_up_engagement_barrier_form_question_1_headline"),
              required: true,
              containsOther: true,
            }),
          ],
          logic: [
            createBlockChoiceJumpLogic(reusableElementIds[0], reusableOptionIds[0], block2Id),
            createBlockChoiceJumpLogic(reusableElementIds[0], reusableOptionIds[1], block3Id),
            createBlockChoiceJumpLogic(reusableElementIds[0], reusableOptionIds[2], block4Id),
            createBlockChoiceJumpLogic(reusableElementIds[0], reusableOptionIds[3], block5Id),
            createBlockChoiceJumpLogic(reusableElementIds[0], "other", block6Id),
          ],
          t,
        }),
        buildBlock({
          id: block2Id,
          name: t("templates.block_2"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[1],
              headline: t("templates.participant_follow_up_engagement_barrier_form_question_2_headline"),
              required: true,
              placeholder: t("templates.participant_follow_up_engagement_barrier_form_question_2_placeholder"),
              inputType: "text",
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[1], localSurvey.endings[0].id, "isSubmitted")],
          t,
        }),
        buildBlock({
          id: block3Id,
          name: t("templates.block_3"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[2],
              headline: t("templates.participant_follow_up_engagement_barrier_form_question_3_headline"),
              required: true,
              placeholder: t("templates.participant_follow_up_engagement_barrier_form_question_3_placeholder"),
              inputType: "text",
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[2], localSurvey.endings[0].id, "isSubmitted")],
          t,
        }),
        buildBlock({
          id: block4Id,
          name: t("templates.block_4"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[3],
              headline: t("templates.participant_follow_up_engagement_barrier_form_question_4_headline"),
              required: true,
              placeholder: t("templates.participant_follow_up_engagement_barrier_form_question_4_placeholder"),
              inputType: "text",
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[3], localSurvey.endings[0].id, "isSubmitted")],
          t,
        }),
        buildBlock({
          id: block5Id,
          name: t("templates.block_5"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[4],
              headline: t("templates.participant_follow_up_engagement_barrier_form_question_5_headline"),
              required: true,
              placeholder: t("templates.participant_follow_up_engagement_barrier_form_question_5_placeholder"),
              inputType: "text",
            }),
          ],
          logic: [createBlockJumpLogic(reusableElementIds[4], localSurvey.endings[0].id, "isSubmitted")],
          t,
        }),
        buildBlock({
          id: block6Id,
          name: t("templates.block_6"),
          elements: [
            buildOpenTextElement({
              id: reusableElementIds[5],
              headline: t("templates.participant_follow_up_engagement_barrier_form_question_6_headline"),
              required: false,
              placeholder: t("templates.participant_follow_up_engagement_barrier_form_question_6_placeholder"),
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const siteWorkloadWellbeingForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);
  return buildSurvey(
    {
      name: t("templates.site_workload_wellbeing_form_name"),
      role: "monitorAuditor",
      industries: ["registryCohort", "clinicalTrial", "other"],
      channels: ["link"],
      description: t("templates.site_workload_wellbeing_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildRatingElement({
              headline: t("templates.site_workload_wellbeing_form_question_1_headline"),
              required: true,
              scale: "number",
              range: 10,
              lowerLabel: t("templates.site_workload_wellbeing_form_question_1_lower_label"),
              upperLabel: t("templates.site_workload_wellbeing_form_question_1_upper_label"),
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildRatingElement({
              headline: t("templates.site_workload_wellbeing_form_question_2_headline"),
              required: true,
              scale: "number",
              range: 10,
              lowerLabel: t("templates.site_workload_wellbeing_form_question_2_lower_label"),
              upperLabel: t("templates.site_workload_wellbeing_form_question_2_upper_label"),
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_3"),
          elements: [
            buildRatingElement({
              headline: t("templates.site_workload_wellbeing_form_question_3_headline"),
              required: true,
              scale: "number",
              range: 10,
              lowerLabel: t("templates.site_workload_wellbeing_form_question_3_lower_label"),
              upperLabel: t("templates.site_workload_wellbeing_form_question_3_upper_label"),
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_4"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.site_workload_wellbeing_form_question_4_headline"),
              required: false,
              placeholder: t("templates.site_workload_wellbeing_form_question_4_placeholder"),
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const longTermParticipantRetentionCheckIn = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);
  return buildSurvey(
    {
      name: t("templates.long_term_participant_retention_check_in_name"),
      role: "monitorAuditor",
      industries: ["registryCohort", "other"],
      channels: ["app", "link"],
      description: t("templates.long_term_participant_retention_check_in_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildRatingElement({
              range: 5,
              scale: "star",
              headline: t("templates.long_term_participant_retention_check_in_question_1_headline"),
              required: true,
              lowerLabel: t("templates.long_term_participant_retention_check_in_question_1_lower_label"),
              upperLabel: t("templates.long_term_participant_retention_check_in_question_1_upper_label"),
              isColorCodingEnabled: true,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.long_term_participant_retention_check_in_question_2_headline"),
              required: false,
              placeholder: t("templates.long_term_participant_retention_check_in_question_2_placeholder"),
              inputType: "text",
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_3"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              shuffleOption: "none",
              choices: [
                t("templates.long_term_participant_retention_check_in_question_3_choice_1"),
                t("templates.long_term_participant_retention_check_in_question_3_choice_2"),
                t("templates.long_term_participant_retention_check_in_question_3_choice_3"),
                t("templates.long_term_participant_retention_check_in_question_3_choice_4"),
                t("templates.long_term_participant_retention_check_in_question_3_choice_5"),
              ],
              headline: t("templates.long_term_participant_retention_check_in_question_3_headline"),
              required: true,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_4"),
          elements: [
            buildRatingElement({
              range: 5,
              scale: "number",
              headline: t("templates.long_term_participant_retention_check_in_question_4_headline"),
              required: true,
              lowerLabel: t("templates.long_term_participant_retention_check_in_question_4_lower_label"),
              upperLabel: t("templates.long_term_participant_retention_check_in_question_4_upper_label"),
              isColorCodingEnabled: true,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_5"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.long_term_participant_retention_check_in_question_5_headline"),
              required: false,
              placeholder: t("templates.long_term_participant_retention_check_in_question_5_placeholder"),
              inputType: "text",
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_6"),
          elements: [
            buildNPSElement({
              headline: t("templates.long_term_participant_retention_check_in_question_6_headline"),
              required: false,
              lowerLabel: t("templates.long_term_participant_retention_check_in_question_6_lower_label"),
              upperLabel: t("templates.long_term_participant_retention_check_in_question_6_upper_label"),
              isColorCodingEnabled: false,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_7"),
          elements: [
            buildMultipleChoiceElement({
              type: TSurveyElementTypeEnum.MultipleChoiceMulti,
              shuffleOption: "none",
              choices: [
                t("templates.long_term_participant_retention_check_in_question_7_choice_1"),
                t("templates.long_term_participant_retention_check_in_question_7_choice_2"),
                t("templates.long_term_participant_retention_check_in_question_7_choice_3"),
                t("templates.long_term_participant_retention_check_in_question_7_choice_4"),
                t("templates.long_term_participant_retention_check_in_question_7_choice_5"),
              ],
              headline: t("templates.long_term_participant_retention_check_in_question_7_headline"),
              required: true,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_8"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.long_term_participant_retention_check_in_question_8_headline"),
              required: false,
              placeholder: t("templates.long_term_participant_retention_check_in_question_8_placeholder"),
              inputType: "text",
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_9"),
          elements: [
            buildRatingElement({
              range: 5,
              scale: "smiley",
              headline: t("templates.long_term_participant_retention_check_in_question_9_headline"),
              required: true,
              lowerLabel: t("templates.long_term_participant_retention_check_in_question_9_lower_label"),
              upperLabel: t("templates.long_term_participant_retention_check_in_question_9_upper_label"),
              isColorCodingEnabled: true,
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_10"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.long_term_participant_retention_check_in_question_10_headline"),
              required: false,
              placeholder: t("templates.long_term_participant_retention_check_in_question_10_placeholder"),
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const monitorCompetencyGrowthForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);
  return buildSurvey(
    {
      name: t("templates.monitor_competency_growth_form_name"),
      role: "monitorAuditor",
      industries: ["registryCohort", "clinicalTrial", "other"],
      channels: ["link"],
      description: t("templates.monitor_competency_growth_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildRatingElement({
              headline: t("templates.monitor_competency_growth_form_question_1_headline"),
              required: true,
              scale: "number",
              range: 10,
              lowerLabel: t("templates.monitor_competency_growth_form_question_1_lower_label"),
              upperLabel: t("templates.monitor_competency_growth_form_question_1_upper_label"),
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildRatingElement({
              headline: t("templates.monitor_competency_growth_form_question_2_headline"),
              required: true,
              scale: "number",
              range: 10,
              lowerLabel: t("templates.monitor_competency_growth_form_question_2_lower_label"),
              upperLabel: t("templates.monitor_competency_growth_form_question_2_upper_label"),
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_3"),
          elements: [
            buildRatingElement({
              headline: t("templates.monitor_competency_growth_form_question_3_headline"),
              required: true,
              scale: "number",
              range: 10,
              lowerLabel: t("templates.monitor_competency_growth_form_question_3_lower_label"),
              upperLabel: t("templates.monitor_competency_growth_form_question_3_upper_label"),
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_4"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.monitor_competency_growth_form_question_4_headline"),
              required: false,
              placeholder: t("templates.monitor_competency_growth_form_question_4_placeholder"),
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const siteTeamRecognitionAndSupportForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);
  return buildSurvey(
    {
      name: t("templates.site_team_recognition_and_support_form_name"),
      role: "monitorAuditor",
      industries: ["registryCohort", "clinicalTrial", "other"],
      channels: ["link"],
      description: t("templates.site_team_recognition_and_support_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildRatingElement({
              headline: t("templates.site_team_recognition_and_support_form_question_1_headline"),
              required: true,
              scale: "number",
              range: 10,
              lowerLabel: t("templates.site_team_recognition_and_support_form_question_1_lower_label"),
              upperLabel: t("templates.site_team_recognition_and_support_form_question_1_upper_label"),
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildRatingElement({
              headline: t("templates.site_team_recognition_and_support_form_question_2_headline"),
              required: true,
              scale: "number",
              range: 10,
              lowerLabel: t("templates.site_team_recognition_and_support_form_question_2_lower_label"),
              upperLabel: t("templates.site_team_recognition_and_support_form_question_2_upper_label"),
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_3"),
          elements: [
            buildRatingElement({
              headline: t("templates.site_team_recognition_and_support_form_question_3_headline"),
              required: true,
              scale: "number",
              range: 10,
              lowerLabel: t("templates.site_team_recognition_and_support_form_question_3_lower_label"),
              upperLabel: t("templates.site_team_recognition_and_support_form_question_3_upper_label"),
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_4"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.site_team_recognition_and_support_form_question_4_headline"),
              required: false,
              placeholder: t("templates.site_team_recognition_and_support_form_question_4_placeholder"),
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const protocolAlignmentAndEngagementForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);
  return buildSurvey(
    {
      name: t("templates.protocol_alignment_and_engagement_form_name"),
      role: "monitorAuditor",
      industries: ["registryCohort", "clinicalTrial", "other"],
      channels: ["link"],
      description: t("templates.protocol_alignment_and_engagement_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildRatingElement({
              headline: t("templates.protocol_alignment_and_engagement_form_question_1_headline"),
              required: true,
              scale: "number",
              range: 10,
              lowerLabel: t("templates.protocol_alignment_and_engagement_form_question_1_lower_label"),
              upperLabel: t("templates.protocol_alignment_and_engagement_form_question_1_upper_label"),
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildRatingElement({
              headline: t("templates.protocol_alignment_and_engagement_form_question_2_headline"),
              required: true,
              scale: "number",
              range: 10,
              lowerLabel: t("templates.protocol_alignment_and_engagement_form_question_2_lower_label"),
              upperLabel: t("templates.protocol_alignment_and_engagement_form_question_2_upper_label"),
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_3"),
          elements: [
            buildRatingElement({
              headline: t("templates.protocol_alignment_and_engagement_form_question_3_headline"),
              required: true,
              scale: "number",
              range: 10,
              lowerLabel: t("templates.protocol_alignment_and_engagement_form_question_3_lower_label"),
              upperLabel: t("templates.protocol_alignment_and_engagement_form_question_3_upper_label"),
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_4"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.protocol_alignment_and_engagement_form_question_4_headline"),
              required: false,
              placeholder: t("templates.protocol_alignment_and_engagement_form_question_4_placeholder"),
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

const siteSupportCultureForm = (t: TFunction): TTemplate => {
  const localSurvey = getDefaultSurveyPreset(t);
  return buildSurvey(
    {
      name: t("templates.site_support_culture_form_name"),
      role: "monitorAuditor",
      industries: ["registryCohort", "clinicalTrial", "other"],
      channels: ["link"],
      description: t("templates.site_support_culture_form_description"),
      endings: localSurvey.endings,
      hiddenFields: hiddenFieldsDefault,
      blocks: [
        buildBlock({
          name: t("templates.block_1"),
          elements: [
            buildRatingElement({
              headline: t("templates.site_support_culture_form_question_1_headline"),
              required: true,
              scale: "number",
              range: 10,
              lowerLabel: t("templates.site_support_culture_form_question_1_lower_label"),
              upperLabel: t("templates.site_support_culture_form_question_1_upper_label"),
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_2"),
          elements: [
            buildRatingElement({
              headline: t("templates.site_support_culture_form_question_2_headline"),
              required: true,
              scale: "number",
              range: 10,
              lowerLabel: t("templates.site_support_culture_form_question_2_lower_label"),
              upperLabel: t("templates.site_support_culture_form_question_2_upper_label"),
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_3"),
          elements: [
            buildRatingElement({
              headline: t("templates.site_support_culture_form_question_3_headline"),
              required: true,
              scale: "number",
              range: 10,
              lowerLabel: t("templates.site_support_culture_form_question_3_lower_label"),
              upperLabel: t("templates.site_support_culture_form_question_3_upper_label"),
            }),
          ],
          t,
        }),
        buildBlock({
          name: t("templates.block_4"),
          elements: [
            buildOpenTextElement({
              headline: t("templates.site_support_culture_form_question_4_headline"),
              required: false,
              placeholder: t("templates.site_support_culture_form_question_4_placeholder"),
              inputType: "text",
            }),
          ],
          buttonLabel: t("templates.finish"),
          t,
        }),
      ],
    },
    t
  );
};

export const templates = (t: TFunction): TTemplate[] => [
  screeningEligibilityForm(t),
  enrollmentForm(t),
  patientReportedOutcomeForm(t),
  registryParticipantIntakeForm(t),
  dataQueryTriageForm(t),
  adverseEventScreeningForm(t),
  healthFunctioningAssessmentForm(t),
  followUpRetentionBarrierForm(t),
  specimenQualityReviewForm(t),
  followUpVisitSchedulingPrompt(t),
  participantIntakeBarrierForm(t),
  studyExperienceFeedbackForm(t),
  specimenSourceTrackingForm(t),
  visitReschedulingFeedbackForm(t),
  participantGoalAssessmentForm(t),
  participantFollowUpPreferenceForm(t),
  remoteFollowUpInterestForm(t),
  studySupportRequestForm(t),
  followUpSetupExperienceForm(t),
  preferredFollowUpChannelForm(t),
  studyInstructionFeedbackForm(t),
  studyExperienceScoreForm(t),
  participantStudySatisfactionForm(t),
  comprehensiveStudyFeedbackForm(t),
  coordinatorWorkloadAssessmentForm(t),
  studyWorkflowPrioritizationForm(t),
  visitProcessEaseForm(t),
  labInstructionClarityForm(t),
  followUpEffortScoreForm(t),
  consentCompletionExperienceForm(t),
  recordSearchExperienceForm(t),
  labGuidanceQualityForm(t),
  studyTaskCompletionForm(t),
  specimenSubmissionBarrierForm(t),
  studyWorkflowImprovementForm(t),
  dataCollectionReadinessForm(t),
  labUpdateFeedbackForm(t),
  studyWorkflowConceptFeedbackForm(t),
  participantFollowUpEngagementBarrierForm(t),
  employeeSatisfaction(t),
  siteWorkloadWellbeingForm(t),
  longTermParticipantRetentionCheckIn(t),
  siteSupportCultureForm(t),
  protocolAlignmentAndEngagementForm(t),
  siteTeamRecognitionAndSupportForm(t),
  monitorCompetencyGrowthForm(t),
  siteMonitoringReadinessForm(t),
  monitorTrainingNeedsForm(t),
];

export const customSurveyTemplate = (t: TFunction): TTemplate => {
  return {
    name: t("templates.custom_survey_name"),
    description: t("templates.custom_survey_description"),
    preset: {
      ...getDefaultSurveyPreset(t),
      name: t("templates.custom_survey_name"),
      blocks: [
        {
          id: createId(),
          name: t("templates.block_1"),
          elements: [
            {
              id: createId(),
              type: TSurveyElementTypeEnum.OpenText,
              headline: createI18nString(t("templates.custom_survey_question_1_headline"), []),
              placeholder: createI18nString(t("templates.custom_survey_question_1_placeholder"), []),
              required: true,
              inputType: "text",
              charLimit: {
                enabled: false,
              },
            } as TSurveyOpenTextElement,
          ],
          // Button labels at block level with default key for i18n support
          buttonLabel: createI18nString(t("templates.next"), []),
        },
      ],
    },
  };
};

export const previewSurvey = (projectName: string, t: TFunction): TSurvey => {
  return {
    id: "cltxxaa6x0000g8hacxdxejeu",
    createdAt: new Date(),
    updatedAt: new Date(),
    name: t("templates.preview_survey_name"),
    type: "link" as const,
    environmentId: "cltwumfcz0009echxg02fh7oa",
    createdBy: "cltwumfbz0000echxysz6ptvq",
    status: "inProgress" as const,
    welcomeCard: {
      enabled: false,
      headline: createI18nString(t("templates.preview_survey_welcome_card_headline"), []),
      timeToFinish: false,
      showResponseCount: false,
    },
    styling: null,
    segment: null,
    blocks: [
      {
        id: "cltxxaa6x0000g8hacxdxeje1",
        name: t("templates.block_1"),
        elements: [
          {
            ...buildMultipleChoiceElement({
              id: "rjpu42ps6dzirsn9ds6eydgt",
              type: TSurveyElementTypeEnum.MultipleChoiceSingle,
              choiceIds: ["x6wty2s72v7vd538aadpurqx", "fbcj4530t2n357ymjp2h28d6"],
              choices: [
                t("templates.preview_survey_question_2_choice_1_label"),
                t("templates.preview_survey_question_2_choice_2_label"),
              ],
              headline: t("templates.preview_survey_question_2_headline"),
              subheader: t("templates.preview_survey_question_2_subheader"),
              required: true,
              shuffleOption: "none",
            }),
            isDraft: true,
          },
          {
            ...buildOpenTextElement({
              id: "preview-open-text-01",
              headline: t("templates.preview_survey_question_open_text_headline"),
              subheader: t("templates.preview_survey_question_open_text_subheader"),
              placeholder: t("templates.preview_survey_question_open_text_placeholder"),
              inputType: "text",
              required: false,
            }),
            isDraft: true,
          },
        ],
        buttonLabel: createI18nString(t("templates.next"), []),
        backButtonLabel: createI18nString(t("templates.preview_survey_question_2_back_button_label"), []),
      },
      {
        id: "cltxxaa6x0000g8hacxdxeje2",
        name: t("templates.block_2"),
        elements: [
          {
            ...buildRatingElement({
              id: "lbdxozwikh838yc6a8vbwuju",
              range: 5,
              scale: "star",
              headline: t("templates.preview_survey_question_1_headline", { projectName }),
              required: true,
              subheader: t("templates.preview_survey_question_1_subheader"),
              lowerLabel: t("templates.preview_survey_question_1_lower_label"),
              upperLabel: t("templates.preview_survey_question_1_upper_label"),
            }),
            isDraft: true,
          },
        ],
        buttonLabel: createI18nString(t("templates.next"), []),
        backButtonLabel: createI18nString(t("templates.preview_survey_question_2_back_button_label"), []),
      },
    ],
    endings: [
      {
        id: "cltyqp5ng000108l9dmxw6nde",
        type: "endScreen",
        headline: createI18nString(t("templates.preview_survey_ending_card_headline"), []),
        subheader: createI18nString(t("templates.preview_survey_ending_card_description"), []),
      },
    ],
    hiddenFields: {
      enabled: true,
      fieldIds: [],
    },
    variables: [],
    displayOption: "displayOnce",
    recontactDays: null,
    displayLimit: null,
    autoClose: null,
    recaptcha: null,
    delay: 0,
    displayPercentage: null,
    autoComplete: 50,
    isVerifyEmailEnabled: false,
    isSingleResponsePerEmailEnabled: false,
    projectOverwrites: null,
    surveyClosedMessage: null,
    singleUse: {
      enabled: false,
      isEncrypted: true,
    },
    pin: null,
    languages: [],
    triggers: [],
    showLanguageSwitch: false,
    followUps: [],
    isBackButtonHidden: false,
    isAutoProgressingEnabled: true,
    isCaptureIpEnabled: false,
    metadata: {},
    questions: [], // Required for build-time type checking (Zod defaults to [] at runtime)
    slug: null,
  };
};
