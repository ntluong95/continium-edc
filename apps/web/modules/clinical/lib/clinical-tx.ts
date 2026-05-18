import "server-only";
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@continium/database";

/**
 * Methods that exist on `PrismaClient` but not on the transaction client
 * Prisma hands the `$transaction` callback. We strip them so `ClinicalTx`
 * accurately describes what the inside of a transaction looks like.
 *
 * Prisma's own `Prisma.TransactionClient` resolves to `any`, which would
 * collapse any intersection brand on top of it. Rebasing on `PrismaClient`
 * gives us a real shape to brand.
 */
type ClinicalTxBase = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$transaction" | "$use" | "$extends" | "$on"
>;

/**
 * Branded transaction client used by clinical writes whose correctness depends
 * on being inside a transaction (advisory locks, dual-write idempotency
 * between Record and Response, etc.). The private `unique symbol` makes it
 * impossible to construct a `ClinicalTx` value outside of `withClinicalTx`,
 * so a future caller cannot accidentally pass the global `prisma` client to a
 * function whose contract is "must run in a clinical transaction".
 *
 * The brand is structural and unenforced at runtime — anyone can write
 * `prisma as unknown as ClinicalTx`, but that explicit cast shows up in code
 * review. The point is to catch the "forgot to wrap in a transaction" mistake,
 * not to defend against deliberate workarounds.
 */
declare const clinicalTxBrand: unique symbol;
export type ClinicalTx = ClinicalTxBase & {
  readonly [clinicalTxBrand]: true;
};

export interface WithClinicalTxOptions {
  /** Override the default Prisma transaction timeout (ms). */
  timeout?: number;
  /** Override the default Prisma transaction maxWait (ms). */
  maxWait?: number;
  /** Override the transaction isolation level. */
  isolationLevel?: Prisma.TransactionIsolationLevel;
}

/**
 * Opens a Prisma transaction and hands it to `fn` as a branded `ClinicalTx`.
 * This is the only public way to obtain a `ClinicalTx`. Use it at the action
 * layer; pass the same `tx` to nested service helpers that require the brand.
 */
export const withClinicalTx = <T>(
  fn: (tx: ClinicalTx) => Promise<T>,
  options: WithClinicalTxOptions = {}
): Promise<T> =>
  prisma.$transaction((tx) => fn(tx as ClinicalTx), options);
