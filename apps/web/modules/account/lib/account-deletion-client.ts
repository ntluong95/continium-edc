import type { IdentityProvider } from "@prisma/client";

// ---------------------------------------------------------------------------
// Provider mapping: Prisma IdentityProvider -> NextAuth provider id
// ---------------------------------------------------------------------------

const IDENTITY_PROVIDER_TO_NEXTAUTH: Partial<Record<IdentityProvider, string>> = {
  google: "google",
  github: "github",
  azuread: "azure-ad",
  openid: "openid",
};

/** Returns the NextAuth provider id for the given Prisma identity provider, or null for unsupported ones. */
export const identityProviderToNextAuthProvider = (provider: IdentityProvider): string | null =>
  IDENTITY_PROVIDER_TO_NEXTAUTH[provider] ?? null;

/**
 * Returns true when the given identity provider supports the SSO reauth deletion flow.
 * SAML is excluded because it doesn't go through the standard NextAuth OAuth callback.
 */
export const isSsoReauthSupportedForProvider = (provider: IdentityProvider): boolean =>
  provider in IDENTITY_PROVIDER_TO_NEXTAUTH;

// ---------------------------------------------------------------------------
// Authorization params for SSO providers (force re-authentication)
// ---------------------------------------------------------------------------

type TAuthorizationParams = Record<string, string>;

const GOOGLE_AUTH_TIME_MAX_AGE_SECONDS = 5 * 60; // 5 minutes

/**
 * Returns provider-specific OAuth params that force fresh authentication,
 * preventing silent SSO re-use of a cached provider session.
 */
export const getReauthAuthorizationParams = (nextAuthProvider: string): TAuthorizationParams => {
  switch (nextAuthProvider) {
    case "google":
      return { prompt: "select_account", max_age: String(GOOGLE_AUTH_TIME_MAX_AGE_SECONDS) };
    case "azure-ad":
      return { prompt: "login" };
    default:
      return {};
  }
};

/** Human-readable provider label for display in UI. */
export const getProviderDisplayLabel = (nextAuthProvider: string): string => {
  const labels: Record<string, string> = {
    google: "Google",
    github: "GitHub",
    "azure-ad": "Azure AD",
    openid: "OpenID",
  };
  return labels[nextAuthProvider] ?? nextAuthProvider;
};
