import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@continium/database";
import { logger } from "@continium/logger";
import { IS_CONTINIUM_CLOUD, WEBAPP_URL } from "@/lib/constants";
import { getOrganizationsWhereUserIsSingleOwner } from "@/lib/organization/service";
import { deleteUser } from "@/lib/user/service";
import { deleteSessionBySessionToken } from "@/modules/auth/lib/auth-session-repository";
import { authOptions } from "@/modules/auth/lib/authOptions";
import {
  NEXT_AUTH_SESSION_COOKIE_NAMES,
  getSessionTokenFromCookieHeader,
} from "@/modules/auth/lib/session-cookie";
import { getIsMultiOrgEnabled } from "@/modules/license-check/lib/utils";
import {
  consumeAccountDeletionSsoIntent,
  verifyGoogleAuthTime,
} from "@/modules/account/lib/account-deletion-sso-reauth";
import {
  ACCOUNT_DELETION_EMAIL_MISMATCH_ERROR_CODE,
  ACCOUNT_DELETION_SSO_REAUTH_ERROR_QUERY_PARAM,
  ACCOUNT_DELETION_SSO_REAUTH_FAILED_ERROR_CODE,
} from "@/modules/account/constants";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CONTINIUM_CLOUD_POST_DELETION_URL = "https://app.continium.com/s/clri52y3z8f221225wjdhsoo2";

const buildErrorRedirect = (errorCode: string): NextResponse => {
  const url = new URL("/auth/login", WEBAPP_URL);
  url.searchParams.set(ACCOUNT_DELETION_SSO_REAUTH_ERROR_QUERY_PARAM, errorCode);
  return NextResponse.redirect(url.toString());
};

const buildSuccessRedirect = (): NextResponse =>
  NextResponse.redirect(
    IS_CONTINIUM_CLOUD ? CONTINIUM_CLOUD_POST_DELETION_URL : new URL("/auth/login", WEBAPP_URL).toString()
  );

const clearSessionCookies = (response: NextResponse): void => {
  for (const cookieName of NEXT_AUTH_SESSION_COOKIE_NAMES) {
    response.cookies.set({
      name: cookieName,
      value: "",
      expires: new Date(0),
      path: "/",
      secure: cookieName.startsWith("__Secure-"),
    });
  }
};

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const GET = async (request: Request): Promise<NextResponse> => {
  const url = new URL(request.url);
  const intentToken = url.searchParams.get("intent");

  if (!intentToken) {
    logger.error("Account deletion SSO reauth: missing intent token in callback URL");
    return buildErrorRedirect(ACCOUNT_DELETION_SSO_REAUTH_FAILED_ERROR_CODE);
  }

  // Require an active session — NextAuth creates one after the OAuth round-trip.
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    logger.error("Account deletion SSO reauth: no active session after OAuth callback");
    return buildErrorRedirect(ACCOUNT_DELETION_SSO_REAUTH_FAILED_ERROR_CODE);
  }

  // Consume the intent (one-time use — replay attempts will fail here).
  const intent = await consumeAccountDeletionSsoIntent(intentToken);
  if (!intent) {
    logger.error(
      { sessionUserId: session.user.id },
      "Account deletion SSO reauth: intent token not found or already consumed"
    );
    return buildErrorRedirect(ACCOUNT_DELETION_SSO_REAUTH_FAILED_ERROR_CODE);
  }

  // The session user must match the user who initiated the intent.
  if (session.user.id !== intent.userId) {
    logger.error(
      { sessionUserId: session.user.id, intentUserId: intent.userId },
      "Account deletion SSO reauth: session user does not match intent"
    );
    return buildErrorRedirect(ACCOUNT_DELETION_SSO_REAUTH_FAILED_ERROR_CODE);
  }

  // Fetch the current user from the database.
  const user = await prisma.user.findUnique({
    where: { id: intent.userId },
    select: { email: true, identityProvider: true },
  });

  if (!user) {
    logger.error({ intentUserId: intent.userId }, "Account deletion SSO reauth: user not found");
    return buildErrorRedirect(ACCOUNT_DELETION_SSO_REAUTH_FAILED_ERROR_CODE);
  }

  if (user.email.toLowerCase() !== intent.email.toLowerCase()) {
    logger.error(
      { intentUserId: intent.userId },
      "Account deletion SSO reauth: stored email does not match current user email"
    );
    return buildErrorRedirect(ACCOUNT_DELETION_EMAIL_MISMATCH_ERROR_CODE);
  }

  // For Google: verify auth_time is recent enough when the feature is enabled.
  if (intent.provider === "google") {
    const account = await prisma.account.findFirst({
      where: { userId: intent.userId, provider: "google" },
      select: { id_token: true },
    });

    if (account?.id_token) {
      const isAuthTimeValid = verifyGoogleAuthTime(account.id_token);
      if (!isAuthTimeValid) {
        logger.error(
          { intentUserId: intent.userId },
          "Account deletion SSO reauth: Google auth_time exceeds allowed window"
        );
        return buildErrorRedirect(ACCOUNT_DELETION_SSO_REAUTH_FAILED_ERROR_CODE);
      }
    } else {
      logger.warn(
        { intentUserId: intent.userId },
        "Account deletion SSO reauth: Google id_token not found; skipping auth_time check"
      );
    }
  }

  // Mirror the business rule from deleteUserAction: single-owner org guard.
  const isMultiOrgEnabled = await getIsMultiOrgEnabled();
  if (!isMultiOrgEnabled) {
    const singleOwnerOrgs = await getOrganizationsWhereUserIsSingleOwner(intent.userId);
    if (singleOwnerOrgs.length > 0) {
      logger.error(
        { intentUserId: intent.userId, orgCount: singleOwnerOrgs.length },
        "Account deletion SSO reauth: user is sole owner of one or more organizations"
      );
      return buildErrorRedirect(ACCOUNT_DELETION_SSO_REAUTH_FAILED_ERROR_CODE);
    }
  }

  // Delete the user account.
  try {
    await deleteUser(intent.userId);
  } catch (error) {
    logger.error({ error, userId: intent.userId }, "Account deletion SSO reauth: deleteUser failed");
    return buildErrorRedirect(ACCOUNT_DELETION_SSO_REAUTH_FAILED_ERROR_CODE);
  }

  logger.info({ userId: intent.userId }, "Account deletion SSO reauth: account deleted successfully");

  const response = buildSuccessRedirect();
  clearSessionCookies(response);

  // Best-effort session cleanup.
  const sessionToken = getSessionTokenFromCookieHeader(request.headers.get("cookie"));
  if (sessionToken) {
    try {
      await deleteSessionBySessionToken(sessionToken);
    } catch (error) {
      logger.error({ error }, "Account deletion SSO reauth: failed to delete session record");
    }
  }

  return response;
};
