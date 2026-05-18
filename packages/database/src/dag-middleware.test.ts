import { describe, expect, test, vi } from "vitest";
import { BYPASS_DAG_CONTEXT, withDagContext } from "./dag-context";
import { dagScopeQueryHook } from "./dag-middleware";

/**
 * `dagScopeQueryHook` is the per-query function that the Prisma extension
 * registers under `query.record.$allOperations` and
 * `query.enrollment.$allOperations`. It reads the per-request DAG context
 * from AsyncLocalStorage and injects a `where: { dagId: { in: ... } }`
 * filter into clinical reads. Tests invoke the hook directly so the
 * behaviour is verifiable without a real Prisma client.
 */

const captureQueryArgs = () => {
  const query = vi.fn().mockResolvedValue([]);
  return { query, capturedArgs: () => query.mock.calls[0]?.[0] };
};

describe("dagScopeQueryHook — read operations", () => {
  test("no DagContext → passes args through unchanged", async () => {
    const { query, capturedArgs } = captureQueryArgs();
    await dagScopeQueryHook({
      operation: "findMany",
      args: { where: { subjectId: "sub_1" } },
      query,
    });

    expect(query).toHaveBeenCalledOnce();
    expect(capturedArgs()).toEqual({ where: { subjectId: "sub_1" } });
  });

  test("bypass context → passes args through unchanged", async () => {
    const { query, capturedArgs } = captureQueryArgs();
    await withDagContext(BYPASS_DAG_CONTEXT, () =>
      dagScopeQueryHook({ operation: "findMany", args: { where: {} }, query })
    );

    expect(capturedArgs()).toEqual({ where: {} });
  });

  test("userDagIds = null (admin) → no filter injected", async () => {
    const { query, capturedArgs } = captureQueryArgs();
    await withDagContext({ userDagIds: null, bypass: false }, () =>
      dagScopeQueryHook({
        operation: "findMany",
        args: { where: { subjectId: "sub_1" } },
        query,
      })
    );

    expect(capturedArgs()).toEqual({ where: { subjectId: "sub_1" } });
  });

  test("userDagIds with values → injects dagId IN filter and preserves caller where", async () => {
    const { query, capturedArgs } = captureQueryArgs();
    await withDagContext({ userDagIds: ["dag_a", "dag_b"], bypass: false }, () =>
      dagScopeQueryHook({
        operation: "findMany",
        args: { where: { subjectId: "sub_1" } },
        query,
      })
    );

    expect(capturedArgs()).toEqual({
      where: { subjectId: "sub_1", dagId: { in: ["dag_a", "dag_b"] } },
    });
  });

  test("empty userDagIds → filter resolves to dagId IN [] (matches nothing)", async () => {
    const { query, capturedArgs } = captureQueryArgs();
    await withDagContext({ userDagIds: [], bypass: false }, () =>
      dagScopeQueryHook({ operation: "findMany", args: {}, query })
    );

    expect(capturedArgs()).toEqual({ where: { dagId: { in: [] } } });
  });

  test("every read operation gets scoped: findFirst, findUnique, count, aggregate, groupBy", async () => {
    const operations = [
      "findMany",
      "findFirst",
      "findUnique",
      "findUniqueOrThrow",
      "findFirstOrThrow",
      "count",
      "aggregate",
      "groupBy",
    ];

    for (const op of operations) {
      const { query, capturedArgs } = captureQueryArgs();
      await withDagContext({ userDagIds: ["dag_a"], bypass: false }, () =>
        dagScopeQueryHook({ operation: op, args: { where: {} }, query })
      );

      expect(capturedArgs(), `expected ${op} to be scoped`).toEqual({
        where: { dagId: { in: ["dag_a"] } },
      });
    }
  });

  test("caller-supplied dagId in where is overwritten by the scoped filter", async () => {
    // Defence in depth: a caller cannot widen their own scope by passing a
    // different dagId. The scoped filter merges last and wins.
    const { query, capturedArgs } = captureQueryArgs();
    await withDagContext({ userDagIds: ["dag_a"], bypass: false }, () =>
      dagScopeQueryHook({
        operation: "findMany",
        args: { where: { dagId: "dag_evil" } },
        query,
      })
    );

    expect(capturedArgs()).toEqual({ where: { dagId: { in: ["dag_a"] } } });
  });
});

describe("dagScopeQueryHook — write operations", () => {
  test("create is never scoped (writes must supply dagId explicitly)", async () => {
    const { query, capturedArgs } = captureQueryArgs();
    const writeArgs = {
      data: { subjectId: "sub_1", instrumentId: "inst_1", dagId: "dag_a" } as Record<string, unknown>,
    } as { where?: Record<string, unknown> };

    await withDagContext({ userDagIds: ["dag_b"], bypass: false }, () =>
      dagScopeQueryHook({ operation: "create", args: writeArgs, query })
    );

    expect(capturedArgs()).toEqual(writeArgs);
  });

  test("update / delete / upsert / createMany are passed through unchanged", async () => {
    const writeOps = ["update", "updateMany", "upsert", "delete", "deleteMany", "createMany"];
    for (const op of writeOps) {
      const { query, capturedArgs } = captureQueryArgs();
      const args = { where: { id: "rec_1" } };

      await withDagContext({ userDagIds: ["dag_a"], bypass: false }, () =>
        dagScopeQueryHook({ operation: op, args, query })
      );

      expect(capturedArgs(), `${op} should be a pass-through`).toBe(args);
    }
  });
});
