import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@continium/database";
import { logger } from "@continium/logger";
import { ZId } from "@continium/types/common";
import { DatabaseError, ResourceNotFoundError } from "@continium/types/errors";
import {
  TJsEnvironmentStateActionClass,
  TJsEnvironmentStateProject,
  TJsEnvironmentStateSurvey,
} from "@continium/types/js";
import { validateInputs } from "@/lib/utils/validate";
import { resolveStorageUrlsInObject } from "@/modules/storage/utils";
import { transformPrismaSurvey } from "@/modules/survey/lib/utils";

/**
 * Optimized data fetcher for environment state
 * Uses a single Prisma query with strategic includes to minimize database calls
 * Critical for performance on high-frequency endpoint serving hundreds of thousands of SDK clients
 */
export interface EnvironmentStateData {
  environment: {
    id: string;
    type: string;
    appSetupCompleted: boolean;
    project: TJsEnvironmentStateProject;
  };
  surveys: TJsEnvironmentStateSurvey[];
  actionClasses: TJsEnvironmentStateActionClass[];
}

/**
 * Single optimized query that fetches all required data
 * Replaces multiple separate service calls with one efficient database operation
 */
export const getEnvironmentStateData = async (environmentId: string): Promise<EnvironmentStateData> => {
  validateInputs([environmentId, ZId]);

  try {
    // Single query that fetches everything needed for environment state
    // Uses strategic includes and selects to minimize data transfer
    const environmentData = await prisma.environment.findUnique({
      where: { id: environmentId },
      select: {
        id: true,
        type: true,
        appSetupCompleted: true,
        // Project data (optimized select)
        project: {
          select: {
            id: true,
            recontactDays: true,
            clickOutsideClose: true,
            overlay: true,
            placement: true,
            inAppSurveyBranding: true,
            styling: true,
          },
        },
        // Action classes (optimized for environment state)
        actionClasses: {
          select: {
            id: true,
            type: true,
            name: true,
            key: true,
            noCodeConfig: true,
          },
        },
        // Surveys (optimized for app surveys only)
        surveys: {
          where: {
            type: "app",
            status: "inProgress",
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 30, // Limit for performance
          select: {
            id: true,
            name: true,
            welcomeCard: true,
            questions: true,
            blocks: true,
            variables: true,
            type: true,
            showLanguageSwitch: true,
            languages: {
              select: {
                default: true,
                enabled: true,
                language: {
                  select: {
                    id: true,
                    code: true,
                    alias: true,
                    createdAt: true,
                    updatedAt: true,
                    projectId: true,
                  },
                },
              },
            },
            endings: true,
            autoClose: true,
            styling: true,
            status: true,
            recaptcha: true,
            segment: {
              select: {
                id: true,
                filters: true,
              },
            },
            recontactDays: true,
            displayLimit: true,
            displayOption: true,
            hiddenFields: true,
            isBackButtonHidden: true,
            isAutoProgressingEnabled: true,
            triggers: {
              select: {
                actionClass: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            displayPercentage: true,
            delay: true,
            projectOverwrites: true,
          },
        },
      },
    });

    if (!environmentData) {
      throw new ResourceNotFoundError("environment", environmentId);
    }

    if (!environmentData.project) {
      throw new ResourceNotFoundError("project", null);
    }

    // Transform surveys using existing utility, then reshape segment to minimal public shape
    const transformedSurveys = environmentData.surveys.map((survey) => {
      const transformed = transformPrismaSurvey<TJsEnvironmentStateSurvey>(survey);
      return {
        ...transformed,
        segment: survey.segment
          ? { id: survey.segment.id, hasFilters: (survey.segment.filters as unknown[]).length > 0 }
          : null,
      } as TJsEnvironmentStateSurvey;
    });

    return {
      environment: {
        id: environmentData.id,
        type: environmentData.type,
        appSetupCompleted: environmentData.appSetupCompleted,
        project: {
          id: environmentData.project.id,
          recontactDays: environmentData.project.recontactDays,
          clickOutsideClose: environmentData.project.clickOutsideClose,
          overlay: environmentData.project.overlay,
          placement: environmentData.project.placement,
          inAppSurveyBranding: environmentData.project.inAppSurveyBranding,
          styling: resolveStorageUrlsInObject(environmentData.project.styling),
        },
      },
      surveys: resolveStorageUrlsInObject(transformedSurveys),
      actionClasses: environmentData.actionClasses as TJsEnvironmentStateActionClass[],
    };
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logger.error(error, "Database error in getEnvironmentStateData");
      throw new DatabaseError(`Database error when fetching environment state for ${environmentId}`);
    }

    logger.error(error, "Unexpected error in getEnvironmentStateData");
    throw error;
  }
};
