export const FORMS_TAB_IDS = {
  forms: "forms",
  formVersion: "form-version",
} as const;

export type TFormsTab = (typeof FORMS_TAB_IDS)[keyof typeof FORMS_TAB_IDS];

export const parseFormsTabParam = (value: unknown): TFormsTab => {
  const tab = Array.isArray(value) ? value[0] : value;

  if (tab === FORMS_TAB_IDS.formVersion || tab === "versions" || tab === "instrument-registry") {
    return FORMS_TAB_IDS.formVersion;
  }

  return FORMS_TAB_IDS.forms;
};

export const getFormsTabHref = (environmentId: string, tab: TFormsTab): string => {
  return `/environments/${environmentId}/forms?tab=${tab}`;
};
