import { Prisma } from "@prisma/client";
import { describe, expect, test, vi } from "vitest";
import { ValidationError } from "@continium/types/errors";
import { reorderPositions, withFriendlyForeignKeyError } from "./protocol-write-helpers";

const makeKnownError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError("forced", { code, clientVersion: "test" });

describe("withFriendlyForeignKeyError", () => {
  test("returns the operation result when no error is thrown", async () => {
    const result = await withFriendlyForeignKeyError("fallback", async () => "ok");
    expect(result).toBe("ok");
  });

  test("translates Prisma P2003 (FK constraint) into a ValidationError", async () => {
    await expect(
      withFriendlyForeignKeyError("This arm is in use.", async () => {
        throw makeKnownError("P2003");
      })
    ).rejects.toThrow(ValidationError);

    await expect(
      withFriendlyForeignKeyError("This arm is in use.", async () => {
        throw makeKnownError("P2003");
      })
    ).rejects.toThrow("This arm is in use.");
  });

  test("translates Prisma P2014 (related record exists) into a ValidationError", async () => {
    await expect(
      withFriendlyForeignKeyError("Dependent records present.", async () => {
        throw makeKnownError("P2014");
      })
    ).rejects.toThrow(ValidationError);
  });

  test("re-throws other Prisma error codes untouched", async () => {
    const other = makeKnownError("P2025"); // record not found
    await expect(
      withFriendlyForeignKeyError("fallback", async () => {
        throw other;
      })
    ).rejects.toBe(other);
  });

  test("re-throws non-Prisma errors untouched", async () => {
    const generic = new Error("boom");
    await expect(
      withFriendlyForeignKeyError("fallback", async () => {
        throw generic;
      })
    ).rejects.toBe(generic);
  });
});

describe("reorderPositions", () => {
  test("calls model.update with monotonically increasing positions, one at a time", async () => {
    const calls: { id: string; position: number }[] = [];
    const model = {
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: { position: number } }) => {
        calls.push({ id: where.id, position: data.position });
        return { id: where.id, position: data.position };
      }),
    };

    await reorderPositions(model, ["arm_a", "arm_b", "arm_c"]);

    expect(calls).toEqual([
      { id: "arm_a", position: 0 },
      { id: "arm_b", position: 1 },
      { id: "arm_c", position: 2 },
    ]);
    expect(model.update).toHaveBeenCalledTimes(3);
  });

  test("is a no-op when the ordered id list is empty", async () => {
    const model = { update: vi.fn() };
    await reorderPositions(model, []);
    expect(model.update).not.toHaveBeenCalled();
  });

  test("awaits each update sequentially (stops on first rejection)", async () => {
    const model = {
      update: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("nope"))
        .mockResolvedValueOnce(undefined),
    };

    await expect(reorderPositions(model, ["a", "b", "c"])).rejects.toThrow("nope");
    expect(model.update).toHaveBeenCalledTimes(2);
  });
});
