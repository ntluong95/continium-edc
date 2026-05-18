import { describe, expect, it } from "vitest";
import { computeDiff } from "./diff";
import type { PrismaMiddlewareParams } from "./types";

const base: Omit<PrismaMiddlewareParams, "action" | "args"> = {
  model: "Survey",
  dataPath: [],
  runInTransaction: false,
};

describe("computeDiff", () => {
  it("returns create diff with after data", () => {
    const result = computeDiff(
      { ...base, action: "create", args: { data: { name: "Test", projectId: "p1" } } },
      { id: "r1", name: "Test" }
    );
    expect(result).toMatchObject({ action: "create", after: { name: "Test", projectId: "p1" } });
  });

  it("returns update diff with patch and where", () => {
    const result = computeDiff(
      { ...base, action: "update", args: { where: { id: "r1" }, data: { name: "New" } } },
      { id: "r1", name: "New" }
    );
    expect(result).toMatchObject({ action: "update", patch: { name: "New" }, where: { id: "r1" } });
  });

  it("returns delete diff with where", () => {
    const result = computeDiff(
      { ...base, action: "delete", args: { where: { id: "r1" } } },
      { id: "r1" }
    );
    expect(result).toMatchObject({ action: "delete", where: { id: "r1" } });
  });

  it("returns createMany diff with count", () => {
    const result = computeDiff(
      { ...base, action: "createMany", args: { data: [] } },
      { count: 5 }
    );
    expect(result).toMatchObject({ action: "createMany", count: 5 });
  });

  it("returns updateMany diff with count and patch", () => {
    const result = computeDiff(
      { ...base, action: "updateMany", args: { where: {}, data: { status: "active" } } },
      { count: 3 }
    );
    expect(result).toMatchObject({ action: "updateMany", count: 3, patch: { status: "active" } });
  });

  it("returns deleteMany diff with count and where", () => {
    const result = computeDiff(
      { ...base, action: "deleteMany", args: { where: { projectId: "p1" } } },
      { count: 2 }
    );
    expect(result).toMatchObject({ action: "deleteMany", count: 2, where: { projectId: "p1" } });
  });

  it("truncates oversized diff and sets truncated flag", () => {
    const bigData = Object.fromEntries(
      Array.from({ length: 2000 }, (_, i) => [`key${i.toString()}`, "x".repeat(20)])
    );
    const result = computeDiff(
      { ...base, action: "create", args: { data: bigData } },
      {}
    );
    expect(result?.truncated).toBe(true);
    expect(result?.after).toHaveProperty("_truncated", true);
  });

  it("returns null for unsupported action", () => {
    const result = computeDiff(
      { ...base, action: "findMany", args: {} },
      []
    );
    expect(result).toBeNull();
  });
});
