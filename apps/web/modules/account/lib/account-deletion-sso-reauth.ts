import "server-only";

import crypto from "crypto";

import jwt from "jsonwebtoken";
import { createCacheKey } from "@continium/cache";
import { logger } from "@continium/logger";

import { GOOGLE_ACCOUNT_DELETION_REAUTH_ENABLED } from "@/lib/constants";
import { cache } from "@/lib/cache";

export { identityProviderToNextAuthProvider, isSsoReauthSupportedForProvider } from "./account-deletion-client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TAccountDeletionSsoIntent = {
  userId: string;
  email: string;
  /** IdentityProvider value, e.g. "google", "github", "azuread", "openid" */
  provider: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INTENT_TTL_MS = 10 * 60 * 1000; // 10 minutes
const GOOGLE_AUTH_TIME_MAX_AGE_SECONDS = 5 * 60; // 5 minutes

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

const makeIntentKey = (token: string) => createCacheKey.custom("account_deletion", token);

/**
 * Creates a one-time Redis-backed intent token for the SSO reauth deletion flow.
 * The token should be embedded in the OAuth callbackUrl so the completion route
 * can look up and verify the intent after the OAuth round-trip.
 */
export const createAccountDeletionSsoReauthIntent = async ({
  userId,
  email,
  provider,
}: TAccountDeletionSsoIntent): Promise<string> => {
  const token = crypto.randomUUID();
  const intent: TAccountDeletionSsoIntent = { userId, email, provider };

  const result = await cache.set(makeIntentKey(token), intent, INTENT_TTL_MS);
  if (!result.ok) {
    throw new Error("Failed to store account deletion SSO reauth intent");
  }

  return token;
};

/**
 * Reads and atomically removes the intent from Redis.
 * Returns null if the token is missing or expired.
 */
export const consumeAccountDeletionSsoIntent = async (
  token: string
): Promise<TAccountDeletionSsoIntent | null> => {
  const key = makeIntentKey(token);

  const result = await cache.get<TAccountDeletionSsoIntent>(key);
  if (!result.ok || !result.data) {
    return null;
  }

  // Delete immediately so the token cannot be replayed.
  void cache.del([key]);

  return result.data;
};

// ---------------------------------------------------------------------------
// Google auth_time verification
// ---------------------------------------------------------------------------

/**
 * Decodes the Google id_token (already verified by NextAuth) and checks that
 * the auth_time claim is within the allowed window.
 *
 * Only enforced when GOOGLE_ACCOUNT_DELETION_REAUTH_ENABLED=1.
 */
export const verifyGoogleAuthTime = (idToken: string): boolean => {
  if (!GOOGLE_ACCOUNT_DELETION_REAUTH_ENABLED) {
    return true;
  }

  try {
    const decoded = jwt.decode(idToken) as { auth_time?: number } | null;
    if (decoded === null || typeof decoded !== "object" || typeof decoded.auth_time !== "number") {
      logger.warn("Google id_token missing auth_time claim; rejecting deletion reauth");
      return false;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const authAgeSeconds = nowSeconds - decoded.auth_time;

    if (authAgeSeconds > GOOGLE_AUTH_TIME_MAX_AGE_SECONDS) {
      logger.warn(
        { authAgeSeconds, maxAllowed: GOOGLE_AUTH_TIME_MAX_AGE_SECONDS },
        "Google auth_time too old for account deletion SSO reauth"
      );
      return false;
    }

    return true;
  } catch (error) {
    logger.error({ error }, "Failed to decode Google id_token during deletion reauth");
    return false;
  }
};

