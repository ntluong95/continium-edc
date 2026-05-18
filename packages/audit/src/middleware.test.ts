import { describe, expect, it, vi } from "vitest";
import { withAuditContext } from "./context";
import { createAuditMiddleware } from "./middleware";
import type { PrismaMiddlewareParams } from "./types";

const makeParams = (overrides: Partial<PrismaMiddlewareParams> = {}): PrismaMiddlewareParams => ({
  model: "Survey",
  action: "create",
  args: { data: { name: "Test" } },
  dataPath: [],
  runInTransaction: false,
  ...overrides,
});

const makeNext = (result: unknown = { id: "r1" }) =>
  vi.fn().mockResolvedValue(result);

describe("createAuditMiddleware", () => {
  it("calls next and returns result", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const middleware = createAuditMiddleware({ write });
    const next = makeNext({ id: "r1" });

    const result = await middleware(makeParams(), next);

    expect(next).toHaveBeenCalledOnce();
    expect(result).toEqual({ id: "r1" });
  });

  it("calls write for write operations", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const middleware = createAuditMiddleware({ write });

    await middleware(makeParams({ action: "create" }), makeNext());
    // Give the fire-and-forget microtask a tick to resolve
    await new Promise((r) => setTimeout(r, 10));

    expect(write).toHaveBeenCalledOnce();
    const envelope = write.mock.calls[0][0];
    expect(envelope).toMatchObject({
      event: "PRISMA_OPERATION",
      resourceType: "Survey",
      resourceId: "r1",
      metadata: { prismaModel: "Survey", prismaAction: "create" },
    });
  });

  it("includes audit context actor when available", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const middleware = createAuditMiddleware({ write });

    await withAuditContext({ actorId: "user-1", actorIp: "1.2.3.4", userAgent: "test" }, async () => {
      await middleware(makeParams(), makeNext());
    });
    await new Promise((r) => setTimeout(r, 10));

    const envelope = write.mock.calls[0][0];
    expect(envelope.actorId).toBe("user-1");
    expect(envelope.actorIp).toBe("1.2.3.4");
  });

  it("skips AuditLog model to prevent infinite loop", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const middleware = createAuditMiddleware({ write });

    await middleware(makeParams({ model: "AuditLog" }), makeNext());
    await new Promise((r) => setTimeout(r, 10));

    expect(write).not.toHaveBeenCalled();
  });

  it("skips read operations (findMany, findFirst, count)", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const middleware = createAuditMiddleware({ write });

    for (const action of ["findMany", "findFirst", "findUnique", "count", "aggregate"]) {
      await middleware(makeParams({ action }), makeNext([]));
    }
    await new Promise((r) => setTimeout(r, 10));

    expect(write).not.toHaveBeenCalled();
  });

  it("does not throw when write fails — never surfaces to caller", async () => {
    const write = vi.fn().mockRejectedValue(new Error("pg-boss down"));
    const middleware = createAuditMiddleware({ write });

    await expect(middleware(makeParams(), makeNext())).resolves.toBeDefined();
    await new Promise((r) => setTimeout(r, 10));
    // write was called but error swallowed
    expect(write).toHaveBeenCalledOnce();
  });

  it("is disabled when enabled=false", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const middleware = createAuditMiddleware({ write, enabled: false });

    await middleware(makeParams(), makeNext());
    await new Promise((r) => setTimeout(r, 10));

    expect(write).not.toHaveBeenCalled();
  });
});
