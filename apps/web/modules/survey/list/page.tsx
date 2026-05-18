import { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResourceNotFoundError } from "@continium/types/errors";
import { DEFAULT_LOCALE, IS_CONTINIUM_CLOUD, SURVEYS_PER_PAGE } from "@/lib/constants";
import { getPublicDomain } from "@/lib/getPublicUrl";
import { getBillingFallbackPath } from "@/lib/membership/navigation";
import { getUserLocale } from "@/lib/user/service";
import { getTranslate } from "@/lingodotdev/server";
import { getInstrumentDashboard } from "@/modules/clinical/instruments/lib/instrument-queries";
import { getEnvironmentAuth } from "@/modules/environments/lib/utils";
import { getProjectWithTeamIdsByEnvironmentId } from "@/modules/survey/lib/project";
import { SurveysList } from "@/modules/survey/list/components/survey-list";
import { parseFormsTabParam } from "@/modules/survey/list/lib/forms-tabs";

export const metadata: Metadata = {
  title: "Forms",
};

interface SurveyTemplateProps {
  params: Promise<{
    environmentId: string;
  }>;
  searchParams?: Promise<{
    tab?: string | string[];
  }>;
}

export const SurveysPage = async ({
  params: paramsProps,
  searchParams: searchParamsProps,
}: SurveyTemplateProps) => {
  const publicDomain = getPublicDomain();
  const params = await paramsProps;
  const searchParams = await searchParamsProps;
  const t = await getTranslate();

  const project = await getProjectWithTeamIdsByEnvironmentId(params.environmentId);

  if (!project) {
    throw new ResourceNotFoundError(t("common.workspace"), null);
  }

  const { session, isBilling, environment, isReadOnly } = await getEnvironmentAuth(params.environmentId);

  if (isBilling) {
    return redirect(getBillingFallbackPath(params.environmentId, IS_CONTINIUM_CLOUD));
  }

  const currentProjectChannel = project.config.channel ?? null;
  const locale = (await getUserLocale(session.user.id)) ?? DEFAULT_LOCALE;
  const initialTab = parseFormsTabParam(searchParams?.tab);
  const instrumentDashboard =
    project.kind === "CLINICAL" ? await getInstrumentDashboard(params.environmentId) : null;
  const projectWithRequiredProps = {
    ...project,
    brandColor: project.styling?.brandColor?.light ?? null,
    highlightBorderColor: null,
  };

  return (
    <SurveysList
      environment={environment}
      project={projectWithRequiredProps}
      isReadOnly={isReadOnly}
      publicDomain={publicDomain}
      userId={session.user.id}
      surveysPerPage={SURVEYS_PER_PAGE}
      currentProjectChannel={currentProjectChannel}
      locale={locale}
      initialTab={initialTab}
      instrumentDashboard={instrumentDashboard}
    />
  );
};
