import { headers } from "next/headers";
import { z } from "zod";
import { logger } from "@continium/logger";
import { responses } from "@/app/lib/api/response";
import { CRON_SECRET } from "@/lib/constants";
import { sendFollowUpsForResponse } from "@/modules/survey/follow-ups/lib/follow-ups";
import { FollowUpSendError } from "@/modules/survey/follow-ups/types/follow-up";

const ZRequestBody = z.object({
  responseId: z.string().trim().min(1),
});

export const POST = async (request: Request) => {
  const requestHeaders = await headers();

  if (requestHeaders.get("x-api-key") !== CRON_SECRET) {
    return responses.notAuthenticatedResponse();
  }

  const parsedBody = ZRequestBody.safeParse(await request.json());
  if (!parsedBody.success) {
    return responses.badRequestResponse("Invalid follow-up job payload", {
      responseId: "responseId is required",
    });
  }

  const followUpResult = await sendFollowUpsForResponse(parsedBody.data.responseId);

  if (followUpResult.ok) {
    return Response.json({ data: followUpResult.data });
  }

  // Non-transient errors: return 200 so pg-boss marks the job complete (no retry).
  // These errors won't resolve on retry — the same data will produce the same failure.
  const NON_TRANSIENT_ERRORS = new Set<FollowUpSendError>([
    FollowUpSendError.FOLLOW_UP_NOT_ALLOWED,
    FollowUpSendError.VALIDATION_ERROR,
    FollowUpSendError.RESPONSE_NOT_FOUND,
    FollowUpSendError.SURVEY_NOT_FOUND,
    FollowUpSendError.ORG_NOT_FOUND,
    FollowUpSendError.UNEXPECTED_ERROR, // non-deterministic; retrying risks duplicate sends
  ]);

  if (NON_TRANSIENT_ERRORS.has(followUpResult.error.code)) {
    const logFn =
      followUpResult.error.code === FollowUpSendError.FOLLOW_UP_NOT_ALLOWED ? "warn" : "error";
    logger[logFn](
      { responseId: parsedBody.data.responseId, error: followUpResult.error },
      "Follow-up job completed with non-transient error — not retrying"
    );
    // Return 200 so the worker does not retry; the error is surfaced via logs only.
    return Response.json({ data: { skipped: true, reason: followUpResult.error.code } });
  }

  // Transient errors (e.g. RATE_LIMIT_EXCEEDED): return 500 so pg-boss schedules a retry.
  logger.warn(
    { responseId: parsedBody.data.responseId, error: followUpResult.error },
    "Follow-up job failed with transient error — will retry"
  );
  return responses.internalServerErrorResponse("Transient failure; retry scheduled");
};
