import { z } from "zod";
import { ZMembership } from "@continium/types/memberships";
import { ZOrganization } from "@continium/types/organizations";
import { ZUser } from "@continium/types/user";

export const ZOrganizationAuth = z.object({
  organization: ZOrganization,
  session: z.object({
    user: ZUser.pick({ id: true }),
    expires: z.string(),
  }),
  currentUserMembership: ZMembership,
  isMember: z.boolean(),
  isOwner: z.boolean(),
  isManager: z.boolean(),
  isBilling: z.boolean(),
});

export type TOrganizationAuth = z.infer<typeof ZOrganizationAuth>;
