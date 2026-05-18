import type { TInstrumentDashboard } from "@/modules/clinical/instruments/lib/instrument-queries";

type DashboardSurveyGroup = TInstrumentDashboard["surveyGroups"][number];
type DashboardVersion = DashboardSurveyGroup["versions"][number];

export type TFormVersionRow = DashboardVersion & {
  formName: string;
  surveyId?: string;
  source: "survey" | "standalone";
};

export type TFormVersionStatusFilter = "all" | "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SURVEY_CHANGED";

export type TFormVersionSort =
  | "relevance"
  | "name"
  | "version"
  | "publishedAt"
  | "fieldCount"
  | "eventBindings";

export const flattenFormVersionRows = (dashboard: TInstrumentDashboard): TFormVersionRow[] => {
  const surveyRows = dashboard.surveyGroups.flatMap((group) =>
    group.versions.map((version) => ({
      ...version,
      formName: version.displayName ?? version.name ?? group.survey.name,
      surveyId: group.survey.id,
      source: "survey" as const,
    }))
  );

  const standaloneRows = dashboard.standaloneVersions.map((version) => ({
    ...version,
    formName: version.displayName ?? version.name,
    source: "standalone" as const,
  }));

  return [...surveyRows, ...standaloneRows];
};

export const getActiveFormVersionCount = (rows: TFormVersionRow[]): number => {
  return rows.filter((row) => row.status !== "ARCHIVED").length;
};

const compareText = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" });

const comparePublishedAtDesc = (a: TFormVersionRow, b: TFormVersionRow) => {
  const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
  const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
  return bTime - aTime;
};

const compareVersionDesc = (a: TFormVersionRow, b: TFormVersionRow) => b.version - a.version;

export const filterAndSortFormVersionRows = (
  rows: TFormVersionRow[],
  filters: {
    query: string;
    status: TFormVersionStatusFilter;
    sortBy: TFormVersionSort;
  }
): TFormVersionRow[] => {
  const normalizedQuery = filters.query.trim().toLowerCase();

  const filteredRows = rows.filter((row) => {
    const matchesQuery = normalizedQuery.length === 0 || row.formName.toLowerCase().includes(normalizedQuery);

    const matchesStatus =
      filters.status === "all" ||
      (filters.status === "SURVEY_CHANGED" ? row.sourceSurveyChanged : row.status === filters.status);

    return matchesQuery && matchesStatus;
  });

  if (filters.sortBy === "relevance") {
    return filteredRows;
  }

  return [...filteredRows].sort((a, b) => {
    switch (filters.sortBy) {
      case "name":
        return compareText(a.formName, b.formName) || compareVersionDesc(a, b);
      case "version":
        return compareVersionDesc(a, b) || compareText(a.formName, b.formName);
      case "publishedAt":
        return comparePublishedAtDesc(a, b) || compareText(a.formName, b.formName);
      case "fieldCount":
        return b.fieldCount - a.fieldCount || compareText(a.formName, b.formName);
      case "eventBindings":
        return b.boundEventCount - a.boundEventCount || compareText(a.formName, b.formName);
      default:
        return 0;
    }
  });
};
