import { describe, expect, test } from "vitest";
import {
  BYPASS_DAG_CONTEXT,
  getDagContext,
  withDagContext,
  withDagContextAsync,
} from "./dag-context";

describe("withDagContext", () => {
  test("makes the context available to synchronous callbacks", () => {
    const result = withDagContext({ userDagIds: ["dag_a"], bypass: false }, () => {
      const ctx = getDagContext();
      return ctx?.userDagIds;
    });

    expect(result).toEqual(["dag_a"]);
  });

  test("makes the context available across awaits", async () => {
    const result = await withDagContext({ userDagIds: ["dag_a"], bypass: false }, async () => {
      const before = getDagContext();
      await Promise.resolve();
      const after = getDagContext();
      return { before: before?.userDagIds, after: after?.userDagIds };
    });

    expect(result).toEqual({ before: ["dag_a"], after: ["dag_a"] });
  });

  test("nested withDagContext shadows the outer context", () => {
    const result = withDagContext({ userDagIds: ["dag_a"], bypass: false }, () => {
      const outer = getDagContext()?.userDagIds;
      const inner = withDagContext({ userDagIds: ["dag_b"], bypass: false }, () => {
        return getDagContext()?.userDagIds;
      });
      const outerAfter = getDagContext()?.userDagIds;
      return { outer, inner, outerAfter };
    });

    expect(result).toEqual({ outer: ["dag_a"], inner: ["dag_b"], outerAfter: ["dag_a"] });
  });

  test("getDagContext returns undefined outside any wrapper", () => {
    expect(getDagContext()).toBeUndefined();
  });
});

describe("withDagContextAsync", () => {
  test("preserves the inner Promise<T> shape for downstream inference", async () => {
    // The whole point of the async variant: T is the inner type, not Promise<T>.
    // This test runs at runtime; the static behaviour is the value-add.
    type Loader = () => Promise<{ id: string; nested: { count: number } }>;
    const loader: Loader = async () => ({ id: "rec_1", nested: { count: 3 } });

    const result = await withDagContextAsync(BYPASS_DAG_CONTEXT, loader);

    // If T had widened to `any` the .nested.count access would still work
    // at runtime, but the type test below pins the static shape.
    expect(result).toEqual({ id: "rec_1", nested: { count: 3 } });
    const _typed: { id: string; nested: { count: number } } = result;
    expect(_typed.id).toBe("rec_1");
  });

  test("forwards the context into the async loader", async () => {
    const result = await withDagContextAsync(
      { userDagIds: ["dag_x", "dag_y"], bypass: false },
      async () => {
        const ctx = getDagContext();
        return ctx;
      }
    );

    expect(result).toEqual({ userDagIds: ["dag_x", "dag_y"], bypass: false });
  });

  test("BYPASS_DAG_CONTEXT yields a bypass context inside the wrapper", async () => {
    const result = await withDagContextAsync(BYPASS_DAG_CONTEXT, async () => getDagContext());

    expect(result).toEqual({ userDagIds: null, bypass: true });
  });

  test("rejection in the loader propagates and the context is torn down", async () => {
    const err = new Error("loader failed");
    await expect(
      withDagContextAsync(
        { userDagIds: ["dag_a"], bypass: false },
        async () => {
          throw err;
        }
      )
    ).rejects.toBe(err);

    expect(getDagContext()).toBeUndefined();
  });
});
