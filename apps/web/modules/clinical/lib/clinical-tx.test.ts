import { describe, expect, test, vi } from "vitest";

const $transactionMock = vi.fn();

vi.mock("@continium/database", () => ({
  prisma: {
    $transaction: (
      fn: (tx: unknown) => unknown,
      options?: unknown
    ) => $transactionMock(fn, options),
  },
}));

import { type ClinicalTx, withClinicalTx } from "./clinical-tx";

describe("withClinicalTx", () => {
  test("hands the callback a branded ClinicalTx", async () => {
    $transactionMock.mockImplementation((fn: (tx: unknown) => Promise<unknown>) =>
      fn({ kind: "fake-tx" })
    );

    const captured: unknown[] = [];
    const result = await withClinicalTx(async (tx) => {
      captured.push(tx);
      // Compile-time contract: the inferred type of `tx` must be ClinicalTx.
      const _typeCheck: ClinicalTx = tx;
      void _typeCheck;
      return "ok" as const;
    });

    expect(result).toBe("ok");
    expect(captured).toHaveLength(1);
    expect($transactionMock).toHaveBeenCalledTimes(1);
  });

  test("forwards transaction options to prisma.$transaction", async () => {
    $transactionMock.mockImplementation((fn: (tx: unknown) => Promise<unknown>) =>
      fn({ kind: "fake-tx" })
    );

    await withClinicalTx(async () => "ok", {
      timeout: 60_000,
      maxWait: 5_000,
    });

    expect($transactionMock).toHaveBeenLastCalledWith(expect.any(Function), {
      timeout: 60_000,
      maxWait: 5_000,
    });
  });

  test("brand is opaque — the global prisma client cannot satisfy ClinicalTx at compile time", () => {
    // This block is a TYPE assertion only; if the brand is ever removed the
    // directive on the assignment below will become unused and CI surfaces it.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const fakePrismaClient: { $executeRaw: () => Promise<number> } = {
      $executeRaw: async () => 0,
    };
    // @ts-expect-error ClinicalTx must not accept an arbitrary db client.
    const _bad: ClinicalTx = fakePrismaClient;
    void _bad;

    // Runtime path doesn't matter here — the test exists so the directive
    // above stays live in CI.
    expect(true).toBe(true);
  });
});
