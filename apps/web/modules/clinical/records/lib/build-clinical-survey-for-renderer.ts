import type { TJsEnvironmentStateSurvey } from "@continium/types/js";
import type { TSurveyStyling } from "@continium/types/surveys/types";

/**
 * Normalizes a raw Prisma Survey JSON into the shape expected by SurveyInline /
 * the Formbricks UMD renderer.  The Prisma select does not include several
 * required fields (relations like `languages`, optional scalars like `triggers`,
 * `segment`, `displayOption`, etc.).  Passing an incomplete object to
 * SurveyInline crashes at `survey.languages.find(…)`.
 *
 * Call this before every SurveyInline mount — never pass the raw Prisma value.
 */
export const buildClinicalSurveyForRenderer = (
  raw: Record<string, unknown>
): TJsEnvironmentStateSurvey => {
  const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

  return {
    id: (raw.id as string) ?? "",
    name: (raw.name as string) ?? "Clinical instrument",
    type: (raw.type as TJsEnvironmentStateSurvey["type"]) ?? "link",
    status: (raw.status as TJsEnvironmentStateSurvey["status"]) ?? "inProgress",

    // Arrays — the crash source: always provide at least []
    languages: arr(raw.languages),
    questions: arr(raw.questions),
    blocks: arr(raw.blocks),
    endings: arr(raw.endings),
    triggers: arr(raw.triggers),

    // Objects with safe disabled defaults
    welcomeCard: (raw.welcomeCard as TJsEnvironmentStateSurvey["welcomeCard"]) ?? {
      enabled: false,
      timeToFinish: true,
      showResponseCount: false,
    },
    hiddenFields: (raw.hiddenFields as TJsEnvironmentStateSurvey["hiddenFields"]) ?? {
      enabled: false,
      fieldIds: [],
    },
    variables: arr(raw.variables),

    // Nullable / optional fields
    segment: null,
    styling: (raw.styling as TSurveyStyling) ?? null,
    projectOverwrites: null,
    autoClose: null,
    recontactDays: null,
    displayLimit: null,
    displayPercentage: null,
    showLanguageSwitch: null,
    recaptcha: null,

    // Scalar defaults
    displayOption:
      (raw.displayOption as TJsEnvironmentStateSurvey["displayOption"]) ?? "displayOnce",
    delay: typeof raw.delay === "number" ? raw.delay : 0,
    isBackButtonHidden: typeof raw.isBackButtonHidden === "boolean" ? raw.isBackButtonHidden : false,
    isAutoProgressingEnabled:
      typeof raw.isAutoProgressingEnabled === "boolean" ? raw.isAutoProgressingEnabled : false,
  } satisfies TJsEnvironmentStateSurvey;
};

/** Returns true when the raw Prisma survey contains renderable content. */
export const hasSurveyBlocks = (survey: Record<string, unknown> | null | undefined): boolean =>
  Array.isArray((survey as Record<string, unknown> | null)?.blocks) &&
  ((survey as Record<string, unknown>).blocks as unknown[]).length > 0;
