import * as yaml from "yaml";
import { createDocument } from "zod-openapi";
import { ZApiKeyData } from "@continium/database/zod/api-keys";
import { ZContact } from "@continium/database/zod/contact";
import { ZContactAttributeKey } from "@continium/database/zod/contact-attribute-keys";
import { ZContactAttribute } from "@continium/database/zod/contact-attributes";
import { ZProjectTeam } from "@continium/database/zod/project-teams";
import { ZResponse } from "@continium/database/zod/responses";
import { ZRoles } from "@continium/database/zod/roles";
import { ZSurveyWithoutQuestionType } from "@continium/database/zod/surveys";
import { ZTeam } from "@continium/database/zod/teams";
import { ZUser } from "@continium/database/zod/users";
import { healthPaths } from "@/modules/api/v2/health/lib/openapi";
import { ZOverallHealthStatus } from "@/modules/api/v2/health/types/health-status";
import { contactAttributeKeyPaths } from "@/modules/api/v2/management/contact-attribute-keys/lib/openapi";
import { responsePaths } from "@/modules/api/v2/management/responses/lib/openapi";
import { surveyContactLinksBySegmentPaths } from "@/modules/api/v2/management/surveys/[surveyId]/contact-links/segments/lib/openapi";
import { surveyPaths } from "@/modules/api/v2/management/surveys/lib/openapi";
import { mePaths } from "@/modules/api/v2/me/lib/openapi";
import { projectTeamPaths } from "@/modules/api/v2/organizations/[organizationId]/project-teams/lib/openapi";
import { teamPaths } from "@/modules/api/v2/organizations/[organizationId]/teams/lib/openapi";
import { userPaths } from "@/modules/api/v2/organizations/[organizationId]/users/lib/openapi";
import { rolePaths } from "@/modules/api/v2/roles/lib/openapi";
import { bulkContactPaths } from "@/modules/ee/contacts/api/v2/management/contacts/bulk/lib/openapi";
import { contactPaths } from "@/modules/ee/contacts/api/v2/management/contacts/lib/openapi";

const document = createDocument({
  openapi: "3.1.0",
  info: {
    title: "Continium API",
    description: "Manage Continium resources programmatically.",
    version: "2.0.0",
  },
  paths: {
    ...healthPaths,
    ...rolePaths,
    ...mePaths,
    ...responsePaths,
    ...bulkContactPaths,
    ...contactPaths,
    ...contactAttributeKeyPaths,
    ...surveyPaths,
    ...surveyContactLinksBySegmentPaths,
    ...teamPaths,
    ...projectTeamPaths,
    ...userPaths,
  },
  servers: [
    {
      url: "https://app.continium.com/api/v2",
      description: "Continium Cloud",
    },
  ],
  tags: [
    {
      name: "Health",
      description: "Operations for checking critical application dependencies health status.",
    },
    {
      name: "Roles",
      description: "Operations for managing roles.",
    },
    {
      name: "Me",
      description: "Operations for managing your API key.",
    },
    {
      name: "Management API - Responses",
      description: "Operations for managing responses.",
    },
    {
      name: "Management API - Contacts",
      description: "Operations for managing contacts.",
    },
    {
      name: "Management API - Contact Attributes",
      description: "Operations for managing contact attributes.",
    },
    {
      name: "Management API - Contact Attribute Keys",
      description: "Operations for managing contact attribute keys.",
    },
    {
      name: "Management API - Surveys",
      description: "Operations for managing surveys.",
    },
    {
      name: "Management API - Surveys - Contact Links",
      description: "Operations for generating personalized survey links for contacts.",
    },
    {
      name: "Organizations API - Teams",
      description: "Operations for managing teams.",
    },
    {
      name: "Organizations API - Project Teams",
      description: "Operations for managing project teams.",
    },
    {
      name: "Organizations API - Users",
      description: "Operations for managing users.",
    },
  ],
  components: {
    securitySchemes: {
      apiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description: "Use your Continium x-api-key to authenticate.",
      },
    },
    schemas: {
      health: ZOverallHealthStatus,
      role: ZRoles,
      me: ZApiKeyData,
      response: ZResponse,
      contact: ZContact,
      contactAttribute: ZContactAttribute,
      contactAttributeKey: ZContactAttributeKey,
      survey: ZSurveyWithoutQuestionType,
      team: ZTeam,
      projectTeam: ZProjectTeam,
      user: ZUser,
    },
  },
  security: [
    {
      apiKeyAuth: [],
    },
  ],
});

// do not replace this with logger.info
console.log(yaml.stringify(document));
