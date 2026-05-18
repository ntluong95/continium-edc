import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@continium/logger";
import { isPublicDomainConfigured, isRequestFromPublicDomain } from "@/app/middleware/domain-utils";
import { isAuthProtectedRoute, isRouteAllowedForDomain } from "@/app/middleware/endpoint-validator";
import { WEBAPP_URL } from "@/lib/constants";
import { getValidatedCallbackUrl } from "@/lib/utils/url";
import { getProxySession } from "@/modules/auth/lib/proxy-session";

const handleAuth = async (request: NextRequest): Promise<Response | null> => {
  const session = await getProxySession(request);

  if (isAuthProtectedRoute(request.nextUrl.pathname) && !session) {
    const loginUrl = `${WEBAPP_URL}/auth/login?callbackUrl=${encodeURIComponent(WEBAPP_URL + request.nextUrl.pathname + request.nextUrl.search)}`;
    return NextResponse.redirect(loginUrl);
  }

  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
  const validatedCallbackUrl = getValidatedCallbackUrl(callbackUrl, WEBAPP_URL);

  if (callbackUrl && !validatedCallbackUrl) {
    return NextResponse.json({ error: "Invalid callback URL" }, { status: 400 });
  }

  if (session && validatedCallbackUrl) {
    return NextResponse.redirect(validatedCallbackUrl);
  }

  return null;
};

/**
 * Handle domain-aware routing based on PUBLIC_URL and WEBAPP_URL
 */
const handleDomainAwareRouting = (request: NextRequest): Response | null => {
  try {
    const publicDomainConfigured = isPublicDomainConfigured();

    // When PUBLIC_URL is not configured, admin domain allows all routes (backward compatibility)
    if (!publicDomainConfigured) return null;

    const isPublicDomain = isRequestFromPublicDomain(request);

    const pathname = request.nextUrl.pathname;

    // Check if the route is allowed for the current domain
    const isAllowed = isRouteAllowedForDomain(pathname, isPublicDomain);

    if (!isAllowed) {
      return new NextResponse(null, { status: 404 });
    }

    return null; // Allow the request to continue
  } catch (error) {
    logger.error(error, "Error handling domain-aware routing");
    return new NextResponse(null, { status: 404 });
  }
};

export const proxy = async (originalRequest: NextRequest) => {
  // Redirect legacy /environments/<id>/surveys/* UI paths to /environments/<id>/forms/*.
  // API paths (/api/v*/surveys) keep the `surveys` vocabulary and are not redirected.
  const surveysMatch =
    /^\/environments\/(?<environmentId>[^/]+)\/surveys(?<rest>\/.*)?$/.exec(
      originalRequest.nextUrl.pathname,
    );
  if (surveysMatch?.groups) {
    const { environmentId, rest } = surveysMatch.groups;
    const redirectUrl = originalRequest.nextUrl.clone();
    redirectUrl.pathname = `/environments/${environmentId}/forms${rest ?? ""}`;
    return NextResponse.redirect(redirectUrl, 308);
  }

  // Handle domain-aware routing first
  const domainResponse = handleDomainAwareRouting(originalRequest);
  if (domainResponse) return domainResponse;

  // Create a new Request object to override headers and add a unique request ID header
  const request = new NextRequest(originalRequest, {
    headers: new Headers(originalRequest.headers),
  });

  request.headers.set("x-request-id", uuidv4());
  request.headers.set("x-start-time", Date.now().toString());

  // Create a new NextResponse object to forward the new request with headers
  const nextResponseWithCustomHeader = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Handle authentication
  const authResponse = await handleAuth(request);
  if (authResponse) return authResponse;

  return nextResponseWithCustomHeader;
};

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|js|css|images|fonts|icons|public|animated-bgs).*)",
  ],
};
