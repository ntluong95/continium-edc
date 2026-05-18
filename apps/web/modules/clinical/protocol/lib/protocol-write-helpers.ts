import "server-only";
import { Prisma } from "@prisma/client";
import { ValidationError } from "@continium/types/errors";

/**
 * Translates Prisma's relational-constraint failures (FK RESTRICT, dependent
 * rows still present) into a `ValidationError` that the toast layer can show
 * verbatim. Without this, a user trying to delete an Arm that still has
 * enrollments sees a generic 500 / "An unknown error occurred" message.
 *
 * Catches:
 *   - P2003: Foreign key constraint failed on the field (e.g. Arm referenced by enrollment).
 *   - P2014: A relation would violate the required field on the dependent record
 *            (less common but identical UX).
 *
 * Re-throws every other error untouched.
 */
export const withFriendlyForeignKeyError = async <T>(
  fallbackMessage: string,
  fn: () => Promise<T>
): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      (err.code === "P2003" || err.code === "P2014")
    ) {
      throw new ValidationError(fallbackMessage);
    }
    throw err;
  }
};

interface ReorderableModel {
  update(args: {
    where: { id: string };
    data: { position: number };
  }): Promise<unknown>;
}

/**
 * Applies a positional reorder to a list of identifiers in a SERIAL pass.
 *
 * Prisma's `$transaction(callback)` does run inner queries serially over a
 * single connection, but explicitly serialising the updates here removes any
 * doubt about ordering when reading the source. The callsite stays a one-liner
 * and the audit-log emit can rely on the order being applied as supplied.
 */
export const reorderPositions = async (
  model: ReorderableModel,
  orderedIds: ReadonlyArray<string>
): Promise<void> => {
  for (let position = 0; position < orderedIds.length; position++) {
    await model.update({ where: { id: orderedIds[position] }, data: { position } });
  }
};
