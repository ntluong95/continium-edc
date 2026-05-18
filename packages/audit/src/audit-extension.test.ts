import { describe, expect, test, vi } from "vitest";
import { withAuditContext } from "./context";
import { auditWriteExtensionHook } from "./middleware";

/**
 * `auditWriteExtensionHook` is the per-query function that the audit
 * Prisma client extension registers under
 * `query.$allModels.$allOperations`. The legacy `$use` middleware
 * (createAuditMiddleware) is retained for transitional callers but
 * is silently inactive in Prisma v6 because `$use` was removed.
 *
 * Tests invoke the hook directly so the behaviour can be verified
 * without a real Prisma client. Fire-and-forget audit writes are
 * awaited via a microtask tick.
 */

const makeQuery = (result: unknown = { id: "row_1" }) => vi.fn().mockResolvedValue(result);

const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 10));

describe("auditWriteExtensionHook — write operations emit an audit envelope", () => {
  test("create emits an envelope after the query resolves", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const query = makeQuery({ id: "row_1" });

    const result = await auditWriteExtensionHook(
      { model: "Survey", operation: "create", args: { data: { name: "Test" } }, query },
      { write, enabled: true }
    );

    expect(result).toEqual({ id: "row_1" });
    expect(query).toHaveBeenCalledOnce();

    await flushMicrotasks();
    expect(write).toHaveBeenCalledOnce();
    expect(write.mock.calls[0][0]).toMatchObject({
      event: "PRISMA_OPERATION",
      resourceType: "Survey",
      resourceId: "row_1",
      metadata: { prismaModel: "Survey", prismaAction: "create" },
    });
  });

  test("update and delete are emitted with the right diff shape", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const query = makeQuery({ id: "row_1" });

    await auditWriteExtensionHook(
      {
        model: "Survey",
        operation: "update",
        args: { where: { id: "row_1" }, data: { name: "Renamed" } },
        query,
      },
      { write, enabled: true }
    );
    await flushMicrotasks();
    expect(write.mock.calls[0][0].diff).toMatchObject({
      action: "update",
      patch: { name: "Renamed" },
    });

    write.mockClear();
    await auditWriteExtensionHook(
      { model: "Survey", operation: "delete", args: { where: { id: "row_1" } }, query },
      { write, enabled: true }
    );
    await flushMicrotasks();
    expect(write.mock.calls[0][0].diff).toMatchObject({
      action: "delete",
      where: { id: "row_1" },
    });
  });

  test("AuditContext actor flows into the envelope", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const query = makeQuery({ id: "row_1" });

    await withAuditContext(
      { actorId: "usr_42", actorIp: "10.0.0.1", userAgent: "vitest" },
      async () => {
        await auditWriteExtensionHook(
          { model: "Survey", operation: "create", args: { data: {} }, query },
          { write, enabled: true }
        );
      }
    );

    await flushMicrotasks();
    expect(write.mock.calls[0][0]).toMatchObject({
      actorId: "usr_42",
      actorIp: "10.0.0.1",
      userAgent: "vitest",
    });
  });
});

describe("auditWriteExtensionHook — silently skipped paths", () => {
  test("read operations do not emit", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const query = makeQuery([{ id: "row_1" }]);

    await auditWriteExtensionHook(
      { model: "Survey", operation: "findMany", args: { where: {} }, query },
      { write, enabled: true }
    );
    await flushMicrotasks();

    expect(write).not.toHaveBeenCalled();
  });

  test("AuditLog writes never emit (prevents infinite loop)", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const query = makeQuery({ id: "audit_1" });

    await auditWriteExtensionHook(
      { model: "AuditLog", operation: "create", args: { data: {} }, query },
      { write, enabled: true }
    );
    await flushMicrotasks();

    expect(write).not.toHaveBeenCalled();
  });

  test("enabled: false disables emit globally", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const query = makeQuery({ id: "row_1" });

    await auditWriteExtensionHook(
      { model: "Survey", operation: "create", args: { data: {} }, query },
      { write, enabled: false }
    );
    await flushMicrotasks();

    expect(write).not.toHaveBeenCalled();
  });

  test("a write() exception is swallowed (never surfaces to caller)", async () => {
    const write = vi.fn().mockRejectedValue(new Error("network down"));
    const query = makeQuery({ id: "row_1" });

    // The hook must not re-throw — the caller already saw a successful query.
    const result = await auditWriteExtensionHook(
      { model: "Survey", operation: "create", args: { data: {} }, query },
      { write, enabled: true }
    );
    await flushMicrotasks();

    expect(result).toEqual({ id: "row_1" });
  });
});

describe("auditWriteExtensionHook — projectId extraction", () => {
  test("reads projectId from args.where for updates", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const query = makeQuery({ id: "row_1" });

    await auditWriteExtensionHook(
      {
        model: "Project",
        operation: "update",
        args: { where: { projectId: "prj_1" }, data: { name: "X" } },
        query,
      },
      { write, enabled: true }
    );
    await flushMicrotasks();

    expect(write.mock.calls[0][0].projectId).toBe("prj_1");
  });

  test("reads projectId from args.data for creates", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const query = makeQuery({ id: "row_1" });

    await auditWriteExtensionHook(
      { model: "Survey", operation: "create", args: { data: { projectId: "prj_2", name: "S" } }, query },
      { write, enabled: true }
    );
    await flushMicrotasks();

    expect(write.mock.calls[0][0].projectId).toBe("prj_2");
  });
});
