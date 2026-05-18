import { logger } from "@continium/logger";
import { OrganizationAccessType } from "@continium/types/api-key";
import { TAuthenticationApiKey } from "@continium/types/auth";
import { hasOrganizationAccess } from "@/modules/organization/settings/api-keys/lib/utils";

export const hasOrganizationIdAndAccess = (
  paramOrganizationId: string,
  authentication: TAuthenticationApiKey,
  accessType: OrganizationAccessType
): boolean => {
  if (paramOrganizationId !== authentication.organizationId) {
    logger.error("Organization ID from params does not match the authenticated organization ID");

    return false;
  }

  return hasOrganizationAccess(authentication, accessType);
};
