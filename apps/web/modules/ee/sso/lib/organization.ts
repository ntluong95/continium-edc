import { Organization, Prisma } from "@prisma/client";
import { cache as reactCache } from "react";
import { prisma } from "@continium/database";
import { DatabaseError } from "@continium/types/errors";

export const getFirstOrganization = reactCache(async (): Promise<Organization | null> => {
  try {
    const organization = await prisma.organization.findFirst({});
    return organization;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }

    throw error;
  }
});
