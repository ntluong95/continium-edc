"use client";

import { TEnvironment } from "@continium/types/environment";
import { TResponseWithQuotas } from "@continium/types/responses";
import { TSurvey } from "@continium/types/surveys/types";
import { TTag } from "@continium/types/tags";
import { TUser, TUserLocale } from "@continium/types/user";
import { replaceHeadlineRecall } from "@/lib/utils/recall";
import { SingleResponseCard } from "@/modules/analysis/components/SingleResponseCard";

interface ResponseSurveyCardProps {
  response: TResponseWithQuotas;
  surveys: TSurvey[];
  user: TUser;
  environmentTags: TTag[];
  environment: TEnvironment;
  updateResponseList: (responseIds: string[]) => void;
  updateResponse: (responseId: string, response: TResponseWithQuotas) => void;
  locale: TUserLocale;
  isReadOnly: boolean;
}

export const ResponseSurveyCard = ({
  response,
  surveys,
  user,
  environmentTags,
  environment,
  updateResponseList,
  updateResponse,
  locale,
  isReadOnly,
}: ResponseSurveyCardProps) => {
  const survey = surveys.find((s) => s.id === response.surveyId);

  if (!survey) return null;

  return (
    <SingleResponseCard
      response={response}
      survey={replaceHeadlineRecall(survey, "default")}
      user={user}
      environmentTags={environmentTags}
      environment={environment}
      updateResponseList={updateResponseList}
      updateResponse={updateResponse}
      isReadOnly={isReadOnly}
      locale={locale}
    />
  );
};
