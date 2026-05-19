import "server-only";
import { Prisma } from "@prisma/client";
import { cache as reactCache } from "react";
import { prisma } from "@continium/database";
import { logger } from "@continium/logger";
import { ZString } from "@continium/types/common";
import { DatabaseError, UnknownError } from "@continium/types/errors";
import { TMembership, ZMembership } from "@continium/types/memberships";
import { validateInputs } from "../utils/validate";

type TMembershipDbClient = Pick<typeof prisma, "membership">;

const getDbClient = (tx?: TMembershipDbClient): TMembershipDbClient =>
  (tx ?? prisma) as unknown as TMembershipDbClient;

const getMembershipByUserIdOrganizationIdUncached = async (
  userId: string,
  organizationId: string,
  tx?: TMembershipDbClient
): Promise<TMembership | null> => {
  validateInputs([userId, ZString], [organizationId, ZString]);

  try {
    const membership = await getDbClient(tx).membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!membership) return null;

    return membership;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logger.error(error, "Error getting membership by user id and organization id");
      throw new DatabaseError(error.message);
    }

    throw new UnknownError("Error while fetching membership");
  }
};

const getMembershipByUserIdOrganizationIdCached = reactCache(async (userId: string, organizationId: string) =>
  getMembershipByUserIdOrganizationIdUncached(userId, organizationId)
);

export const getMembershipByUserIdOrganizationId = async (
  userId: string,
  organizationId: string,
  tx?: TMembershipDbClient
): Promise<TMembership | null> => {
  if (tx) {
    return getMembershipByUserIdOrganizationIdUncached(userId, organizationId, tx);
  }

  return getMembershipByUserIdOrganizationIdCached(userId, organizationId);
};

export const createMembership = async (
  organizationId: string,
  userId: string,
  data: Partial<TMembership>,
  tx?: TMembershipDbClient
): Promise<TMembership> => {
  validateInputs([organizationId, ZString], [userId, ZString], [data, ZMembership.partial()]);

  try {
    const prismaClient = getDbClient(tx);
    const existingMembership = await prismaClient.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (existingMembership && existingMembership.role === data.role) {
      return existingMembership;
    }

    let membership: TMembership;
    if (!existingMembership) {
      membership = await prismaClient.membership.create({
        data: {
          userId,
          organizationId,
          accepted: data.accepted,
          role: data.role as TMembership["role"],
        },
      });
    } else {
      membership = await prismaClient.membership.update({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
        data: {
          accepted: data.accepted,
          role: data.role as TMembership["role"],
        },
      });
    }

    return membership;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }

    throw error;
  }
};
