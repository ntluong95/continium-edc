"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { getFormattedErrorMessage } from "@/lib/utils/helper";
import { TEnvironment } from "@continium/types/environment";
import { TSurveyQuota } from "@continium/types/quota";
import { TResponseWithQuotas } from "@continium/types/responses";
import { TSurvey } from "@continium/types/surveys/types";
import { TTag } from "@continium/types/tags";
import { TUser, TUserLocale } from "@continium/types/user";
import { getResponsesAction } from "@/app/(app)/environments/[environmentId]/forms/[surveyId]/(analysis)/actions";
import { useResponseFilter } from "@/app/(app)/environments/[environmentId]/forms/[surveyId]/(analysis)/components/response-filter-context";
import { ResponseDataView } from "@/app/(app)/environments/[environmentId]/forms/[surveyId]/(analysis)/responses/components/ResponseDataView";
import {
  ResponseSourceFilter,
  type ResponseSourceFilterValue,
  getSourceFilterCriteria,
} from "@/app/(app)/environments/[environmentId]/forms/[surveyId]/(analysis)/responses/components/response-source-filter";
import { CustomFilter } from "@/app/(app)/environments/[environmentId]/forms/[surveyId]/components/CustomFilter";
import { getFormattedFilters } from "@/app/lib/surveys/surveys";
import { replaceHeadlineRecall } from "@/lib/utils/recall";

interface ResponsePageProps {
  environment: TEnvironment;
  survey: TSurvey;
  surveyId: string;
  user?: TUser;
  environmentTags: TTag[];
  responsesPerPage: number;
  locale: TUserLocale;
  isReadOnly: boolean;
  isQuotasAllowed: boolean;
  quotas: TSurveyQuota[];
  initialResponses?: TResponseWithQuotas[];
}

export const ResponsePage = ({
  environment,
  survey,
  surveyId,
  user,
  environmentTags,
  responsesPerPage,
  locale,
  isReadOnly,
  isQuotasAllowed,
  quotas,
  initialResponses = [],
}: ResponsePageProps) => {
  const [responses, setResponses] = useState<TResponseWithQuotas[]>(initialResponses);
  const [page, setPage] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(initialResponses.length >= responsesPerPage);
  const [isFetchingFirstPage, setIsFetchingFirstPage] = useState<boolean>(false);
  const [sourceFilter, setSourceFilter] = useState<ResponseSourceFilterValue>("all");
  const { selectedFilter, dateRange, resetState, registerAnalysisRefreshHandler } = useResponseFilter();
  const { t } = useTranslation();

  const filters = useMemo(() => {
    const baseFilters = getFormattedFilters(survey, selectedFilter, dateRange);
    const sourceCriteria = getSourceFilterCriteria(sourceFilter);
    if (!sourceCriteria) return baseFilters;
    return {
      ...baseFilters,
      meta: { ...(baseFilters.meta ?? {}), ...sourceCriteria },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter, dateRange, sourceFilter]);

  const searchParams = useSearchParams();

  const fetchNextPage = useCallback(async () => {
    if (page === null) return;
    const newPage = page + 1;

    let newResponses: TResponseWithQuotas[] = [];

    const getResponsesActionResponse = await getResponsesAction({
      surveyId,
      limit: responsesPerPage,
      offset: (newPage - 1) * responsesPerPage,
      filterCriteria: filters,
    });
    newResponses = getResponsesActionResponse?.data || [];

    if (newResponses.length === 0 || newResponses.length < responsesPerPage) {
      setHasMore(false);
    }
    setResponses([...responses, ...newResponses]);
    setPage(newPage);
  }, [filters, page, responses, responsesPerPage, surveyId]);

  const refetchResponses = useCallback(async () => {
    setIsFetchingFirstPage(true);
    try {
      const getResponsesActionResponse = await getResponsesAction({
        surveyId,
        limit: responsesPerPage,
        offset: 0,
        filterCriteria: filters,
      });
      if (getResponsesActionResponse?.serverError) {
        toast.error(getFormattedErrorMessage(getResponsesActionResponse) ?? t("common.something_went_wrong"));
      }
      const freshResponses = getResponsesActionResponse?.data ?? [];
      setResponses(freshResponses);
      setPage(1);
      setHasMore(freshResponses.length >= responsesPerPage);
    } finally {
      setIsFetchingFirstPage(false);
    }
  }, [filters, responsesPerPage, surveyId, t]);

  useEffect(() => {
    return registerAnalysisRefreshHandler(refetchResponses);
  }, [refetchResponses, registerAnalysisRefreshHandler]);

  const updateResponseList = (responseIds: string[]) => {
    setResponses((prev) => prev.filter((r) => !responseIds.includes(r.id)));
  };

  const updateResponse = (responseId: string, updatedResponse: TResponseWithQuotas) => {
    setResponses((prev) => prev.map((r) => (r.id === responseId ? updatedResponse : r)));
  };

  const surveyMemoized = useMemo(() => {
    return replaceHeadlineRecall(survey, "default");
  }, [survey]);

  useEffect(() => {
    if (!searchParams?.get("referer")) {
      resetState();
    }
  }, [searchParams, resetState]);

  // Only fetch if filters are applied (not on initial mount with no filters)
  const hasFilters =
    selectedFilter?.responseStatus !== "all" ||
    (selectedFilter?.filter && selectedFilter.filter.length > 0) ||
    (dateRange.from && dateRange.to) ||
    sourceFilter !== "all";

  useEffect(() => {
    const fetchFilteredResponses = async () => {
      try {
        // skip call for initial mount
        if (page === null && !hasFilters) {
          setPage(1);
          return;
        }
        setPage(1);
        setIsFetchingFirstPage(true);
        let responses: TResponseWithQuotas[] = [];

        const getResponsesActionResponse = await getResponsesAction({
          surveyId,
          limit: responsesPerPage,
          offset: 0,
          filterCriteria: filters,
        });

        responses = getResponsesActionResponse?.data || [];

        if (responses.length < responsesPerPage) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
        setResponses(responses);
      } finally {
        setIsFetchingFirstPage(false);
      }
    };
    fetchFilteredResponses();
    // page is intentionally omitted to avoid refetching after the initial page setup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, responsesPerPage, selectedFilter, dateRange, surveyId]);

  return (
    <>
      <div className="flex h-9 flex-wrap items-center gap-1.5">
        <CustomFilter survey={surveyMemoized} />
        <ResponseSourceFilter value={sourceFilter} onChange={setSourceFilter} />
      </div>
      <ResponseDataView
        survey={survey}
        responses={responses}
        user={user}
        environment={environment}
        environmentTags={environmentTags}
        isReadOnly={isReadOnly}
        fetchNextPage={fetchNextPage}
        hasMore={hasMore}
        updateResponseList={updateResponseList}
        updateResponse={updateResponse}
        isFetchingFirstPage={isFetchingFirstPage}
        locale={locale}
        isQuotasAllowed={isQuotasAllowed}
        quotas={quotas}
      />
    </>
  );
};
