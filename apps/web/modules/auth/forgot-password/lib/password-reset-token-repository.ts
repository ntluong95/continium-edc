import "server-only";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@continium/database";
import { ZId } from "@continium/types/common";
import { DatabaseError } from "@continium/types/errors";
import { validateInputs } from "@/lib/utils/validate";

const passwordResetTokenSelection = {
  id: true,
  userId: true,
  tokenHash: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PasswordResetTokenSelect;

const ZTokenHash = z.string().min(1);

type TPasswordResetTokenDbClient = Pick<typeof prisma, "passwordResetToken">;

export type TPasswordResetTokenRecord = Prisma.PasswordResetTokenGetPayload<{
  select: typeof passwordResetTokenSelection;
}>;

const getDbClient = (tx?: TPasswordResetTokenDbClient): TPasswordResetTokenDbClient =>
  (tx ?? prisma) as unknown as TPasswordResetTokenDbClient;

const handleDatabaseError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    throw new DatabaseError(error.message);
  }

  throw error;
};

export const upsertActiveToken = async (
  userId: string,
  tokenHash: string,
  expiresAt: Date,
  tx?: TPasswordResetTokenDbClient
): Promise<TPasswordResetTokenRecord> => {
  validateInputs([userId, ZId], [tokenHash, ZTokenHash], [expiresAt, z.date()]);

  try {
    return await getDbClient(tx).passwordResetToken.upsert({
      where: {
        userId,
      },
      create: {
        userId,
        tokenHash,
        expiresAt,
      },
      update: {
        tokenHash,
        expiresAt,
      },
      select: passwordResetTokenSelection,
    });
  } catch (error) {
    return handleDatabaseError(error);
  }
};

export const findByTokenHash = async (
  tokenHash: string,
  tx?: TPasswordResetTokenDbClient
): Promise<TPasswordResetTokenRecord | null> => {
  validateInputs([tokenHash, ZTokenHash]);

  try {
    return await getDbClient(tx).passwordResetToken.findUnique({
      where: {
        tokenHash,
      },
      select: passwordResetTokenSelection,
    });
  } catch (error) {
    return handleDatabaseError(error);
  }
};

export const deleteByTokenHash = async (
  tokenHash: string,
  tx?: TPasswordResetTokenDbClient
): Promise<number> => {
  validateInputs([tokenHash, ZTokenHash]);

  try {
    const result = await getDbClient(tx).passwordResetToken.deleteMany({
      where: {
        tokenHash,
      },
    });

    return result.count;
  } catch (error) {
    return handleDatabaseError(error);
  }
};

export const consumeActiveToken = async (
  tokenHash: string,
  now: Date,
  tx: TPasswordResetTokenDbClient
): Promise<number> => {
  validateInputs([tokenHash, ZTokenHash], [now, z.date()]);

  try {
    const result = await tx.passwordResetToken.deleteMany({
      where: {
        tokenHash,
        expiresAt: {
          gt: now,
        },
      },
    });

    return result.count;
  } catch (error) {
    return handleDatabaseError(error);
  }
};
