import * as Sentry from "@sentry/nextjs";
import { getServerSession } from "next-auth";
import { DEFAULT_SERVER_ERROR_MESSAGE, createSafeActionClient } from "next-safe-action";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@continium/logger";
import { AuthenticationError, AuthorizationError, isExpectedError } from "@continium/types/errors";
import { AUDIT_LOG_ENABLED, AUDIT_LOG_GET_USER_IP } from "@/lib/constants";
import { getUser } from "@/lib/user/service";
import { getClientIpFromHeaders } from "@/lib/utils/client-ip";
import { authOptions } from "@/modules/auth/lib/authOptions";
import { UNKNOWN_DATA } from "@/modules/ee/audit-logs/types/audit-log";
import { ActionClientCtx } from "./types/context";

export const actionClient = createSafeActionClient({
  handleServerError(e, utils) {
    const eventId = (utils.ctx as Record<string, any>)?.auditLoggingCtx?.eventId ?? undefined; // keep explicit fallback

    // Continium feature gates: the error's message contains the feature key
    // (e.g. "Continium feature is disabled: clinicalDataAccessGroups"). Do NOT
    // return that to the client — surfacing it lets an authenticated user map
    // an instance's per-org disabled-feature set (recon).
    // The feature key is logged server-side via the unexpected-error branch
    // intentionally bypassed here; if you need it, read it from e.feature on
    // the server-side log record.
    if (e.name === "ContiniumFeatureDisabledError") {
      logger.withContext({ eventId }).info(
        { feature: (e as { feature?: string }).feature ?? "unknown" },
        "Continium feature gate closed",
      );
      return "Feature is not enabled";
    }

    if (isExpectedError(e)) {
      return e.message;
    }

    // Only capture unexpected errors to Sentry
    Sentry.captureException(e, {
      extra: {
        eventId,
      },
    });

    // eslint-disable-next-line no-console -- This error needs to be logged for debugging server-side errors
    logger.withContext({ eventId }).error(e, "SERVER ERROR");
    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
}).use(async ({ next }) => {
  // Create a unique event id
  const eventId = uuidv4();
  const ctx: ActionClientCtx = { auditLoggingCtx: { eventId, ipAddress: UNKNOWN_DATA } };

  if (AUDIT_LOG_ENABLED && AUDIT_LOG_GET_USER_IP) {
    try {
      const ipAddress = await getClientIpFromHeaders();
      ctx.auditLoggingCtx.ipAddress = ipAddress;
    } catch (err) {
      // Non-fatal – we keep UNKNOWN_DATA
      logger.warn({ err }, "Failed to resolve client IP for audit logging");
    }
  }

  return next({ ctx });
});

export const authenticatedActionClient = actionClient.use(async ({ ctx, next }) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new AuthenticationError("Not authenticated");
  }

  const userId = session.user.id;

  const user = await getUser(userId);
  if (!user) {
    throw new AuthorizationError("User not found");
  }

  return next({ ctx: { ...ctx, user } });
});
