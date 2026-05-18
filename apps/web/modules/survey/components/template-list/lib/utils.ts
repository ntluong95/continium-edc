import { TFunction } from "i18next";
import { TProjectConfigChannel, TProjectConfigIndustry } from "@continium/types/project";
import { TTemplateRole } from "@continium/types/templates";

export const getChannelMapping = (t: TFunction): { value: TProjectConfigChannel; label: string }[] => [
  { value: "website", label: t("common.website_survey") },
  { value: "app", label: t("common.app_survey") },
  { value: "link", label: t("common.link_survey") },
];

export const getIndustryMapping = (t: TFunction): { value: TProjectConfigIndustry; label: string }[] => [
  { value: "clinicalTrial", label: t("common.clinicalTrial") },
  { value: "registryCohort", label: t("common.registryCohort") },
  { value: "other", label: t("common.other") },
];

export const getRoleMapping = (t: TFunction): { value: TTemplateRole; label: string }[] => [
  { value: "studyCoordinator", label: t("common.product_manager") },
  { value: "clinician", label: t("common.customer_success") },
  { value: "labStaff", label: t("common.labStaff") },
  { value: "dataManager", label: t("common.dataManager") },
  { value: "monitorAuditor", label: t("common.people_manager") },
];
