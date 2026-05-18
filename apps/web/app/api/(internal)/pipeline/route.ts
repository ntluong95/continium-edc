import { headers } from "next/headers";
import { prisma } from "@continium/database";
import { logger } from "@continium/logger";
import { ResourceNotFoundError } from "@continium/types/errors";
import { sendTelemetryEvents } from "@/app/api/(internal)/pipeline/lib/telemetry";
import { ZPipelineInput } from "@/app/api/(internal)/pipeline/types/pipelines";
import { responses } from "@/app/lib/api/response";
import { transformErrorToDetails } from "@/app/lib/api/validator";
import { CRON_SECRET, POSTHOG_KEY } from "@/lib/constants";
import { getOrganizationByEnvironmentId } from "@/lib/organization/service";
import { getResponseCountBySurveyId } from "@/lib/response/service";
import { getSurvey, updateSurvey } from "@/lib/survey/service";
import { convertDatesInObject } from "@/lib/time";
import { getProjectIdFromEnvironmentId } from "@/lib/utils/helper";
import { queueAuditEvent } from "@/modules/ee/audit-logs/lib/handler";
import { TAuditStatus, UNKNOWN_DATA } from "@/modules/ee/audit-logs/types/audit-log";
import { recordResponseCreatedMeterEvent } from "@/modules/ee/billing/lib/metering";
import { sendResponseFinishedEmail } from "@/modules/email";
import { dispatchPipelineWebhooks } from "@/modules/integrations/webhooks/lib/webhook-dispatch";
import { enqueueFollowUpResponseJob } from "@/modules/survey/follow-ups/lib/follow-up-response-queue";
import { captureSurveyResponsePostHogEvent } from "./lib/posthog";

export const POST = async (request: Request) => {
  const requestHeaders = await headers();
  // Check authentication
  if (requestHeaders.get("x-api-key") !== CRON_SECRET) {
    return responses.notAuthenticatedResponse();
  }

  const jsonInput = await request.json();
  const convertedJsonInput = convertDatesInObject(
    jsonInput,
    new Set(["contactAttributes", "variables", "data", "meta"])
  );

  const inputValidation = ZPipelineInput.safeParse(convertedJsonInput);

  if (!inputValidation.success) {
    logger.error(
      { error: inputValidation.error, url: request.url },
      "Error in POST /api/(internal)/pipeline"
    );
    return responses.badRequestResponse(
      "Fields are missing or incorrectly formatted",
      transformErrorToDetails(inputValidation.error),
      true
    );
  }

  const { environmentId, surveyId, event, response } = inputValidation.data;

  // Outbound webhooks fire on every recognised event regardless of survey
  // ownership; deliveries are best-effort and never block the rest of the
  // pipeline work (emails, billing, telemetry).
  dispatchPipelineWebhooks({ event, environmentId, surveyId, response }).catch((error) => {
    logger.error({ error, surveyId, environmentId, event }, "Webhook dispatch failed");
  });

  const organization = await getOrganizationByEnvironmentId(environmentId);
  if (!organization) {
    throw new ResourceNotFoundError("Organization", "Organization not found");
  }

  const survey = await getSurvey(surveyId);
  if (!survey) {
    logger.error({ url: request.url, surveyId }, `Survey with id ${surveyId} not found`);

    return responses.notFoundResponse("Survey", surveyId, true);
  }

  if (survey.environmentId !== environmentId) {
    logger.error(
      { url: request.url, surveyId, environmentId, surveyEnvironmentId: survey.environmentId },
      `Survey ${surveyId} does not belong to environment ${environmentId}`
    );
    return responses.badRequestResponse("Survey not found in this environment");
  }

  if (event === "responseFinished") {
    const responseCount = await getResponseCountBySurveyId(surveyId);

    // Fetch users with notifications in a single query
    // TODO: add cache for this query. Not possible at the moment since we can't get the membership cache by environmentId
    const usersWithNotifications = await prisma.user.findMany({
      where: {
        memberships: {
          some: {
            organization: {
              projects: {
                some: {
                  environments: {
                    some: { id: environmentId },
                  },
                },
              },
            },
          },
        },
        OR: [
          {
            memberships: {
              every: {
                role: {
                  in: ["owner", "manager"],
                },
              },
            },
          },
          {
            teamUsers: {
              some: {
                team: {
                  projectTeams: {
                    some: {
                      project: {
                        environments: {
                          some: {
                            id: environmentId,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
        notificationSettings: {
          path: ["alert", surveyId],
          equals: true,
        },
      },
      select: { email: true, locale: true },
    });

    if (survey.followUps?.length > 0) {
      try {
        await enqueueFollowUpResponseJob(response.id);
      } catch (error) {
        logger.error(
          { error, responseId: response.id },
          `Failed to enqueue follow-up emails for survey ${surveyId}`
        );
      }
    }

    const emailPromises = usersWithNotifications.map((user) =>
      sendResponseFinishedEmail(
        user.email,
        user.locale,
        environmentId,
        survey,
        response,
        responseCount
      ).catch((error) => {
        logger.error(
          { error, url: request.url, userEmail: user.email },
          `Failed to send email to ${user.email}`
        );
      })
    );

    // Update survey status if necessary
    if (survey.autoComplete && responseCount >= survey.autoComplete) {
      let logStatus: TAuditStatus = "success";

      try {
        await updateSurvey({
          ...survey,
          status: "completed",
        });
      } catch (error) {
        logStatus = "failure";
        logger.error(
          { error, url: request.url, surveyId },
          `Failed to update survey ${surveyId} status to completed`
        );
      } finally {
        await queueAuditEvent({
          status: logStatus,
          action: "updated",
          targetType: "survey",
          userId: UNKNOWN_DATA,
          userType: "system",
          targetId: survey.id,
          organizationId: organization.id,
          newObject: {
            status: "completed",
          },
        });
      }
    }

    const results = await Promise.allSettled(emailPromises);
    results.forEach((result) => {
      if (result.status === "rejected") {
        logger.error({ error: result.reason, url: request.url }, "Promise rejected");
      }
    });
  }

  if (event === "responseCreated") {
    recordResponseCreatedMeterEvent({
      stripeCustomerId: organization.billing.stripeCustomerId,
      responseId: response.id,
      createdAt: response.createdAt,
    }).catch((error) => {
      logger.error({ error, responseId: response.id }, "Failed to record response meter event");
    });

    if (POSTHOG_KEY) {
      const responseCount = await getResponseCountBySurveyId(surveyId);
      const workspaceId = await getProjectIdFromEnvironmentId(environmentId);

      captureSurveyResponsePostHogEvent({
        organizationId: organization.id,
        workspaceId,
        surveyId,
        surveyType: survey.type,
        environmentId,
        responseCount,
      });
    }

    // Send telemetry events
    await sendTelemetryEvents();
  }

  return Response.json({ data: {} });
};
